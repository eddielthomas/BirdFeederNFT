from web3 import Web3
from web3.middleware import geth_poa_middleware
from tkinter import *
from tkinter import messagebox, Frame, Label, SUNKEN, TOP, BOTH
from tkinter import ttk
from PIL import Image, ImageTk
import requests
import time
import os
import json
from pymongo import MongoClient


# INFURA_URL="https://mainnet.infura.io/v3/df0035f34cbe4fcf8151d0540640b36b"
# INFURA_URL = "https://goerli.infura.io/v3/df0035f34cbe4fcf8151d0540640b36b"
# Variables
INFURA_URL = "https://sepolia.infura.io/v3/df0035f34cbe4fcf8151d0540640b36b"

CONTRACT_ADDRESS = "0xc5B9fEeda15B1955899F5e0c3eA575040aD3eBD3"
ABI_PATH = "./abi.json"
DEFAULT_GAS_PRICE = "1000000000"  # 1 Gwei
DEFAULT_GAS_LIMIT = 300000


class BirdFeederApp:
    def __init__(self):
        # Create web3 instance
        self.w3 = Web3(Web3.HTTPProvider(INFURA_URL))
        self.w3.middleware_onion.inject(geth_poa_middleware, layer=0)
        self.birddb = self.connect_to_mongodb()

        # Load contract ABI
        with open(ABI_PATH, "r") as f:
            abi = json.load(f)

        # Create contract instance
        self.contract = self.w3.eth.contract(address=CONTRACT_ADDRESS, abi=abi)

        # Create GUI
        self.window = Tk()
        self.window.title("Bird Feeder NFT")
        self.window.state('zoomed')

        # Create gallery
        self.create_gallery()

        # Create notebook
        self.notebook = ttk.Notebook(self.window)
        self.notebook.pack(side=BOTTOM, pady=10, expand=True, fill=BOTH)

        # Create tabs
        self.create_mint_tab()
        self.create_lazy_mint_tab()
        self.create_discount_tab()
        self.create_withdraw_tab()

    def connect_to_mongodb(self):
        # Replace 'your_connection_string' with your MongoDB connection string
        client = MongoClient('mongodb://localhost:27017/')
        db = client['BirdNFTDB']
        return db['BirdFeederMeta']

    def create_gallery(self):
        gallery_frame = Frame(self.window, bd=2, relief=SUNKEN)
        gallery_frame.pack(side=TOP, pady=10, padx=10, fill=BOTH, expand=True)

        bird_feeder_metadata = self.birddb.find({})
        row, column = 0, 0
        for metadata in bird_feeder_metadata:
            image_url = metadata['image']

            # Load and display the image using PIL/Pillow
            image = Image.open(requests.get(image_url, stream=True).raw)
            image.thumbnail((100, 100), Image.ANTIALIAS)
            photo = ImageTk.PhotoImage(image)

            label = Label(gallery_frame, image=photo)
            label.image = photo
            label.grid(row=row, column=column)

            column += 1
            if column >= 10:
                column = 0
                row += 1

    def create_minted_gallery(self):
        gallery_frame = Frame(self.window, bd=2, relief=SUNKEN)
        gallery_frame.pack(side=TOP, pady=10, padx=10, fill=BOTH, expand=True)

        total_supply = self.contract.functions.totalSupply().call()
        row, column = 0, 0
        for i in range(total_supply):
            token_uri = self.contract.functions.tokenURI(i).call()
            response = requests.get(token_uri)
            metadata = response.json()
            image_url = metadata['image']

            # Load and display the image using PIL/Pillow
            image = Image.open(requests.get(image_url, stream=True).raw)
            image.thumbnail((100, 100), Image.ANTIALIAS)
            photo = ImageTk.PhotoImage(image)

            label = Label(gallery_frame, image=photo)
            label.image = photo
            label.grid(row=row, column=column)

            column += 1
            if column >= 10:
                column = 0
                row += 1

    def create_mint_tab(self):
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="Mint")

        # Mint price
        Label(tab, text="Mint Price (ETH)").grid(row=0, column=0)
        self.mint_price_var = StringVar()
        self.mint_price_var.set("1")
        Entry(tab, textvariable=self.mint_price_var).grid(row=0, column=1)

        # Mint amount
        Label(tab, text="Mint Amount").grid(row=1, column=0)
        self.mint_amount_var = StringVar()
        self.mint_amount_var.set("1")
        Entry(tab, textvariable=self.mint_amount_var).grid(row=1, column=1)

        # Referral code
        Label(tab, text="Referral Code").grid(row=2, column=0)
        self.referral_code_var = StringVar()
        Entry(tab, textvariable=self.referral_code_var).grid(row=2, column=1)

        # Mint button
        Button(tab, text="Mint", command=self.mint).grid(
            row=3, column=1, pady=10)

    def create_lazy_mint_tab(self):
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="Lazy Mint")

        # Mint amount
        Label(tab, text="Mint Amount").grid(row=0, column=0)
        self.lazy_mint_amount_var = StringVar()
        self.lazy_mint_amount_var.set("1")
        Entry(tab, textvariable=self.lazy_mint_amount_var).grid(row=0, column=1)

        # Referral code
        Label(tab, text="Referral Code").grid(row=1, column=0)
        self.lazy_mint_referral_code_var = StringVar()
        Entry(tab, textvariable=self.lazy_mint_referral_code_var).grid(
            row=1, column=1)

        # Mint button
        Button(tab, text="Lazy Mint", command=self.lazy_mint).grid(
            row=2, column=1, pady=10)

    def create_discount_tab(self):
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="Discount")

        # Discount percentage
        Label(tab, text="Discount Percentage (%)").grid(row=0, column=0)
        self.discount_percentage_var = StringVar()
        Entry(tab, textvariable=self.discount_percentage_var).grid(
            row=0, column=1)

        # Discount duration
        Label(tab, text="Discount Duration (minutes)").grid(row=1, column=0)
        self.discount_duration_var = StringVar()
        Entry(tab, textvariable=self.discount_duration_var).grid(row=1, column=1)

        # Discount button
        Button(tab, text="Create Discount", command=self.create_discount).grid(
            row=2, column=1, pady=10)

    def create_withdraw_tab(self):
        tab = ttk.Frame(self.notebook)
        self.notebook.add(tab, text="Withdraw")

        # Address to withdraw to
        Label(tab, text="Withdraw to address").grid(row=0, column=0)
        self.withdraw_address_var = StringVar()
        Entry(tab, textvariable=self.withdraw_address_var).grid(row=0, column=1)

        # Amount to withdraw
        Label(tab, text="Amount to withdraw (ETH)").grid(row=1, column=0)
        self.withdraw_amount_var = StringVar()
        Entry(tab, textvariable=self.withdraw_amount_var).grid(row=1, column=1)

        # Withdraw button
        Button(tab, text="Withdraw", command=self.withdraw).grid(
            row=2, column=1, pady=10)

    def mint(self):
        # Get user input
        price = int(float(self.mint_price_var.get()) * 10 ** 18)
        amount = int(self.mint_amount_var.get())
        referral_code = self.referral_code_var.get()

        # Check if the user has enough balance to pay for the minting
        user_balance = self.w3.eth.get_balance(self.w3.eth.accounts[0])
        total_price = price * amount
        if user_balance < total_price:
            messagebox.showerror("Error", "Not enough balance to mint.")
            return

        # Call the contract's mint function
        tx_hash = self.contract.functions.mint(amount, referral_code).buildTransaction({
            "from": self.w3.eth.accounts[0],
            "value": total_price,
            "gasPrice": self.w3.toWei(DEFAULT_GAS_PRICE, "gwei"),
            "gas": DEFAULT_GAS_LIMIT
        })
        signed_tx = self.w3.eth.account.sign_transaction(
            tx_hash, private_key=os.getenv("PRIVATE_KEY"))
        self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Show success message
        messagebox.showinfo(
            "Success", f"{amount} NFTs have been minted successfully.")

    def lazy_mint(self):
        # Get user input
        amount = int(self.lazy_mint_amount_var.get())
        referral_code = self.lazy_mint_referral_code_var.get()

        # Call the contract's lazy mint function
        tx_hash = self.contract.functions.lazyMint(amount, referral_code).buildTransaction({
            "from": self.w3.eth.accounts[0],
            "gasPrice": self.w3.toWei(DEFAULT_GAS_PRICE, "gwei"),
            "gas": DEFAULT_GAS_LIMIT
        })
        signed_tx = self.w3.eth.account.sign_transaction(
            tx_hash, private_key=os.getenv("PRIVATE_KEY"))
        self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Show success message
        messagebox.showinfo(
            "Success", f"{amount} NFTs have been lazily minted successfully.")

    def create_discount(self):
        # Get user input
        discount_percentage = int(self.discount_percentage_var.get())
        discount_duration = int(self.discount_duration_var.get())

        # Calculate discount amount
        total_supply = self.contract.functions.totalSupply().call()
        discount_amount = total_supply * discount_percentage // 100

        # Call the contract's createDiscount function
        tx_hash = self.contract.functions.createDiscount(discount_amount, discount_duration).buildTransaction({
            "from": self.w3.eth.accounts[0],
            "gasPrice": self.w3.toWei(DEFAULT_GAS_PRICE, "gwei"),
            "gas": DEFAULT_GAS_LIMIT
        })
        signed_tx = self.w3.eth.account.sign_transaction(
            tx_hash, private_key=os.getenv("PRIVATE_KEY"))
        self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Show success message
        messagebox.showinfo(
            "Success", f"A discount of {discount_percentage}% has been created for {discount_duration} minutes.")

    def withdraw(self):
        # Get user input
        withdraw_address = self.withdraw_address_var.get()
        withdraw_amount = int(float(self.withdraw_amount_var.get()) * 10 ** 18)

        # Call the contract's withdraw function
        tx_hash = self.contract.functions.withdraw(withdraw_address, withdraw_amount).buildTransaction({
            "from": self.w3.eth.accounts[0],
            "gasPrice": self.w3.toWei(DEFAULT_GAS_PRICE, "gwei"),
            "gas": DEFAULT_GAS_LIMIT
        })
        signed_tx = self.w3.eth.account.sign_transaction(
            tx_hash, private_key=os.getenv("PRIVATE_KEY"))
        self.w3.eth.send_raw_transaction(signed_tx.rawTransaction)

        # Show success message
        messagebox.showinfo(
            "Success", f"{withdraw_amount / 10 ** 18} ETH has been withdrawn successfully.")

    def run(self):
        self.window.mainloop()


if __name__ == "__main__":
    app = BirdFeederApp()
    app.run()
