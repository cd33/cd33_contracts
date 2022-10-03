// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
// import "hardhat/console.sol";

/// @title Solmate721 NFTs Collection
/// @author cd33
contract BibsSolmate721 is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;

    using SafeERC20 for IERC20;
    IERC20 private usdt = IERC20(0x55d398326f99059fF775485246999027B3197955); // USDT sur la BSC
    address private constant recipient =
        0xD9453F5E2696604703076835496F81c3753C3Bb3;
    AggregatorV3Interface internal priceFeed =
        AggregatorV3Interface(0xd0D5e3DB44DE05E9F294BB0a3bEEaF030DE24Ada); // Chainlink MUMBAI MATIC/USD

    bool public notPaused;

    uint16 public salePrice = 100; // 100$ USD
    uint256 public nextNFT;
    uint256 public limitNFT = 125;

    string public baseURI;

    /// @notice event emitted when a new pool of NFT is ready to be minted.
    event InitializedMint(uint256 _tokenId, uint256 limit, uint16 salePrice);

    /**
     * @notice Constructor of the contract ERC721.
     * @param _baseURI Metadatas for the ERC721.
     */
    constructor(string memory _baseURI)
        ERC721("Solmate721", "SME")
    {
        baseURI = _baseURI;
    }

    /**
     * @notice Enables only externally owned accounts (= users) to mint.
     */
    modifier callerIsUser() {
        require(tx.origin == msg.sender, "Caller is a contract");
        _;
    }

    /**
     * @notice Requires approve from msg.sender to this contract upstream.
     * @param _tokenamount Dollar amount sent from msg.sender to recipient.
     */
    function _acceptPayment(uint256 _tokenamount) private {
        usdt.safeTransferFrom(msg.sender, recipient, _tokenamount);
    }

    /**
     * @notice Allows access to off-chain metadatas.
     * @param _tokenId Id of the token.
     * @return string Token's metadatas URI.
     */
    function tokenURI(uint256 _tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(_tokenId > 0 && _tokenId <= limitNFT, "NFT doesn't exist");
        return
            bytes(baseURI).length > 0
                ? string(
                    abi.encodePacked(baseURI, _tokenId.toString(), ".json")
                )
                : "";
    }

    /**
     * @notice Get the current MATIC/USD price.
     * @dev The function uses the chainlink aggregator.
     * @return int Price value.
     */
    function getLatestPrice() public view returns (int256) {
        (, int256 price, , , ) = priceFeed.latestRoundData();
        return price;
    }

    /**
     * @notice Changes the variable notPaused to allow or not the sale.
     */
    function setPause() external onlyOwner {
        notPaused = !notPaused;
    }

    /**
     * @notice Change the salePrice.
     * @param _newPrice New sale price.
     **/
    function setSalePrice(uint16 _newPrice) external onlyOwner {
        salePrice = _newPrice;
    }

    /**
     * @notice Change the base URI.
     * @param _newBaseURI New base URI.
     **/
    function setBaseUri(string calldata _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }

    /**
     * @notice Initialize a new pool of NFT ready to be minted.
     * @param _nextNFT Id of the first token minus 1.
     * @param _limit Maximum amount of units.
     * @param _salePrice Price value of NFT.
     **/
    function initMint(
        uint256 _nextNFT,
        uint256 _limit,
        uint16 _salePrice
    ) external onlyOwner {
        require(
            _nextNFT >= nextNFT,
            "New nextNFT must be higher than the old one"
        );
        require(_limit > _nextNFT, "Limit must be higher than the new nextNFT");
        require(_salePrice > 0, "Price can't be zero");
        nextNFT = _nextNFT;
        limitNFT = _limit;
        salePrice = _salePrice;
        emit InitializedMint(_nextNFT, _limit, _salePrice);
    }

    // MINTS
    /**
     * @notice Private function to mint during the sale.
     * @param _to Address that will receive the NFT.
     */
    function _mintSale(address _to) private nonReentrant {
        require(notPaused, "Sale unavailable for the moment");
        require(nextNFT < limitNFT, "Sold out");
        nextNFT++;
        _mint(_to, nextNFT);
    }

    /**
     * @notice Mint in XXX during the sale.
     * @param _amount Amount of tokens to mint.
     */
    function mintSale(uint16 _amount) external payable callerIsUser {
        require(_amount > 0, "Amount min 1");
        require(
            msg.value >=
                (uint256(_amount) * salePrice * 10**26) /
                    uint256(getLatestPrice()),
            "Not enough funds"
        );
        payable(recipient).transfer(address(this).balance);
        for (uint16 i = 0; i < _amount; i++) {
            _mintSale(msg.sender);
        }
    }

    /**
     * @notice Mint in USDT during the sale.
     * @param _amount Amount of tokens to mint.
     */
    function mintSaleUSDT(uint16 _amount) external payable callerIsUser {
        require(_amount > 0, "Amount min 1");
        _acceptPayment(uint256(_amount) * salePrice * 10**18);
        for (uint16 i = 0; i < _amount; i++) {
            _mintSale(msg.sender);
        }
    }

    /**
     * @notice Allows the owner to offer NFTs.
     * @param _to Receiving address.
     * @param _amount Amount of tokens to mint.
     */
    function gift(address _to, uint16 _amount) external onlyOwner {
        require(_amount > 0, "Amount min 1");
        for (uint16 i = 0; i < _amount; i++) {
            _mintSale(_to);
        }
    }
}