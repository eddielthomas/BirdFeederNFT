// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BirdFeederNFTStakingPool is ERC1155Holder, ReentrancyGuard, Ownable {
    struct StakedNFT {
        uint256 tokenId;
        uint256 amount;
        uint256 stakeTimestamp;
        uint256 unlockTimestamp;
        uint256 rewardDebt;
    }

    IERC20 public rewardToken;
    uint256 public rewardPerSecond;
    uint256 public totalStaked;
    uint256 public totalRewardsPaid;
    uint256 public lockDuration = 1 days;
    uint256 public earlyWithdrawalFee = 10; // 10% early withdrawal fee
    uint256 public constant FEE_PRECISION = 100;

    mapping(address => mapping(uint256 => StakedNFT)) public stakedNFTs;
    mapping(address => uint256) public stakingBalances;

    event NFTStaked(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 unlockTimestamp
    );
    event NFTUnstaked(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount,
        uint256 reward
    );
    event RewardsPaid(address indexed user, uint256 amount);

    event NFTEmergencyWithdrawn(
        address indexed user,
        uint256 indexed tokenId,
        uint256 amount
    );

    constructor(IERC20 _rewardToken, uint256 _rewardPerSecond) {
        rewardToken = _rewardToken;
        rewardPerSecond = _rewardPerSecond;
    }

    function stakeNFT(
        address nftContract,
        uint256 tokenId,
        uint256 amount
    ) external nonReentrant {
        require(amount > 0, "Amount must be greater than 0");
        require(
            stakedNFTs[msg.sender][tokenId].amount == 0,
            "NFT already staked"
        );

        // Transfer the NFT to this contract
        IERC1155(nftContract).safeTransferFrom(
            msg.sender,
            address(this),
            tokenId,
            amount,
            ""
        );

        // Calculate the unlock timestamp
        uint256 unlockTimestamp = block.timestamp + lockDuration;

        // Store the staked NFT
        stakedNFTs[msg.sender][tokenId] = StakedNFT({
            tokenId: tokenId,
            amount: amount,
            stakeTimestamp: block.timestamp,
            unlockTimestamp: unlockTimestamp,
            rewardDebt: 0
        });

        // Update staking balances and total staked
        stakingBalances[msg.sender] += amount;
        totalStaked += amount;

        emit NFTStaked(msg.sender, tokenId, amount, unlockTimestamp);
    }

    function unstakeNFT(
        address nftContract,
        uint256 tokenId
    ) external nonReentrant {
        StakedNFT storage stakedNFT = stakedNFTs[msg.sender][tokenId];
        require(stakedNFT.amount > 0, "No NFT staked");
        require(
            block.timestamp >= stakedNFT.unlockTimestamp,
            "NFT is still locked"
        );
        // Calculate the reward
        uint256 reward = _calculateReward(stakedNFT);

        // Update the staked NFT and staking balances
        stakingBalances[msg.sender] -= stakedNFT.amount;
        totalStaked -= stakedNFT.amount;
        stakedNFT.amount = 0;

        // Transfer the NFT back to the user
        IERC1155(nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            stakedNFT.amount,
            ""
        );

        // Apply the early withdrawal fee
        uint256 earlyWithdrawalFeeAmount = (reward * earlyWithdrawalFee) /
            FEE_PRECISION;
        reward -= earlyWithdrawalFeeAmount;
        if (earlyWithdrawalFeeAmount > 0) {
            rewardToken.transfer(address(this), earlyWithdrawalFeeAmount);
        }

        // Update the reward debt
        uint256 elapsedTime = block.timestamp - stakedNFT.stakeTimestamp;
        uint256 rewardDebt = stakedNFT.amount * rewardPerSecond * elapsedTime;
        stakedNFT.rewardDebt = stakedNFT.rewardDebt + rewardDebt;

        // Transfer the reward tokens
        if (reward > 0) {
            rewardToken.transfer(msg.sender, reward);
            totalRewardsPaid += reward;
        }

        emit NFTUnstaked(msg.sender, tokenId, stakedNFT.amount, reward);
    }

    function setRewardPerSecond(uint256 _rewardPerSecond) external onlyOwner {
        require(
            _rewardPerSecond > 0,
            "Reward per second must be greater than 0"
        );
        rewardPerSecond = _rewardPerSecond;
    }

    function setLockDuration(uint256 _lockDuration) external onlyOwner {
        lockDuration = _lockDuration;
    }

    function setEarlyWithdrawalFee(
        uint256 _earlyWithdrawalFee
    ) external onlyOwner {
        require(
            _earlyWithdrawalFee <= FEE_PRECISION,
            "Early withdrawal fee must be less than or equal to 100"
        );
        earlyWithdrawalFee = _earlyWithdrawalFee;
    }

    function emergencyWithdrawNFT(
        address nftContract,
        uint256 tokenId
    ) external nonReentrant onlyOwner {
        // Get the staked NFT
        StakedNFT storage stakedNFT = stakedNFTs[msg.sender][tokenId];
        // Revert if the NFT is not staked
        require(stakedNFT.amount > 0, "No NFT staked");

        // Revert if the NFT is not in this contract
        require(
            IERC1155(nftContract).balanceOf(address(this), tokenId) >=
                stakedNFT.amount,
            "NFT not in contract"
        );

        // Remove the staked NFT and update staking balances
        stakingBalances[msg.sender] -= stakedNFT.amount;
        totalStaked -= stakedNFT.amount;
        stakedNFT.amount = 0;

        // Transfer the NFT back to the owner
        IERC1155(nftContract).safeTransferFrom(
            address(this),
            msg.sender,
            tokenId,
            stakedNFT.amount,
            ""
        );

        emit NFTEmergencyWithdrawn(msg.sender, tokenId, stakedNFT.amount);
    }

    function claimRewards(uint256 tokenId) external nonReentrant {
        StakedNFT storage stakedNFT = stakedNFTs[msg.sender][tokenId];
        require(stakedNFT.amount > 0, "No NFT staked");

        // Calculate the reward
        uint256 reward = _calculateReward(stakedNFT);

        // Update the reward debt
        uint256 rewardDebt = stakedNFT.amount *
            rewardPerSecond *
            (block.timestamp - stakedNFT.stakeTimestamp);
        stakedNFT.rewardDebt = stakedNFT.rewardDebt + rewardDebt;

        // Transfer the reward tokens
        if (reward > 0) {
            rewardToken.transfer(msg.sender, reward);
            totalRewardsPaid += reward;
        }

        emit RewardsPaid(msg.sender, reward);
    }

    function _updateRewardDebt(StakedNFT storage stakedNFT) internal {
        uint256 reward = _calculateReward(stakedNFT);
        stakedNFT.rewardDebt += reward;
    }

    function _calculateReward(
        StakedNFT memory stakedNFT
    ) private view returns (uint256) {
        uint256 reward = 0;
        uint256 stakingDuration = block.timestamp - stakedNFT.stakeTimestamp;
        if (stakingDuration > 0) {
            reward =
                (stakingDuration * rewardPerSecond * stakedNFT.amount) /
                1e18;
        }
        return reward;
    }
}
