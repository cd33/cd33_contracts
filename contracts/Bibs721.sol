// SPDX-License-Identifier: MIT
pragma solidity 0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/finance/PaymentSplitter.sol";

/// @title Bibs NFTs 721 collection
/// @author cd33
contract Bibs721 is ERC721, Ownable, IERC2981, PaymentSplitter {
    using Strings for uint;

    enum Step {
        Before,
        WhitelistSale,
        PublicSale
    }
    Step public sellingStep;

    uint8 public constant whitelistLimitBalance = 2;
    uint16 public constant MAX_SUPPLY = 6530;
    uint16 public nextNFT;
    uint256 public constant whitelistSalePrice = 0.01 ether;
    uint256 public constant publicSalePrice = 0.02 ether;

    string private baseURI;

    bytes32 private merkleRoot;

    // To avoid a buyer transferring his NFT to another wallet and buying again
    mapping(address => uint8) public amountWhitelistSaleNftPerWallet;

    //Addresses of all the members of the team
    address[] private _team = [
        0xD9453F5E2696604703076835496F81c3753C3Bb3,
        0x4D06414f064Bed974C368DE555e036E31f53c8eD,
        0x53A764A3dAa3Fe404De9c6F1809eCF45546a6889
    ];

    //Shares of all the members of the team
    uint256[] private _teamShares = [
        70,
        20, 
        10
    ];

    /**
     * @notice Emitted when the step changed.
     */
    event StepChanged(uint8 _step);

    constructor(bytes32 _merkleRoot, string memory _baseURI) ERC721("Bibs721", "BIBS") PaymentSplitter(_team, _teamShares) {
        merkleRoot = _merkleRoot;
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
     * @notice Allows to change the step of the contract.
     * @param _step Step to change.
     */
    function setStep(uint8 _step) external onlyOwner {
        sellingStep = Step(_step);
        emit StepChanged(_step);
    }

    /**
     * @notice Change the base URI.
     * @param _newBaseURI New base URI.
     **/
    function setBaseUri(string memory _newBaseURI) external onlyOwner {
        baseURI = _newBaseURI;
    }

    /**
     * @notice Change the token's metadatas URI, override for OpenSea traits compatibility.
     * @param _tokenId Id of the token.
     * @return string Token's metadatas URI.
     */
    function tokenURI(uint _tokenId) public view virtual override(ERC721) returns(string memory) {
        require(_exists(_tokenId), "NFT doesn't exist");
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, _tokenId.toString(), ".json")) : "";
    }

    // MINT
    /**
     * @notice Mint NFT during the whitelist.
     * @param _quantity Number of tokens to mint.
     * @param _proof Merkle Proof.
     */
    function whitelistSaleMint(uint8 _quantity, bytes32[] calldata _proof) external payable callerIsUser { // optionnel: add a quantity
        require(sellingStep == Step.WhitelistSale, "Whitelist sale not active");
        require(_isWhiteListed(msg.sender, _proof), "Not whitelisted");
        require(_quantity > 0 && _quantity < 3, "Quantity must be equal to 1 or 2");
        require(amountWhitelistSaleNftPerWallet[msg.sender] + _quantity <= whitelistLimitBalance, "Limited number per wallet");
        require(msg.value >= _quantity * whitelistSalePrice, "Not enough funds");
        amountWhitelistSaleNftPerWallet[msg.sender] += _quantity;
        nextNFT += _quantity;
        for(uint i = 1; i <= _quantity ; i++) {
            _safeMint(msg.sender, nextNFT+i-_quantity);
        }
    }

    /**
     * @notice Mint NFTs during the public sale.
     * @param _quantity Number of tokens to mint.
     */
    function publicSaleMint(uint8 _quantity) external payable callerIsUser {
        require(sellingStep == Step.PublicSale, "Public sale not active");
        require(_quantity > 0, "Quantity must be greater than zero");
        require(nextNFT + _quantity <= MAX_SUPPLY, "Sold out");
        require(msg.value >= _quantity * publicSalePrice, "Not enough funds");
        nextNFT += _quantity;
        for(uint i = 1; i <= _quantity ; i++) {
            _safeMint(msg.sender, nextNFT+i-_quantity);
        }
    }

    /**
     * @notice Allows the owner to offer NFTs.
     * @param _to Receiving address.
     * @param _quantity Number of tokens to mint.
     */
    function gift(address _to, uint8 _quantity) external onlyOwner {
        require(_quantity > 0, "Quantity must be greater than zero");
        require(nextNFT + _quantity <= MAX_SUPPLY, "Sold out");
        nextNFT += _quantity;
        for(uint i = 1; i <= _quantity ; i++) {
            _safeMint(_to, nextNFT+i-_quantity);
        }
    }

    // WHITELIST
    /**
     * @notice Change Merkle root to update the whitelist.
     * @param _merkleRoot Merkle Root.
     **/
    function setMerkleRoot(bytes32 _merkleRoot) external onlyOwner {
        merkleRoot = _merkleRoot;
    } 

    /**
     * @notice Return true or false if the account is whitelisted or not.
     * @param _account User's account.
     * @param _proof Merkle Proof.
     * @return bool Account whitelisted or not.
     **/
    function _isWhiteListed(address _account, bytes32[] calldata _proof) internal view returns(bool) {
        return _verify(_leafHash(_account), _proof);
    }

    /**
     * @notice Return the account hashed.
     * @param _account Account to hash.
     * @return bytes32 Account hashed.
     **/
    function _leafHash(address _account) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(_account));
    }

    /** 
     * @notice Returns true if a leaf can be proven to be part of a Merkle tree defined by root.
     * @param _leaf Leaf.
     * @param _proof Merkle Proof.
     * @return bool Be part of the Merkle tree or not.
     **/
    function _verify(bytes32 _leaf, bytes32[] memory _proof) internal view returns(bool) {
        return MerkleProof.verify(_proof, merkleRoot, _leaf);
    }

    // ROYALTIES
    /** 
     * @notice EIP2981 standard royalties return.
     * @dev Returns how much royalty is owed and to whom.
     * @param _tokenId Id of the token.
     * @param _salePrice Price of the token.
     * @return receiver Address of receiver.
     * @return royaltyAmount Amount of royalty.
     **/
    function royaltyInfo(uint256 _tokenId, uint256 _salePrice) external view override
        returns (address receiver, uint256 royaltyAmount)
    {
        return (address(this), (_salePrice * 700) / 10000);
    }

    /** 
     * @notice Returns true if this contract implements the interface IERC2981.
     * @param interfaceId Id of the interface.
     * @return bool Implements IERC2981 or not.
     **/
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, IERC165)
        returns (bool)
    {
        return (
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId)
        );
    }

    /**
    * @notice Withdraw and distribute money from the PaymentSplitter.
    */
    function releaseAll() external {
        for(uint i = 0 ; i < _team.length ; i++) {
            release(payable(payee(i)));
        }
    }

    /**
     * @notice Release specific token from all accounts.
     **/
    function releaseSpecificToken(IERC20 _token) external {
        for (uint8 i = 0; i < _team.length; i++) {
            release(_token, payee(i));
        }
    }

    /**
    * @notice Not allowing receiving ether outside minting functions.
    */
    receive() override external payable {
        revert('Only if you mint');
    }
}