// SPDX-License-Identifier: MIT

pragma solidity ^0.8.2;

import "./ERC721.sol";
import "./Counters.sol";

contract BIRDRNFT is ERC721 {
  using Counters for Counters.Counter;
  Counters.Counter private _tokenIds;

  constructor()  ERC721("BIRDFEEDER NFT", "BIRDRNFT") {

  }
  struct BirdRNFT{
    uint256 id;
    address payable creator;
    address tokenAddress;
    string uri;
    uint8 royalty;
  }

  mapping(uint256 => BirdRNFT) public BirdRNFTs;

  function createBirdRNFT(string memory uri, uint8 royalty) public returns(uint256){
    require(royalty > 0, "Royalty cannot be zero or smaller than zero");

    _tokenIds.increment();

    uint256 newBirdRNFTId = _tokenIds.current();

    _safeMint(payable(msg.sender), newBirdRNFTId);

    BirdRNFTs[newBirdRNFTId] = BirdRNFT(newBirdRNFTId, payable(msg.sender), address(this), uri, royalty);

    return newBirdRNFTId;
  }

function createBirdRNFTBundle(string memory uri, uint8 royalty, uint256 quantity) public returns(uint256[] memory){
    require(royalty > 0, "Royalty cannot be zero or smaller than zero");
    require(quantity > 1, "Bundle Quantity cannot be 1 or smaller than 1");
    
    uint256[] memory _BIRDRCoinIds = new uint256[](quantity);
    
    for (uint i=0; i<quantity; i++) {

        _tokenIds.increment();

        uint256 newBirdRNFTId = _tokenIds.current();

        _safeMint(payable(msg.sender), newBirdRNFTId);

        BirdRNFTs[newBirdRNFTId] = BirdRNFT(newBirdRNFTId, payable(msg.sender), address(this), uri, royalty);

        _BIRDRCoinIds[i] = newBirdRNFTId;

    }

    return _BIRDRCoinIds;
  }

  function tokenURI(uint256 tokenId) public view override returns (string memory) {
    require(_exists(tokenId), "ERC721Metadata: URI query for nonexistent token");

    return BirdRNFTs[tokenId].uri;
  }

  function getRoyalty(uint256 tokenId) external virtual view returns(uint8 royalty){
    require(_exists(tokenId), "ERC721Metadata: Royalty query for nonexistent token");

    return BirdRNFTs[tokenId].royalty;
  }

  function getCreator(uint256 tokenId) external virtual view returns(address payable creator){
    require(_exists(tokenId), "ERC721Metadata: Creator query for nonexistent token");

    return payable(BirdRNFTs[tokenId].creator);
  }

  function getAsset(uint256 tokenId) external virtual view returns(BirdRNFT memory){
    require(_exists(tokenId), "ERC721Metadata: Description query for nonexistent token");

    return BirdRNFTs[tokenId];
  }
  
}