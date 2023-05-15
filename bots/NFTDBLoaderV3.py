import os
import json
from io import BytesIO
from pymongo import MongoClient
import requests
from PIL import Image
from multibase import encode, decode
import csv

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017")
db = client["BirdNFTDB"]
nft_collection = db["BirdFeederMeta"]
directory_hash = ""
IPFS_BASE_URI = ""
image_hashes = []
nft_amounts = []


def upload_file_to_ipfs(file_path):
    with open(file_path, 'rb') as f:
        response = requests.post(f"{IPFS_API_URL}/add", files={"file": f})
    return response.json()["Hash"]


def upload_nft_to_ipfs(nft, image_file):
    try:
        # Upload image to IPFS
        with open(image_file, 'rb') as f:
            response = requests.post(
                f"{IPFS_API_URL}/add", files={"file": f},
                params={'chunker': 'size-262144'}
            )
        image_hash = response.json()["Hash"]
        image_hashes.append(image_hash)
        nft_amounts.append(1)

        nft['image_hash'] = image_hash

        files = {"file": BytesIO(json.dumps(nft).encode())}
        response = requests.post(
            f"{IPFS_API_URL}/add",
            files=files,
            params={'chunker': 'size-262144'}
        )
        json_hash = response.json()["Hash"]

        # Add JSON and image to the BirdFeederNFT directory
        response = requests.post(
            f"{IPFS_API_URL}/files/cp?arg=/ipfs/{json_hash}&arg=/{directory_name}/{nft['edition']}.json"
        )
        response = requests.post(
            f"{IPFS_API_URL}/files/cp?arg=/ipfs/{image_hash}&arg=/{directory_name}/{nft['edition']}.png"
        )

        # Update the image URL with the new IPFS path
        nft['image'] = f"{IPFS_BASE_URI}{nft['edition']}.png"

        nft['json_hash'] = json_hash

        # Get the updated directory hash
        response = requests.post(
            f"{IPFS_API_URL}/files/stat?arg=/{directory_name}"
        )
        updated_directory_hash = response.json()["Hash"]

        return updated_directory_hash

    except Exception as e:
        print(e)
        return None


def prepare_batch_mint_params(image_hashes):
    amounts = [1] * len(image_hashes)
    data = [hash.encode('utf-8') for hash in image_hashes]

    return amounts, data

# Removed the duplicate implementation of prepare_batch_mint_params function


def load_nfts(json_directory, images_directory):
    nfts = []
    for file in os.listdir(json_directory):
        if file.endswith(".json"):
            with open(os.path.join(json_directory, file), "r") as f:
                nft_data = json.load(f)

                if "image_hash" in nft_data:
                    response = requests.get(
                        f"{IPFS_GATEWAY_URL}{directory_hash}/{nft_data['edition']}.png")
                    if response.status_code == 200:
                        print(
                            "Image file {" + str(nft_data['edition']) + "}.png is accessible in the BirdFeederNFT directory")
                        nfts.append(nft_data)
                        image_hashes.append(nft_data)
                        image_hashes.append(
                            nft_data['image_hash'])

                        if (len(nfts) >= 10):
                            break

                        continue

                    # Find the corresponding image file
                image_file = os.path.join(
                    images_directory, f"{nft_data['edition']}.png")

                # Upload the NFT to IPFS and get the directory hash
                nft_directory_hash = upload_nft_to_ipfs(
                    nft_data, image_file)

                # Update the image URL with the new IPFS path
                nft_data['image'] = f"{IPFS_GATEWAY_URL}{directory_hash}/{nft_data['edition']}.png"

                # Save the NFT metadata in the database
                save_nft_metadata(nft_data)

            nfts.append(nft_data)

    return nfts


def save_nft_metadata(metadata):

    # upsert the NFT metadata
    nft_collection.update_one(
        {"name": metadata["name"]},
        {"$set": metadata},
        upsert=True
    )

    print(
        f"Saved {metadata['image']} to database")


def publish_directory_to_ipns(directory_hash):

    response = requests.post(
        f"{IPFS_API_URL}/name/publish?arg={directory_hash}"
    )
    return response.json()["Name"], response.json()["Value"]


if __name__ == "__main__":
    # IPFS configuration
    IPFS_GATEWAY_URL = "http://167.71.176.114:8080/ipfs/"
    IPFS_API_URL = "http://167.71.176.114:5001/api/v0"
    JSON_DIR = "./json"
    IMAGES_DIR = "./images"

    # Create a directory for the NFT
    directory_name = "BirdFeederNFT"

    # Create the MFS directory
    response = requests.post(
        f"{IPFS_API_URL}/files/mkdir?arg=/{directory_name}&parents=true"
    )

    # Get the CID (Content Identifier) of the MFS directory
    response = requests.post(
        f"{IPFS_API_URL}/files/stat?arg=/{directory_name}"
    )
    directory_hash = response.json()[
        "Hash"]

    IPFS_BASE_URI = f"{IPFS_GATEWAY_URL}{directory_hash}/"

    # Load NFTs
    nfts = load_nfts(
        JSON_DIR, IMAGES_DIR)
    print(f"Loaded {len(nfts)} NFTs")

    data_bytes_array = [decode(ipfs_hash)
                        for ipfs_hash in image_hashes]
    combined_data = list(
        zip(data_bytes_array, nft_amounts))

    # Save to a text file
    with open('data_and_amounts.txt', 'w') as file:
        for item in combined_data:
            file.write(str(item) + "\n")

    # Save the directory hash to a file
    with open("directory_hash.txt", "w") as f:
        f.write(directory_hash)
