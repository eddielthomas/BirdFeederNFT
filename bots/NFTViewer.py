import os
import json
import streamlit as st
from PIL import Image
from pymongo import MongoClient

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017")
db = client["BirdNFTDB"]
nft_collection = db["BirdFeederMeta"]


def load_nfts(directory):
    nfts = []
    for file in os.listdir(directory):
        if file.endswith(".json"):
            with open(os.path.join(directory, file), "r") as f:
                nft_data = json.load(f)
                nfts.append(nft_data)
    return nfts


def save_nft_metadata(metadata):
    # if nft_collection.find_one({"name": metadata["name"]}):
    #     print("NFT already exists in database")
    if nft_collection.find_one({"image": metadata["image"]}):
        print("NFT already exists in database")
    else:
        nft_collection.insert_one(metadata)


def main():
    st.set_page_config(page_title="NFT Gallery", layout="wide")
    st.title("NFT Gallery")

    nft_directory = "metadata"  # Replace with the path to your NFT data directory
    nfts = load_nfts(nft_directory)

    # Sort NFTs by rarity
    nfts.sort(key=lambda x: x["attributes"][-1]["value"])

    # Display NFTs in an infinite scroll gallery
    for nft in nfts:
        image_path = os.path.join(os.getcwd()+"\images", nft["image"][1:])
    # Save metadata to MongoDB
        # save_nft_metadata(nft)
        image = Image.open(image_path)
        st.image(image, use_column_width=True)

        # Show the enlarged NFT with attributes in a modal when clicked
        if st.button(nft["name"]):
            st.write(nft["name"])
            st.image(image, use_column_width=True)

            st.write("Attributes:")
            for attr in nft["attributes"]:
                st.write(f"{attr['trait_type']}: {attr['value']}")


if __name__ == "__main__":
    main()
