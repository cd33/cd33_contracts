// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./Bibscoin20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/// @title Staking ERC20, Pool BIBS/BIBS
/// @author cd33
contract StakingERC20 is Ownable, ReentrancyGuard {
    using SafeERC20 for Bibscoin20;
    Bibscoin20 public immutable stakingAndRewardsToken;

    // Duration of rewards to be paid out (in seconds)
    uint256 public duration;
    // Timestamp of when the rewards finish
    uint256 public finishAt;
    // Minimum of last updated time and reward finish time
    uint256 public updatedAt;
    // Reward to be paid out per second
    uint256 public rewardRate;
    // Sum of (reward rate * dt * 1e18 / total supply)
    uint256 public rewardPerTokenStored;
    // Total staked
    uint256 public totalSupply;
    // User address => rewardPerTokenStored
    mapping(address => uint256) public userRewardPerTokenPaid;
    // User address => rewards to be claimed
    mapping(address => uint256) public rewards;
    // User address => staked amount
    mapping(address => uint256) public balanceOf;

    bool public notPaused;

    /// @notice event emitted when the owner adds a supply to the pool.
    event RewardAdded(uint256 reward);

    /// @notice event emitted when a user has staked tokens.
    event Staked(address owner, uint256 amount);

    /// @notice event emitted when a user has unstaked tokens.
    event Unstaked(address owner, uint256 amount);

    /// @notice event emitted when a user has claimed his reward.
    event RewardPaid(address owner, uint256 reward);

    /**
     * @notice Constructor of the contract Staking.
     * @param _stakingAndRewardsToken Address of the WRN ERC20 contract.
     */
    constructor(address _stakingAndRewardsToken) {
        stakingAndRewardsToken = Bibscoin20(_stakingAndRewardsToken);
    }

    /**
     * @notice Update some variables necessary to calculate the staking, at each interaction with the smart contract (stake, unstake and claim).
     * @param _account Address that needs to have its information updated.
     */
    modifier updateReward(address _account) {
        rewardPerTokenStored = rewardPerToken();
        updatedAt = lastTimeRewardApplicable();

        if (_account != address(0)) {
            rewards[_account] = earned(_account);
            userRewardPerTokenPaid[_account] = rewardPerTokenStored;
        }

        _;
    }

    /**
     * @notice Changes the variable notPaused to allow or not the staking.
     */
    function setPause() external onlyOwner {
        notPaused = !notPaused;
    }

    /**
     * @notice Changes the total duration of the staking pool, the first function to be called when the pool is created.
     * @param _duration Duration of the pool.
     */
    function setRewardsDuration(uint256 _duration) external onlyOwner {
        require(block.timestamp > finishAt, "Reward duration not finished");
        duration = _duration;
    }

    /**
     * @notice Initializes the set of variables needed to run the staking pool, the second function to be called when the pool is created.
     * @param _amount Total amount of reward that the pool will distribute.
     */
    function notifyRewardAmount(uint256 _amount)
        external
        onlyOwner
        updateReward(address(0))
    {
        if (block.timestamp >= finishAt) {
            rewardRate = _amount / duration;
        } else {
            uint256 remainingRewards = (finishAt - block.timestamp) *
                rewardRate;
            rewardRate = (_amount + remainingRewards) / duration;
        }
        require(rewardRate > 0, "Reward rate must be greater than 0");
        require(
            rewardRate * duration <=
                stakingAndRewardsToken.balanceOf(address(this)),
            "Balance of contract must be greater than reward amount"
        );

        finishAt = block.timestamp + duration;
        updatedAt = block.timestamp;
        emit RewardAdded(_amount);
    }

    /**
     * @notice Determines the smallest value between two variables.
     * @param x First variable.
     * @param y Second variable.
     * @return uint256 Smallest value.
     */
    function _min(uint256 x, uint256 y) private pure returns (uint256) {
        return x <= y ? x : y;
    }

    /**
     * @notice Allows to have a maximum time value, return finishAt if the pool has exceeded the maximum duration.
     * @return uint256 Smallest value.
     */
    function lastTimeRewardApplicable() public view returns (uint256) {
        return _min(finishAt, block.timestamp);
    }

    /**
     * @notice Calculate the sum of (reward rate * dt * 1e18 / total supply), left side of the equation.
     * @return uint256 rewardPerToken.
     */
    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardPerTokenStored;
        }

        return
            rewardPerTokenStored +
            (rewardRate * (lastTimeRewardApplicable() - updatedAt) * 1e18) /
            totalSupply;
    }

    /**
     * @notice Calculates the amount of rewards a user has earned.
     * @param _account Address of the user.
     * @return uint256 Amount of rewards.
     */
    function earned(address _account) public view returns (uint256) {
        return
            ((balanceOf[_account] *
                (rewardPerToken() - userRewardPerTokenPaid[_account])) / 1e18) +
            rewards[_account];
    }

    /**
     * @notice Allows to stake a quantity of WRN.
     * @param _amount Amount of tokens to stake.
     */
    function stake(uint256 _amount)
        external
        nonReentrant
        updateReward(msg.sender)
    {
        require(notPaused, "Staking unavailable for the moment");
        require(_amount > 0, "Amount must be greater than 0");
        stakingAndRewardsToken.safeTransferFrom(
            msg.sender,
            address(this),
            _amount
        );
        balanceOf[msg.sender] += _amount;
        totalSupply += _amount;
        emit Staked(msg.sender, _amount);
    }

    /**
     * @notice Allows to unstake a quantity of WRN, the reward is sent.
     * @param _amount Amount of tokens to unstake.
     */
    function unstake(uint256 _amount)
        external
        nonReentrant
        updateReward(msg.sender)
    {
        require(_amount > 0, "Amount must be greater than 0");
        require(balanceOf[msg.sender] >= _amount, "Not enough funds");
        balanceOf[msg.sender] -= _amount;
        totalSupply -= _amount;
        uint256 reward = rewards[msg.sender] + _amount;
        if (rewards[msg.sender] > 0) {
            rewards[msg.sender] = 0;
        }
        stakingAndRewardsToken.safeTransfer(msg.sender, reward);
        emit Unstaked(msg.sender, _amount);
        emit RewardPaid(msg.sender, reward);
    }

    /**
     * @notice Allows a user to claim their rewards.
     */
    function claimReward() external nonReentrant updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        require(reward > 0, "No reward to claim");
        rewards[msg.sender] = 0;
        stakingAndRewardsToken.safeTransfer(msg.sender, reward);
        emit RewardPaid(msg.sender, reward);
    }
}
