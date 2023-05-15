// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./FeatureKeys.sol";
import "./IERC2981.sol";

contract BirdFeederNFT is
    ERC721,
    FeatureKeys,
    Ownable,
    ReentrancyGuard,
    IERC2981
{
    using ECDSA for bytes32;

    uint256 private _mintPrice;
    uint256 private _referralDiscountRate;
    uint256 private _referralRewardRate;
    uint256 private _transferRate;
    uint256 private _royaltyRate;
    string private _baseURI;

    struct LazyMint {
        address to;
        uint256 tokenId;
        string tokenURI;
        address signer;
        bytes signature;
    }

    mapping(uint256 => LazyMint) public lazyMints;
    mapping(address => bytes32) public referralCodes;
    mapping(bytes32 => address) public referralCodeOwners;
    mapping(address => uint256) public referralRewards;
    mapping(uint256 => string) private _additionalMetadata;

    constructor() ERC721("BirdFeeder NFT", "BFNFT") {}

    function setMintPrice(uint256 newMintPrice) public onlyOwner {
        _mintPrice = newMintPrice;
    }

    function setReferralDiscountRate(uint256 newRate) public onlyOwner {
        _referralDiscountRate = newRate;
    }

    function setReferralRewardRate(uint256 newRate) public onlyOwner {
        _referralRewardRate = newRate;
    }

    function setTransferRate(uint256 newRate) public onlyOwner {
        _transferRate = newRate;
    }

    function setRoyaltyRate(uint256 newRate) public onlyOwner {
        _royaltyRate = newRate;
    }

    function setAdditionalMetadata(
        uint256 tokenId,
        string memory metadata
    ) public onlyOwner {
        _additionalMetadata[tokenId] = metadata;
    }

    function getAdditionalMetadata(
        uint256 tokenId
    ) public view returns (string memory) {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );
        return _additionalMetadata[tokenId];
    }

    function royaltyInfo(
        uint256 _tokenId,
        uint256 _salePrice
    ) external view override returns (address receiver, uint256 royaltyAmount) {
        receiver = owner();
        royaltyAmount = (_salePrice * _royaltyRate) / 100;
    }

    function setTransferRate(uint256 newRate) public onlyOwner {
        _transferRate = newRate;
    }

    function setRoyaltyRate(uint256 newRate) public onlyOwner {
        _royaltyRate = newRate;
    }

    function setAdditionalMetadata(
        uint256 tokenId,
        string memory metadata
    ) public onlyOwner {
        _additionalMetadata[tokenId] = metadata;
    }

    function mint(
        address to,
        uint256 tokenId,
        string memory tokenURI,
        bytes32 referralCode
    ) public payable nonReentrant {
        uint256 price = _mintPrice;
        address referrer = referralCodeOwners[referralCode];
        if (referrer != address(0)) {
            price = (_mintPrice * (100 - _referralDiscountRate)) / 100;
        }
        require(msg.value >= price, "Not enough Ether sent for minting");

        _mint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);

        // Distribute referral reward
        if (referrer != address(0)) {
            uint256 referralReward = (msg.value * _referralRewardRate) / 100;
            payable(referrer).transfer(referralReward);
        }
    }

    function executeLazyMint(
        LazyMint memory lazyMint,
        bytes32 referralCode
    ) public payable nonReentrant {
        uint256 price = _mintPrice;
        address referrer = referralCodeOwners[referralCode];
        if (referrer != address(0)) {
            price = (_mintPrice * (100 - _referralDiscountRate)) / 100;
        }
        require(msg.value >= price, "Not enough Ether sent for minting");

        require(
            lazyMints[lazyMint.tokenId].to == address(0),
            "Token has already been lazily minted"
        );
        require(
            lazyMint.signature.verify(_hashLazyMint(lazyMint), lazyMint.signer),
            "Invalid lazy mint signature"
        );

        _mint(lazyMint.to, lazyMint.tokenId);
        _setTokenURI(lazyMint.tokenId, lazyMint.tokenURI);

        delete lazyMints[lazyMint.tokenId];

        // Distribute referral reward
        if (referrer != address(0)) {
            uint256 referralReward = (msg.value * _referralRewardRate) / 100;
            payable(referrer).transfer(referralReward);
        }
    }

    function batchMint(
        address to,
        uint256[] memory tokenIds,
        string[] memory tokenURIs
    ) public payable nonReentrant {
        require(
            tokenIds.length == tokenURIs.length,
            "Token IDs and URIs length mismatch"
        );
        require(
            msg.value >= _mintPrice * tokenIds.length,
            "Not enough Ether sent for minting"
        );
        for (uint256 i = 0; i < tokenIds.length; i++) {
            _mint(to, tokenIds[i]);
            _setTokenURI(tokenIds[i], tokenURIs[i]);
        }
    }

    function lazyMint(LazyMint memory lazyMint) public onlyOwner {
        require(
            lazyMints[lazyMint.tokenId].to == address(0),
            "Token has already been lazily minted"
        );
        lazyMints[lazyMint.tokenId] = lazyMint;
    }

    function generateReferralCode() public {
        bytes32 code = keccak256(abi.encodePacked(msg.sender));
        referralCodes[msg.sender] = code;
        referralCodeOwners[code] = msg.sender;
    }

    function withdrawBalance() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function _hashLazyMint(
        LazyMint memory lazyMint
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(lazyMint));
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseURI;
    }

    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseURI = baseURI;
    }

    function supportsInterface(
        bytes4 interfaceId
    ) public view override(ERC721, IERC2981) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
