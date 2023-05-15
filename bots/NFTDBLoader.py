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

image_hashes = []
nft_amounts = []
NFT_STORAGE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweGI4NzdjN0FBOUQ1MkM5OWI3RDVlQWU1NThGMzZlMmI3OGUyYjlhMkQiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY4MjYzMTE4Mjk3NiwibmFtZSI6IkJpcmRGZWVkZXIifQ.r3oe-Dow6og8gVbdOp0yjHFoUZZf7uqUiBkXEpeEYXk"
JSON_DIR = "H:\\Projects\\BirdFeeder\\NFTS\\json"
IMAGES_DIR = "H:\\Projects\\BirdFeeder\\NFTS\\images"


def upload_file_to_nft_storage(file_path):
    headers = {
        "Authorization": f"Bearer {NFT_STORAGE_API_KEY}"
    }
    with open(file_path, 'rb') as f:
        files = {"file": (os.path.basename(file_path), f)}
        response = requests.post(
            "https://api.nft.storage/upload", headers=headers, files=files)
    return response.json()


def GET_IMAGE_URI(imagehash, tokenId):
    return "https://" + imagehash + ".ipfs.dweb.link/" + str(tokenId) + ".png"


def GET_JSON_URI(jsonhash, tokenId):
    return "https://" + jsonhash + ".ipfs.dweb.link/" + str(tokenId) + ".json"


def upload_nft_to_nft_storage(nft, image_file):
    try:
        # Upload image to NFT Storage
        image_response = upload_file_to_nft_storage(image_file)
        image_cid = image_response["value"]["cid"]

        # Update the image URL with the new IPFS path
        nft['image'] = GET_IMAGE_URI(image_cid, nft['edition'])
        nft['image_hash'] = image_cid

        # update the json file
        json_file = os.path.join(JSON_DIR, str(nft['edition']) + ".json")
        with open(json_file, 'w') as f:
            json.dump(nft, f)

        # Upload the NFT metadata to NFT Storage
        nft_response = upload_file_to_nft_storage(json_file)
        nft_cid = nft_response["value"]["cid"]

        # Update the NFT metadata URL with the new IPFS path
        nft['json_hash'] = nft_cid
        nft['metadata'] = GET_JSON_URI(nft_cid, nft['edition'])
        # Save the NFT metadata in the database
        save_nft_metadata(nft)
        return nft_cid

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
                # nft_data['image'] = f"ipfs://{nft_data['image_hash']}"

                nft_data['external_url'] = f"https://birdfeeder.net/nft/{nft_data['edition']}"
                nft_data['unlockable_content'] = f"https://birdfeeder.net/nft/{nft_data['edition']}/unlockable-content"
                # Save the NFT metadata in the database

                # update the json file with the image
                with open(os.path.join(json_directory, file), "w") as f:
                    json.dump(nft_data, f)

                # Upload the NFT to IPFS and get the directory hash
                 # Upload the NFT to NFT Storage and get the CID
                nft_cid = upload_nft_to_nft_storage(nft_data, image_file)
                nft_data['json_hash'] = nft_cid
                nft_data['image'] = GET_IMAGE_URI(
                    nft_data['image_hash'], nft_data['edition'])
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

    print(f"Saved {metadata['image']} to database")


if __name__ == "__main__":
    # IPFS configuration

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
