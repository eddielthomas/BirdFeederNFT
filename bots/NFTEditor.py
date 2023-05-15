import os
import json
import streamlit as st
from PIL import Image
from io import BytesIO
from pymongo import MongoClient
import requests

# Connect to MongoDB
client = MongoClient("mongodb://localhost:27017")
db = client["BirdNFTDB"]
nft_collection = db["BirdFeederMeta"]

# IPFS configuration
IPFS_GATEWAY_URL = "https://ipfs.io/ipfs/"
IPFS_API_URL = "http://localhost:5001/api/v0"
IPFS_DIRECTORY = "birdfeeder_nfts"


def load_nfts(directory):
    nfts = []
    for file in os.listdir(directory):
        if file.endswith(".json"):
            with open(os.path.join(directory, file), "r") as f:
                nft_data = json.load(f)
                nfts.append(nft_data)
    return nfts


def save_nft_metadata(metadata):
    if nft_collection.find_one({"image": metadata["image"]}):
        print("NFT already exists in database")
    else:
        nft_collection.insert_one(metadata)


# def update_nft_metadata(metadata):
#     nft_collection.update_one({"image": metadata["image"]}, {"$set": metadata})


def display_nft_modal(nft):
    # Create a full-screen overlay to display the enlarged NFT with editable attributes
    overlay = st.form(key=f"nft_form_{nft['name']}")
    with overlay:
        st.write("")
        st.write("")
        col1 = st.container()
        col2 = st.container()
        with col1:
            st.image(Image.open(os.path.join(
                os.getcwd()+"\images", nft["image"][1:])), width=300)
        with col2:
            st.subheader(nft["name"])
            st.write("Name:")
            new_name = st.text_input("", value=nft["name"])
            st.write("Symbol:")
            new_symbol = st.text_input("", value=nft["symbol"])
            st.write("Description:")
            new_description = st.text_area("", value=nft["description"])
            st.write("Seller Fee Basis Points:")
            new_seller_fee_basis_points = st.number_input(
                "", value=nft["seller_fee_basis_points"])
            st.write("External URL:")
            new_external_url = st.text_input("", value=nft["external_url"])
            st.write("Backgrounds:")
            new_backgrounds = st.text_input(
                "", value=nft["attributes"][0]["value"])
            st.write("Swords:")
            new_swords = st.text_input("", value=nft["attributes"][1]["value"])
            st.write("Bases:")
            new_bases = st.text_input("", value=nft["attributes"][2]["value"])
            st.write("Cloths:")
            new_cloths = st.text_input("", value=nft["attributes"][3]["value"])
            st.write("Mouths:")
            new_mouths = st.text_input("", value=nft["attributes"][4]["value"])
            st.write("Eyes:")
            new_eyes = st.text_input("", value=nft["attributes"][5]["value"])
            st.write("Hats:")
            new_hats = st.text_input("", value=nft["attributes"][6]["value"])
            st.write("Rarity Rank:")
            new_rarity_rank = st.number_input(
                "", value=nft["attributes"][7]["value"], max_value=10000)
            if st.form_submit_button("Save"):
                nft["name"] = new_name
                nft["symbol"] = new_symbol
                nft["description"] = new_description
                nft["seller_fee_basis_points"] = new_seller_fee_basis_points
                nft["external_url"] = new_external_url
                nft["attributes"][0]["value"] = new_backgrounds
                nft["attributes"][1]["value"] = new_swords
                nft["attributes"][2]["value"] = new_bases
                nft["attributes"][3]["value"] = new_cloths
                nft["attributes"][4]["value"] = new_mouths
                nft["attributes"][5]["value"] = new_eyes
                nft["attributes"][6]["value"] = new_hats
                nft["attributes"][7]["value"] = new_rarity_rank

                st.write("Attributes updated successfully!")
                st.experimental_rerun()


def update_nft_metadata(metadata):
    # Upload image to IPFS if necessary
    if metadata["image"].startswith("http"):
        if IPFS_GATEWAY_URL in metadata["image"]:
            image_file = metadata["image"].split(IPFS_GATEWAY_URL)[-1]
        else:
            image_file = metadata["image"]

        # get the image path from the images folder
        image_file = os.path.join("images", metadata["image"].split("/")[-1])

        response = requests.post(
            f"{IPFS_API_URL}/add", files={"file": open(image_file, "rb")})
        if response.status_code != 200:
            st.error("Failed to upload image to IPFS")
            return
        metadata["image"] = f"{IPFS_GATEWAY_URL}{response.json()['Hash']}"
    else:
        metadata["image"] = f"{IPFS_GATEWAY_URL}{metadata['image']}"
        if IPFS_GATEWAY_URL in metadata["image"]:
            image_file = metadata["image"].split(IPFS_GATEWAY_URL)[-1]
        else:
            image_file = metadata["image"]

        # get the image path from the images folder
        image_file = os.path.join("images", metadata["image"].split("/")[-1])

        response = requests.post(
            f"{IPFS_API_URL}/add", files={"file": open(image_file, "rb")})
        if response.status_code != 200:
            st.error("Failed to upload image to IPFS")
            return
        metadata["image"] = f"{IPFS_GATEWAY_URL}{response.json()['Hash']}"

    # Update metadata in MongoDB
    nft_collection.update_one({"image": metadata["image"]}, {"$set": metadata})
    st.success("NFT metadata updated successfully")


def main():
    st.set_page_config(page_title="NFT Gallery", layout="wide")
    st.title("NFT Gallery")

    nft_directory = "metadata"  # Replace with the path to your NFT data directory
    # nfts = load_nfts(nft_directory)
    # load nfts from mongodb
    nfts = list(nft_collection.find())

    # Sort NFTs by rarity
    # nfts.sort(key=lambda x: x["attributes"][-1]["value"])

    # Display NFTs in rows of 10 icons
    form_counter = 0
    for i in range(0, len(nfts), 10):
        row = st.columns(10)
        for j, nft in enumerate(nfts[i:i+10]):
            image_path = os.path.join(os.getcwd()+"\images", nft["image"][1:])
            image = Image.open(image_path)
            img_bytes = BytesIO()
            image.save(img_bytes, format='PNG')
            update_nft_metadata(nft)
            with row[j % 10]:
                if st.image(img_bytes.getvalue(), use_column_width=True, caption=nft["name"]):
                    if st.button(f"Edit Attributes ({nft['name']})"):
                        display_nft_modal(nft)


if __name__ == "__main__":
    main()
