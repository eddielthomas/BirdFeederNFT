// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract OwnableDelegateProxy {}

contract ProxyRegistry {
    mapping(address => OwnableDelegateProxy) public proxies;
}

contract BirdFeederNFT is ERC1155, Ownable, ReentrancyGuard, Pausable {
    using Counters for Counters.Counter;
    using Strings for uint256;
    Counters.Counter private _tokenIds;
    address proxyRegistryAddress;
    address public treasury;
    uint256 public creatorRoyalty = 2; // 2% creator royalty
    uint256 public transferFee = 2; // 5% transfer fee
    uint256 public discountRate = 10; // 10% discount
    uint256 public referralRewardPercentage = 50; // 50% of the minted NFT
    uint256 public maxReferralCodesPerUser = 3; // Limit the number of referral codes a user can generate
    uint256 public mintPrice = 1 ether; // Mint price
    uint256 public lockDuration = 1 days; // Lock duration for newly minted NFTs
    uint256 public maxMintable = 10000; // Maximum number of NFTs that can be minted
    string private _contractURI;

    mapping(string => address) public referralCodes;
    mapping(address => uint256) public discounts;
    mapping(address => uint256) public referralCodesGenerated;
    mapping(uint256 => address) public creators;
    mapping(uint256 => uint256) public unlockTimestamps;
    mapping(uint256 => bool) public mintedTokens;
    mapping(uint256 => string) private tokenIdToCID;
    mapping(uint256 => uint256) public tokenSupply;
    // Contract name
    string public name;
    // Contract symbol
    string public symbol;

    event NFTMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 amount
    );
    event ReferralCodeGenerated(
        address indexed user,
        uint256 indexed tokenId,
        string referralCode
    );
    event DiscountApplied(
        address indexed user,
        uint256 indexed tokenId,
        uint256 discountAmount
    );
    event NFTLocked(uint256 indexed tokenId, uint256 unlockTimestamp);
    event NFTUnlocked(uint256 indexed tokenId);

    /**
     * @dev Require msg.sender to be the creator of the token id
     */
    modifier creatorOnly(uint256 _id) {
        require(
            creators[_id] == msg.sender,
            "ERC1155Tradable#creatorOnly: ONLY_CREATOR_ALLOWED"
        );
        _;
    }

    /**
     * @dev Require msg.sender to own more than 0 of the token id
     */
    modifier ownersOnly(uint256 _id) {
        require(
            balanceOf(msg.sender) > 0,
            "ERC1155Tradable#ownersOnly: ONLY_OWNERS_ALLOWED"
        );
        _;
    }

    constructor(
        string memory _uri,
        address _treasury,
        string memory _name,
        string memory _symbol,
        address _proxyRegistryAddress
    ) ERC1155(_uri) {
        treasury = _treasury;
        name = _name;
        symbol = _symbol;
        proxyRegistryAddress = _proxyRegistryAddress;
        _contractURI = '{"name": "BirdFeeder NFTs", "description": "BirdFeeder NFTs Adopt one today to try out all the OpenSea buying, selling, and bidding feature set.","image": "http://167.71.176.114:8080/ipfs/Qmcc8NEqGVCzzYobfriiHoW1qoMLY4mFxcdZ7Z9LssVozb","external_link": "www.birdfeeder.net"}';
    }

    function uri(
        uint256 _id
    ) public view override  returns (string memory) {
        require(_exists(_id), "ERC721Tradable#uri: NONEXISTENT_TOKEN");
        return string(abi.encodePacked(super.uri(_id), _id));

    }


    function tokenURI(uint256 tokenId) public view returns (string memory) {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        string memory baseURI = uri(tokenId);
        string memory data = tokenIdToCID[tokenId];

        // If there is no base URI, return the empty string
        if (bytes(baseURI).length == 0) {
            return "";
        }
        // If the token's data is not set, return the default tokenURI
        if (bytes(data).length == 0) {
            return string(abi.encodePacked(baseURI, tokenId.toString()));
        }
        // If both are set, concatenate the baseURI and data
        return string(abi.encodePacked(baseURI, string(data)));
    }

    function _setTokenCID(
        uint256 tokenId,
        string memory _cid
    ) internal virtual {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI set of nonexistent token"
        );
        tokenIdToCID[tokenId] = _cid;
    }

    function _exists(uint256 tokenId) internal view returns (bool) {
        return mintedTokens[tokenId];
    }

    // function to return the total supply of the all tokens
    function totalSupply() public view returns (uint256) {
        return _tokenIds.current();
    }

    function totalRemainingSupply() public view returns (uint256) {
        return maxMintable - totalSupply();
    }

    // function to return number of NFTs minted by a user
    function balanceOf(address account) public view returns (uint256) {
        return balanceOf(account, 0);
    }

    // function to return number of NFTs minted by all users
    function totalMinted() public view returns (uint256) {
        return balanceOf(address(this), 0);
    }

    function getRemainingMintable() public view returns (uint256) {
        return maxMintable - getMintedTokensCount();
    }

    function getMintedTokens() public view returns (uint256[] memory) {
        uint256 _currentTokenId = _tokenIds.current();
        uint256[] memory mintedTokensArray = new uint256[](_currentTokenId);
        uint256 counter = 0;

        for (uint256 i = 1; i <= _currentTokenId; i++) {
            if (mintedTokens[i]) {
                mintedTokensArray[counter] = i;
                counter++;
            }
        }

        // Resize the array to exclude empty elements
        uint256[] memory resizedArray = new uint256[](counter);
        for (uint256 i = 0; i < counter; i++) {
            resizedArray[i] = mintedTokensArray[i];
        }

        return resizedArray;
    }

    function getMintedTokensCount() public view returns (uint256) {
        uint256[] memory mintedTokensArray = getMintedTokens();
        return mintedTokensArray.length;
    }

    function mint(
        address to,
        uint256 amount,
        string memory data,
        string memory referralCode
    ) external payable nonReentrant whenNotPaused {
        require(msg.value >= mintPrice, "Insufficient payment");

        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        // Refund excess payment
        if (msg.value > mintPrice) {
            payable(msg.sender).transfer(msg.value - mintPrice);
        }

        // Mint the NFT
        _mint(to, tokenId, amount, bytes(data));

        // Set token URI using CID
        mintedTokens[tokenId] = true;
        _setTokenCID(tokenId, data);
        creators[tokenId] = msg.sender;
        tokenSupply[tokenId] = amount;

        // Emit event
        emit NFTMinted(to, tokenId, amount);

        if (
            bytes(referralCode).length > 0 &&
            referralCodes[referralCode] != address(0)
        ) {
            // Apply discount
            applyDiscount(referralCode, tokenId);
        }
        // Lock the NFT
        _lockNFT(tokenId);
    }

    function batchMint(
        address to,
        uint256[] memory amounts,
        string[] memory data
    ) external payable nonReentrant whenNotPaused {
        require(
            msg.value >= (mintPrice * amounts.length),
            "Insufficient payment"
        );

        uint256[] memory tokenIds = new uint256[](amounts.length);

        for (uint256 i = 0; i < amounts.length; i++) {
            _tokenIds.increment();
            uint256 tokenId = _tokenIds.current();
            tokenIds[i] = tokenId;

            // Mint the NFT
            _mint(to, tokenId, amounts[i], bytes(data[i]));

            // Set token URI using CID

            mintedTokens[tokenId] = true;
            _setTokenCID(tokenId, data[i]);
            creators[tokenId] = msg.sender;
            tokenSupply[tokenId] = amounts[i];
            // Emit event
            emit NFTMinted(to, tokenId, amounts[i]);

            // Lock the NFT
            _lockNFT(tokenId);
        }

        // Refund excess payment
        if (msg.value > (mintPrice * amounts.length)) {
            payable(msg.sender).transfer(
                msg.value - (mintPrice * amounts.length)
            );
        }
    }

    function lazyBatchMint(
        uint256[] memory amounts,
        string[] memory data,
        string[] memory _referralCodes
    ) external payable whenNotPaused returns (uint256[] memory) {
        require(
            msg.value >= (mintPrice * amounts.length),
            "Insufficient payment"
        );

        string memory _referralCode = "";

        uint256[] memory tokenIds = new uint256[](amounts.length);

        for (uint256 i = 0; i < amounts.length; i++) {
            _tokenIds.increment();
            uint256 tokenId = _tokenIds.current();
            tokenIds[i] = tokenId;

            // check referralCodes index is not out of bounds
            if (
                _referralCodes.length > 0 &&
                _referralCodes.length > i &&
                bytes(_referralCodes[i]).length > 0
            ) {
                _referralCode = _referralCodes[i];
            } else {
                _referralCode = "";
            }

            lazyMints[lazyMintCounter] = LazyMint({
                tokenId: tokenId,
                amount: amounts[i],
                minter: msg.sender,
                executed: false,
                data: data[i],
                referralCode: _referralCode
            });

            lazyMintCounter++;
        }

        // Refund excess payment
        if (msg.value > (mintPrice * amounts.length)) {
            payable(msg.sender).transfer(
                msg.value - (mintPrice * amounts.length)
            );
        }

        return tokenIds;
    }

    function setMaxMintable(uint256 newMaxMintable) external onlyOwner {
        maxMintable = newMaxMintable;
    }

    function setMintPrice(uint256 newMintPrice) external onlyOwner {
        mintPrice = newMintPrice;
    }

    function setLockDuration(uint256 newLockDuration) external onlyOwner {
        lockDuration = newLockDuration;
    }

    function _lockNFT(uint256 tokenId) internal {
        uint256 unlockTimestamp = block.timestamp + lockDuration;
        unlockTimestamps[tokenId] = unlockTimestamp;
        emit NFTLocked(tokenId, unlockTimestamp);
    }

    function _unlockNFT(uint256 tokenId) internal {
        unlockTimestamps[tokenId] = 0;
        emit NFTUnlocked(tokenId);
    }

    function _beforeTokenTransfer(
        address operator,
        address from,
        address to,
        uint256[] memory ids,
        uint256[] memory amounts,
        bytes memory data
    ) internal virtual override whenNotPaused {
        super._beforeTokenTransfer(operator, from, to, ids, amounts, data);

        for (uint256 i = 0; i < ids.length; i++) {
            uint256 tokenId = ids[i];
            uint256 amount = amounts[i];

            // Ensure the NFT is unlocked before transferring
            require(
                block.timestamp >= unlockTimestamps[tokenId],
                "Token is locked"
            );

            if (from == address(0) || to == address(0)) {
                // Mint or burn operation, do not apply fees or royalties
                return;
            }

            // Calculate and transfer the creator royalty
            uint256 royalty = (amount * creatorRoyalty) / 100;
            if (royalty > 0) {
                address creator = creators[tokenId];
                require(
                    balanceOf(from, tokenId) >= royalty,
                    "Insufficient balance for royalties"
                );
                _safeTransferFrom(from, creator, tokenId, royalty, data);
            }

            // Calculate and transfer the transfer fee
            uint256 fee = (amount * transferFee) / 100;
            if (fee > 0) {
                require(
                    balanceOf(from, tokenId) >= fee,
                    "Insufficient balance for transfer fee"
                );
                _safeTransferFrom(from, treasury, tokenId, fee, data);
            }
        }
    }

    function contractURI() public view returns (string memory) {
        return string.concat("data:application/json;utf8,", _contractURI);
    }

    function setContractURI(string memory newContractURI) external onlyOwner {
        _contractURI = newContractURI;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // Implement lazy minting feature
    struct LazyMint {
        uint256 tokenId;
        uint256 amount;
        address minter;
        bool executed;
        string data;
        string referralCode; // Add this line
    }

    mapping(uint256 => LazyMint) public lazyMints;
    uint256 private lazyMintCounter = 0;

    function lazyMint(
        uint256 amount,
        string memory data,
        string memory referralCode // Add this parameter
    ) external whenNotPaused returns (uint256) {
        _tokenIds.increment();
        uint256 tokenId = _tokenIds.current();

        lazyMints[lazyMintCounter] = LazyMint({
            tokenId: tokenId,
            amount: amount,
            minter: msg.sender,
            executed: false,
            data: data,
            referralCode: referralCode // Add this line
        });

        tokenIdToCID[tokenId] = data;

        lazyMintCounter++;

        return tokenId;
    }

    function executeLazyMint(
        uint256 lazyMintId,
        address to
    ) external payable nonReentrant whenNotPaused {
        LazyMint storage _lazyMint = lazyMints[lazyMintId];
        require(!_lazyMint.executed, "Lazy mint already executed");
        require(msg.sender == _lazyMint.minter, "Not the minter");

        uint256 finalMintPrice = mintPrice;

        // Apply referral code discount if provided
        if (bytes(_lazyMint.referralCode).length > 0) {
            address referrer = referralCodes[_lazyMint.referralCode];
            require(referrer != address(0), "Invalid referral code");
            uint256 discountAmount = (mintPrice * discountRate) / 100;
            finalMintPrice = mintPrice - discountAmount;

            // Transfer the referral reward to the referrer
            uint256 referralReward = (mintPrice * referralRewardPercentage) /
                100;
            payable(referrer).transfer(referralReward);

            emit DiscountApplied(msg.sender, _lazyMint.tokenId, discountAmount);
        }

        require(msg.value >= finalMintPrice, "Insufficient payment");

        // Refund excess payment
        if (msg.value > finalMintPrice) {
            creators[_lazyMint.tokenId] = msg.sender;
            payable(msg.sender).transfer(msg.value - finalMintPrice);
        }

        // Mint the NFT
        _mint(to, _lazyMint.tokenId, _lazyMint.amount, bytes(_lazyMint.data));

        // Set token URI using CID

        mintedTokens[_lazyMint.tokenId] = true;
        _setTokenCID(_lazyMint.tokenId, _lazyMint.data);
        tokenSupply[_lazyMint.tokenId] = _lazyMint.amount;
        // Emit event
        emit NFTMinted(to, _lazyMint.tokenId, _lazyMint.amount);

        // Lock the NFT
        _lockNFT(_lazyMint.tokenId);

        // Mark the lazy mint as executed
        _lazyMint.executed = true;
    }

    function setCreatorRoyalty(uint256 newCreatorRoyalty) external onlyOwner {
        creatorRoyalty = newCreatorRoyalty;
    }

    function setTransferFee(uint256 newTransferFee) external onlyOwner {
        transferFee = newTransferFee;
    }

    function setDiscountRate(uint256 newDiscountRate) external onlyOwner {
        discountRate = newDiscountRate;
    }

    /**
     * @dev Change the creator address for given token
     * @param _to   Address of the new creator
     * @param _id  Token IDs to change creator of
     */
    function _setCreator(address _to, uint256 _id) internal creatorOnly(_id) {
        creators[_id] = _to;
    }

    /**
     * @dev Change the creator address for given tokens
     * @param _to   Address of the new creator
     * @param _ids  Array of Token IDs to change creator
     */
    function setCreator(address _to, uint256[] memory _ids) public {
        require(
            _to != address(0),
            "ERC1155Tradable#setCreator: INVALID_ADDRESS."
        );
        for (uint256 i = 0; i < _ids.length; i++) {
            uint256 id = _ids[i];
            _setCreator(_to, id);
        }
    }

    function setProxyRegistryAddress(
        address _proxyRegistryAddress
    ) external onlyOwner {
        proxyRegistryAddress = _proxyRegistryAddress;
    }

    /**
     * Override isApprovedForAll to whitelist user's OpenSea proxy accounts to enable gas-free listings.
     */
    function isApprovedForAll(
        address _owner,
        address _operator
    ) public view override returns (bool isOperator) {
        // Whitelist OpenSea proxy contract for easy trading.
        ProxyRegistry proxyRegistry = ProxyRegistry(proxyRegistryAddress);
        if (address(proxyRegistry.proxies(_owner)) == _operator) {
            return true;
        }

        return ERC1155.isApprovedForAll(_owner, _operator);
    }

    function royaltyInfo(
        uint256 tokenId,
        uint256 salePrice
    ) external view returns (address receiver, uint256 royaltyAmount) {
        receiver = creators[tokenId];
        royaltyAmount = (salePrice * creatorRoyalty) / 100;
    }

    function setReferralRewardPercentage(
        uint256 newReferralRewardPercentage
    ) external onlyOwner {
        referralRewardPercentage = newReferralRewardPercentage;
    }

    function setMaxReferralCodesPerUser(
        uint256 newMaxReferralCodesPerUser
    ) external onlyOwner {
        maxReferralCodesPerUser = newMaxReferralCodesPerUser;
    }

    function generateReferralCode(uint256 tokenId) external {
        require(
            referralCodesGenerated[msg.sender] < maxReferralCodesPerUser,
            "Max referral codes per user reached"
        );
        // Convert the token ID to a base-36 string
        string memory tokenStr = _toBase36(tokenId);
        // Generate a unique identifier based on the sender, timestamp, and token ID
        bytes32 identifier = keccak256(
            abi.encodePacked(msg.sender, block.timestamp, tokenId)
        );
        // Convert the identifier to a base-36 string
        string memory identifierStr = _toBase36(uint256(identifier));
        // Concatenate the token ID and identifier to form the referral code
        string memory referralCode = string(
            abi.encodePacked(tokenStr, "-", identifierStr)
        );
        // Store the referral code and increment the counter
        referralCodes[referralCode] = msg.sender;
        referralCodesGenerated[msg.sender]++;
        emit ReferralCodeGenerated(msg.sender, tokenId, referralCode);
    }

    function _toBase36(uint256 value) internal pure returns (string memory) {
        // Convert a uint256 value to a base-36 string
        bytes memory chars = "0123456789abcdefghijklmnopqrstuvwxyz";
        uint256 length = 0;
        uint256 n = value;
        while (n > 0) {
            length++;
            n /= 36;
        }
        bytes memory result = new bytes(length);
        for (uint256 i = 0; i < length; i++) {
            result[length - i - 1] = chars[value % 36];
            value /= 36;
        }
        return string(result);
    }

    function applyDiscount(
        string memory referralCode,
        uint256 tokenId
    ) internal {
        address referrer = referralCodes[referralCode];
        require(referrer != address(0), "Invalid referral code");
        // require(discounts[msg.sender] == 0, "Discount already applied");
        uint256 discountAmount = (mintPrice * discountRate) / 100;
        discounts[msg.sender] = discountAmount;

        // Transfer the referral reward to the referrer
        uint256 referralReward = (mintPrice * referralRewardPercentage) / 100;
        payable(referrer).transfer(referralReward);

        emit DiscountApplied(msg.sender, tokenId, discountAmount);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        treasury = newTreasury;
    }

    function setBaseURI(string memory _uri) external onlyOwner {
        _setURI(_uri);
    }

    function withdrawETH() external onlyOwner {
        payable(msg.sender).transfer(address(this).balance);
    }

    function withdrawERC20(address token) external onlyOwner {
        uint256 balance = IERC20(token).balanceOf(address(this));
        IERC20(token).transfer(msg.sender, balance);
    }
}
