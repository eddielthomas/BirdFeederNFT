// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract NFTStaking is ERC1155, Ownable, ReentrancyGuard {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    address public treasury;
    uint256 public creatorRoyalty = 5; // 5% creator royalty
    uint256 public transferFee = 5; // 5% transfer fee
    uint256 public discountRate = 10; // 10% discount
    uint256 public referralRewardPercentage = 50; // 50% of the minted NFT
    uint256 public maxReferralCodesPerUser = 3; // Limit the number of referral codes a user can generate

    mapping(bytes32 => address) public referralCodes;
    mapping(address => uint256) public discounts;
    mapping(address => uint256) public referralCodesGenerated;
    mapping(uint256 => address) public creators;

    constructor(string memory uri, address _treasury) ERC1155(uri) {
        treasury = _treasury;
    }

    // Other functions (royaltyInfo, _beforeTokenTransfer, etc.) remain the same

    function mint(address to, uint256 amount, bytes memory data) external payable nonReentrant {
        require(msg.value >= 1 ether, "Insufficient payment");

        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        // Refund excess payment
        if (msg.value > 1 ether) {
            payable(msg.sender).transfer(msg.value - 1 ether);
        }

        // Mint the NFT
        _mint(to, tokenId, amount, data);
    }

    function batchMint(address[] memory recipients, uint256[] memory amounts, bytes[] memory data) external payable nonReentrant {
        require(recipients.length == amounts.length && amounts.length == data.length, "Input array lengths do not match");
        require(msg.value >= recipients.length * 1 ether, "Insufficient payment");

        for (uint256 i = 0; i < recipients.length; i++) {
            mint(recipients[i], amounts[i], data[i]);
        }

        // Refund excess payment
        uint256 totalCost = recipients.length * 1 ether;
        if (msg.value > totalCost) {
            payable(msg.sender).transfer(msg.value - totalCost);
        }
    }

    function generateReferralCode(uint256 tokenId) external returns (bytes32) {
        require(balanceOf(msg.sender, tokenId) > 0, "Only NFT owners can generate referral codes");
        require(referralCodesGenerated[msg.sender] < maxReferralCodesPerUser, "Max referral codes limit reached");

        bytes32 referralCode = keccak256(abi.encodePacked(msg.sender, tokenId, block.timestamp));
        referralCodes[referralCode] = msg.sender;
        referralCodesGenerated[msg.sender]++;

        return referralCode;
    }

    function mintWithReferralCode(address to, uint256 amount, bytes32 referralCode) external payable nonReentrant {
        require(referralCodes[referralCode] != address(0), "Invalid referral code");
        uint256 discountedPrice = 1 ether * (100 - discountRate) / 100;

        require(msg.value >= discountedPrice, "Insufficient payment after discount");
  // Refund excess payment
    if (msg.value > discountedPrice) {
        payable(msg.sender).transfer(msg.value - discountedPrice);
    }

    // Send referral reward
    address referrer = referralCodes[referralCode];
    uint256 referrerReward = amount * referralRewardPercentage / 100;
    _mint(referrer, _tokenIds.current(), referrerReward, "");

    // Mint the NFT
    mint(to, amount - referrerReward, "");
}

// Add a function to set the discount rate
function setDiscountRate(uint256 newDiscountRate) external onlyOwner {
    require(newDiscountRate >= 0 && newDiscountRate <= 100, "Invalid discount rate");
    discountRate = newDiscountRate;
}

// Add a function to set the referral reward percentage
function setReferralRewardPercentage(uint256 newReferralRewardPercentage) external onlyOwner {
    require(newReferralRewardPercentage >= 0 && newReferralRewardPercentage <= 100, "Invalid referral reward percentage");
    referralRewardPercentage = newReferralRewardPercentage;
}

// Add a function to set the creator royalty
function setCreatorRoyalty(uint256 newCreatorRoyalty) external onlyOwner {
    require(newCreatorRoyalty >= 0 && newCreatorRoyalty <= 100, "Invalid creator royalty");
    creatorRoyalty = newCreatorRoyalty;
}

// Add a function to set the transfer fee
function setTransferFee(uint256 newTransferFee) external onlyOwner {
    require(newTransferFee >= 0 && newTransferFee <= 100, "Invalid transfer fee");
    transferFee = newTransferFee;
}

// Add a function to set the treasury address
function setTreasury(address newTreasury) external onlyOwner {
    treasury = newTreasury;
}

// Add a function to set the maximum number of referral codes per user
function setMaxReferralCodesPerUser(uint256 newMaxReferralCodesPerUser) external onlyOwner {
    require(newMaxReferralCodesPerUser > 0, "Invalid maximum referral codes per user");
    maxReferralCodesPerUser = newMaxReferralCodesPerUser;
}

  // Implement a royaltyInfo function that returns royalty information for a given token ID
    function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount) {
        address creator = creators[tokenId];
        uint256 royalty = (salePrice * creatorRoyalty) / 100;
        return (creator, royalty);
    }

    // Override the _beforeTokenTransfer function from ERC1155 to handle transfer fees and royalties
    function _beforeTokenTransfer(address operator, address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) internal virtual override {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        if (from == address(0) || to == address(0)) {
            // Mint or burn operation, do not apply fees or royalties
            return;
        }

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 tokenId = ids[i];
            uint256 amount = amounts[i];

            // Calculate and transfer the creator royalty
            uint256 royalty = (amount * creatorRoyalty) / 100;
            if (royalty > 0) {
                address creator = creators[tokenId];
                require(balanceOf(from, tokenId) >= royalty, "Insufficient balance for royalties");
                _safeTransferFrom(from, creator, tokenId, royalty, data);
            }

            // Calculate and transfer the transfer fee
            uint256 fee = (amount * transferFee) / 100;
            if (fee > 0) {
                require(balanceOf(from, tokenId) >= fee, "Insufficient balance for transfer fee");
                _safeTransferFrom(from, treasury, tokenId, fee, data);
            }
        }
    }

    // Override the _mint function from ERC1155 to assign the creator of the token
    function _mint(address account, uint256 id, uint256 amount, bytes memory data) internal virtual override {
        super._mint(account, id, amount, data);
        if (creators[id] == address(0)) {
            creators[id] = account;
        }
    }