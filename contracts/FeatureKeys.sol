import "@openzeppelin/contracts/access/Ownable.sol";

contract FeatureKeys is Ownable {
    struct FeatureKey {
        string userApiKey;
        string secretKey;
    }

    mapping(uint256 => FeatureKey) private _featureKeys;

    function setFeatureKey(
        uint256 tokenId,
        string memory userApiKey,
        string memory secretKey
    ) public onlyOwner {
        _featureKeys[tokenId] = FeatureKey(userApiKey, secretKey);
    }

    function getFeatureKey(
        uint256 tokenId
    ) public view returns (string memory userApiKey, string memory secretKey) {
        require(
            _featureKeys[tokenId].userApiKey != "",
            "No feature key set for this token"
        );
        return (
            _featureKeys[tokenId].userApiKey,
            _featureKeys[tokenId].secretKey
        );
    }

    function deleteFeatureKey(uint256 tokenId) public onlyOwner {
        delete _featureKeys[tokenId];
    }
}
