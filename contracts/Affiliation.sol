// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "./Solmate/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/// @title Affiliation ERC721 Example
/// @author cd33
contract StartMining721 is ERC721, Ownable, ReentrancyGuard {
    using Strings for uint256;

    address private constant recipient =
        0xD9453F5E2696604703076835496F81c3753C3Bb3;

    struct Referrer {
        uint256 referredCount;
        uint256 alreadyClaimed;
    }

    bool public notPaused;

    uint256 public salePrice = 0.001 ether;
    uint256 public nextNFT;
    uint256 public limitNFT = 5000;

    string public baseURI;

    mapping(address => Referrer) public referrer;

    /// @notice event emitted when the sale price updated.
    event PriceUpdated(uint256 salePrice);

    /// @notice event emitted when the pause is updated.
    event PauseUpdated(bool notPaused);

    /**
     * @notice Constructor of the contract ERC721.
     * @param _baseURI Metadatas for the ERC721.
     */
    constructor(string memory _baseURI) ERC721("Start Mining", "SMI") {
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
     * @notice Changes the variable notPaused to allow or not the sale.
     */
    function setPause() external onlyOwner {
        notPaused = !notPaused;
        emit PauseUpdated(notPaused);
    }

    /**
     * @notice Change the salePrice.
     * @param _newPrice New sale price.
     **/
    function setSalePrice(uint256 _newPrice) external onlyOwner {
        salePrice = _newPrice;
        emit PriceUpdated(salePrice);
    }

    /**
     * @notice Change the base URI.
     * @param _newBaseURI New base URI.
     **/
    function setBaseUri(string calldata _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }

    /**
     * @notice Private function to mint during the sale.
     * @param _to Address that will receive the NFT.
     * @param _referral Adress of the referral.
     */
    function _mintSale(address _to, address _referral) private nonReentrant {
        require(notPaused, "Sale unavailable for the moment");
        require(nextNFT < limitNFT, "Sold out");
        if (_referral != address(0)) {
            referrer[_referral].referredCount++;
        }
        nextNFT++;
        _mint(_to, nextNFT);
    }

    /**
     * @notice Mint in ETH during the sale.
     * @param _amount Amount of tokens to mint.
     * @param _referral Adress of the referral.
     */
    function mintSale(uint16 _amount, address _referral)
        external
        payable
        callerIsUser
    {
        require(_amount > 0, "Amount min 1");
        require(_referral != msg.sender, "Not allowed to self-referral");
        require(msg.value >= salePrice, "Not enough funds");
        payable(recipient).transfer(address(this).balance);
        for (uint16 i = 0; i < _amount; i++) {
            _mintSale(msg.sender, _referral);
        }
    }

    /**
     * @notice Allows to claim rewards.
     */
    function claimReward() external callerIsUser {
        uint256 countReferral = referrer[msg.sender].referredCount;
        require(countReferral >= 100, "Not enough referral yet");
        uint256 amountNFTClaimable;
        if (countReferral < 1000)
            amountNFTClaimable =
                (1 + (countReferral - 100) / 34) -
                referrer[msg.sender].alreadyClaimed;
        else
            amountNFTClaimable =
                (28 + (countReferral - 1000) / 20) -
                referrer[msg.sender].alreadyClaimed;
        require(amountNFTClaimable > 0, "No rewards available");
        referrer[msg.sender].alreadyClaimed += amountNFTClaimable;
        for (uint16 i = 0; i < amountNFTClaimable; i++) {
            _mintSale(msg.sender, address(0));
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
            _mintSale(_to, address(0));
        }
    }
}
