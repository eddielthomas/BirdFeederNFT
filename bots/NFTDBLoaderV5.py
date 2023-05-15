import os
import json
from io import BytesIO
from pymongo import MongoClient
import requests
from PIL import Image
from multibase import encode, decode
import csv
import web3

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
        # Upload JSON to IPFS

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

        nft['unlockable_content'] = f"{IPFS_BASE_URI}{nft['edition']}-content.json"
        nft['external_url'] = f"https://birdfeeder.net/nft/{nft['edition']}"

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
        # nft['image'] = f"{IPFS_BASE_URI}{nft['edition']}.png"
        nft['image'] = f"http://167.71.176.114:8080/ipfs/{nft['image_hash']}"

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
    num_tokens = len(image_hashes)
    amounts = [1] * num_tokens
    data = [hash.encode('utf-8') for hash in image_hashes]

    return amounts, data


def prepare_batch_mint_params(image_hashes):
    amounts = 1
    data = [hash.encode('utf-8') for hash in image_hashes]

    return amounts, data


def load_nfts(json_directory, images_directory):
    nfts = []
    limitedCounter = 0
    for file in os.listdir(json_directory):
        if limitedCounter >= 10:
            break
        limitedCounter += 1
        if file.endswith(".json"):
            with open(os.path.join(json_directory, file), "r") as f:
                nft_data = json.load(f)

                # if nft_data has a property called image_hash, then we can assume that the NFT has already been uploaded to IPFS
                # if "image_hash" in nft_data:
                #     response = requests.get(
                #         f"{IPFS_GATEWAY_URL}{directory_hash}/{nft_data['edition']}.png")
                #     if response.status_code == 200:
                #         print(
                #             "Image file {" + str(nft_data['edition']) + "}.png is accessible in the BirdFeederNFT directory")
                #         # save_nft_metadata(nft_data)
                #         nfts.append(nft_data)
                #         image_hashes.append(nft_data['image_hash'])

                #         continue

                # Find the corresponding image file
                image_file = os.path.join(
                    images_directory, f"{nft_data['edition']}.png")

                # Update the image URL with the new IPFS path
                # nft_data['image'] = f"{IPFS_GATEWAY_URL}{directory_hash}/{nft_data['edition']}.png"
                nft_data['image'] = f"http://167.71.176.114:8080/ipfs/{nft_data['image_hash']}"
                nft_data['external_url'] = f"https: // birdfeeder.net/nft/{nft_data['edition']}"
                # Save the NFT metadata in the database
                save_nft_metadata(nft_data)

                # update the json file with the image
                with open(os.path.join(json_directory, file), "w") as f:
                    json.dump(nft_data, f)

                # Upload the NFT to IPFS and get the directory hash
                nft_directory_hash = upload_nft_to_ipfs(nft_data, image_file)

                nfts.append(nft_data)

    return nfts


def save_nft_metadata(metadata):
    # upsert the NFT metadata
    nft_collection.update_one(
        {"name": metadata["name"]},
        {"$set": metadata},
        upsert=True
    )

    print(f"Saved {metadata['image']} to database")


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
    directory_name = "BirdFeederV1"

    # Create the MFS directory
    response = requests.post(
        f"{IPFS_API_URL}/files/mkdir?arg=/{directory_name}&parents=true"
    )

    # Get the CID (Content Identifier) of the MFS directory
    response = requests.post(
        f"{IPFS_API_URL}/files/stat?arg=/{directory_name}"
    )
    directory_hash = response.json()["Hash"]

    IPFS_BASE_URI = f"{IPFS_GATEWAY_URL}"

    # Load NFTs
    nfts = load_nfts(JSON_DIR, IMAGES_DIR)
    # get the image hashes from mongodb
    # nfts = list(nft_collection.find({}))
    print(f"Loaded {len(nfts)} NFTs")

    # filter nfts that do not have image_hash
    nfts = [nft for nft in nfts if "image_hash" in nft]

    # Get the image hashes
    image_hashes = [nft['image_hash'] for nft in nfts]
    meta_hashes = [nft['json_hash'] for nft in nfts]
    nft_amounts = [1] * len(image_hashes)

    # Publish the directory to IPNS
    ipns_name, ipns_hash = publish_directory_to_ipns(directory_hash)
    # print(f"Published to IPNS with name {ipns_name} and hash {ipns_hash}")

    data_bytes_array = [str(ipfs_hash) for ipfs_hash in image_hashes]
    data_meta_bytes_array = [str(ipfs_hash) for ipfs_hash in meta_hashes]

    # create a list of ipfs hashes in a string format
    deployhashes = {}
    deployhashes['data'] = [str(ipfs_hash) for ipfs_hash in image_hashes]
    deployMetaHashes = {}
    deployMetaHashes['data'] = [str(ipfs_hash) for ipfs_hash in meta_hashes]

    deployhashes['amounts'] = [1] * len(image_hashes)
    # Save to a text file

    data = [web3.Web3.to_hex(text=hash[2:])
            for hash in deployMetaHashes['data']]

    dataMeta = [web3.Web3.to_hex(text=hash[2:])
                for hash in deployMetaHashes['data']]

    with open('deployMetahashes.txt', 'w') as file:
        file.write(str(deployMetaHashes['data']))
        file.write(str(deployhashes['amounts']))
    with open('deployhashes.txt', 'w') as file:
        file.write(str(deployhashes['data']))
        file.write(str(deployhashes['amounts']))

    combined_data = list(zip(data_bytes_array, nft_amounts))

    # Save to a text file
    with open('data_and_amounts.txt', 'w') as file:
        for item in combined_data:
            file.write(str(item) + "\n")

    # Save the directory hash to a file
    with open("directory_hash.txt", "w") as f:
        f.write(directory_hash)
