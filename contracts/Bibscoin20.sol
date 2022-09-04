// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/** @title Bibscoin Token. */
contract Bibscoin20 is ERC20Burnable, Ownable {
    uint256 public constant maxSupply = 21e6 * 10**18;

    /** @notice Constructor of the token. */
    constructor() ERC20("Bibscoin", "BIBS") {}

    /** @notice Mint Bibscoin.
     * @param recipient The recipient for the token.
     * @param amount The amount of token.
     */
    function mint(address recipient, uint256 amount) external onlyOwner {
        require(totalSupply() + amount <= maxSupply, "Sold Out");
        _mint(recipient, amount);
    }
}