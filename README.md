# cd33_contracts
## Description
* Suite de contracts développé par mes soins, que j'espère utile pour d'autres développeurs  
**Si vous souhaitez m'aider/encourager, n'hésitez pas à mettre une étoile à ce repo et suivre le profil, merci d'avance !**
----------------
* Contract suite developed by me, which I hope will be useful for other developers  
**If you want to help/encourage me, feel free to put a star to this repo and follow the profile, thank you very much !**

## Staking ERC20 DEFI
* Réalisé à partir du [contrat de Synthetix](https://github.com/Synthetixio/synthetix/blob/develop/contracts/StakingRewards.sol)  
Pour comprendre la logique, lisez [mon article](https://cd33.medium.com/defi-staking-rewards-synthetix-64f2e691d718)
----------------
* Based on the [Synthetix contract](https://github.com/Synthetixio/synthetix/blob/develop/contracts/StakingRewards.sol)  
To understand the logic, watch this [video series](https://www.youtube.com/watch?v=6ZO5aYg1GI8)

## Vesting ERC721 & ERC1155
* Réalisé à partir du [contrat de Rowlanja](https://github.com/rowlanja/NE-staking-system/blob/main/contracts/Staking-System-Optimized.sol)  
Contrat de staking de ERC1155 et ERC721 avec système de récompense en ERC20
----------------
* Based on the [Rowlanja contract](https://github.com/rowlanja/NE-staking-system/blob/main/contracts/Staking-System-Optimized.sol)  
Staking contract of ERC1155 and ERC721 with reward system in ERC20

## Affiliation "Uni-level"
* Dans cet exemple, la fonction de mint prend une adresse en paramètre, si c'est l'address(0) => mint classique, sinon, on incremente le compteur referredCount (nombre de nft acheté par les filleuls) de l'adresse.  
Lorsque l'utilisateur arrive à un certain nombre de referredCount, il peut appeler la fonction claimReward pour obtenir une récompense.  
  - Premier pallier (Entre 1 et 100): l’affiliateur pourra claim 1 NFT lorsque ses affiliés en auront achetés 100  
  - Deuxième pallier (Entre 100 et 1000): l’affiliateur peut claim 1 NFT tout les 34 NFTs achetés par les affiliés (100/3 = 33.33 arrondi à 34)  
  - Troisième pallier (A partir de 1001): l’affiliateur peut claim 1 NFT tout les 20 NFTs achetés par les affiliés (100/5 = 20)
----------------
* In this example, the mint function takes an address as a parameter, if it is address(0) => classic mint, otherwise, we increment the referredCount counter (number of nft bought by the referrers) of the address.  
When the user reaches a certain number of referredCount, he can call the claimReward function to get a reward.  
  - First level (between 1 and 100): the affiliate can claim 1 NFT when his affiliates have bought 100  
  - Second tier (Between 100 and 1000): the affiliate can claim 1 NFT for every 34 NFTs purchased by the affiliates (100/3 = 33.33 rounded up to 34)  
  - Third level (From 1001): the affiliate can claim 1 NFT for every 20 NFTs purchased by affiliates (100/5 = 20)
  
## ERC721A
* Whitelist/merkleTree
* IERC2981

## ERC721
* Solmate
  - Initialize a new collection
  - ReentrancyGuard
  - Pausable
* Classic
  - Whitelist/merkleTree
  - IERC2981
  - PaymentSplitter

## ERC1155 Solmate and Classic
* Whitelist/merkleTree
* Purchase in USDT
* Chainlink

## ERC20
* Burnable
