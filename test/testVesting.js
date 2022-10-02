const { ethers } = require('hardhat')
const { expect } = require('chai')

const baseURI = 'ipfs://QmYkpa28u51JFnCjrnoaMf1LfyNiB9n5oSp6ERRQCX5eKE/'
const root =
  '0x64ff0ae99564eba0685d74c5c85f96c18ee076339fb6991668b30f44644cc7ae'

describe('Testing Staking System', function () {
  let accounts
  let dojoContract
  let landContract
  let itemsContract
  let stakingContract
  before(async function () {
    const ERC20_Reward_Token = await ethers.getContractFactory('Bibscoin20')
    const ERC721_Staking_Token = await ethers.getContractFactory('Bibs721')
    const ERC1155_Staking_Token = await ethers.getContractFactory('Bibs1155')
    const Staking_system = await ethers.getContractFactory('Vesting')

    accounts = await hre.ethers.getSigners()

    dojoContract = await ERC20_Reward_Token.deploy()
    landContract = await ERC721_Staking_Token.deploy(root, baseURI)
    itemsContract = await ERC1155_Staking_Token.deploy(root, baseURI)
    stakingContract = await Staking_system.deploy(
      landContract.address,
      itemsContract.address,
      dojoContract.address,
    )

    await dojoContract.deployed()
    await landContract.deployed()
    await itemsContract.deployed()
    await stakingContract.deployed()

    await stakingContract.setTokensClaimable(1)
    await landContract.setApprovalForAll(stakingContract.address, 1)
    await itemsContract.setApprovalForAll(stakingContract.address, 1)

    await landContract.setStep(2)
    await itemsContract.setStep(2)

    await landContract.publicSaleMint(15)
    await itemsContract.publicSaleMint(15)

    await stakingContract.stakeERC721(1)
    await stakingContract.stakeERC1155(1, 5)
    await stakingContract.GetStakedERC721(accounts[0].address, 1)
    await stakingContract.GetStakedERC1155(accounts[0].address, 0)
  })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Stake Owned ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Stake Owned ERC 721 & ERC 115', function () {
    it('Should successfully stake owned tokens', async function () {
      expect(await landContract.balanceOf(accounts[0].address)).to.equal(14)
      expect(await itemsContract.balanceOf(accounts[0].address, 1)).to.equal(10)

      await stakingContract.stakeERC721(2)
      await stakingContract.stakeERC1155(1, 4)

      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[0].address,
        1,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        1,
      )

      expect(getStakedErc721.amount).to.equal(1)
      expect(getStakedErc1155[0].amount).to.equal(5)

      expect(await landContract.balanceOf(accounts[0].address)).to.equal(13)
      expect(await itemsContract.balanceOf(accounts[0].address, 1)).to.equal(6)

      expect(await landContract.balanceOf(stakingContract.address)).to.equal(2)
      expect(
        await itemsContract.balanceOf(stakingContract.address, 1),
      ).to.equal(9)
    })
  })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Stake Multiple ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Stake Multiple ERC 1155', function () {
    it('Should successfully stake same token multiple times', async function () {
      expect(await itemsContract.balanceOf(accounts[0].address, 1)).to.equal(6)

      await stakingContract.stakeERC1155(1, 1)
      await stakingContract.stakeERC1155(1, 2)
      await stakingContract.stakeERC1155(1, 3)

      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        1,
      )

      expect(getStakedErc1155[0].amount).to.equal(5)
      expect(getStakedErc1155[1].amount).to.equal(4)
      expect(getStakedErc1155[2].amount).to.equal(1)
      expect(getStakedErc1155[3].amount).to.equal(2)
      expect(getStakedErc1155[4].amount).to.equal(3)
      expect(getStakedErc1155.length).to.equal(5)
      expect(await itemsContract.balanceOf(accounts[0].address, 1)).to.equal(0)
      expect(
        await itemsContract.balanceOf(stakingContract.address, 1),
      ).to.equal(15)
    })
  })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Stake NonExistant ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Stake NonExistant ERC 721 & ERC 1155', function () {
    it('Should successfully reject stake nonexistant tokens', async function () {
      await expect(stakingContract.stakeERC721(50)).to.be.revertedWith(
        'ERC721: invalid token ID',
      )
      await expect(stakingContract.stakeERC1155(10, 5)).to.be.revertedWith(
        'Account have less token',
      )

      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[0].address,
        50,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        10,
      )

      expect(getStakedErc721.amount).to.equal(0)
      expect(getStakedErc1155.length).to.equal(0)
    })
  })
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Stake Unowned ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Stake Unowned ERC 721 & ERC 1155', function () {
    it('Should successfully reject stake unowned tokens', async function () {
      await expect(
        stakingContract.connect(accounts[1]).stakeERC721(0),
      ).to.be.revertedWith('ERC721: invalid token ID')
      await expect(
        stakingContract.connect(accounts[1]).stakeERC1155(0, 5),
      ).to.be.revertedWith('Account have less token')

      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[1].address,
        0,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[1].address,
        0,
      )

      expect(getStakedErc721.amount).to.equal(0)
      expect(getStakedErc1155.length).to.equal(0)
    })
  })
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Staked Already Staked ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Stake Staked Already Staked ERC 721 & ERC 1155', function () {
    it('Should successfully reject stake already staked tokens', async function () {
      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[0].address,
        1,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        1,
      )

      expect(getStakedErc721.amount).to.equal(1)
      expect(getStakedErc1155[0].amount).to.equal(5)

      await landContract.connect(accounts[1]).publicSaleMint(1)

      await expect(stakingContract.stakeERC721(16)).to.be.revertedWith(
        'Account doesnt own token',
      )
      console.log(await itemsContract.balanceOf(accounts[0].address, 1))
      await expect(stakingContract.stakeERC1155(2, 5)).to.be.revertedWith(
        'Account have less token',
      )

      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[0].address,
        1,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        1,
      )

      expect(getStakedErc721.amount).to.equal(1)
      expect(getStakedErc1155[0].amount).to.equal(5)
    })
  })
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Unstake Unowned ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Unstake Unowned ERC 721 & ERC 1155', function () {
    it('Should successfully reject unstake Unowned ERC 721 & ERC 1155', async function () {
      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[0].address,
        1,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        1,
      )
      getDojoBalance = await dojoContract.balanceOf(accounts[1].address)
      expect(getStakedErc721.amount).to.equal(1)
      expect(getStakedErc1155[0].amount).to.equal(5)
      expect(getDojoBalance).to.equal(0)

      await expect(
        stakingContract.connect(accounts[1]).unstakeERC721(1),
      ).to.be.revertedWith(
        'Nft Staking System: user must be the owner of the staked nft',
      )
      await expect(
        stakingContract.connect(accounts[1]).unstakeERC1155(5, 1),
      ).to.be.revertedWith(
        'Nft Staking System: user has no nfts of this type staked',
      )

      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[0].address,
        1,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        1,
      )
      getDojoBalance = await dojoContract.balanceOf(accounts[1].address)
      //should expect no change since user B is trying to unstake user A's tokens
      expect(getStakedErc721.amount).to.equal(1)
      expect(getStakedErc1155[0].amount).to.equal(5)
      expect(getDojoBalance).to.equal(0)
    })
  })
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Unstake Owned ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Unstake Owned ERC 721 & ERC 1155', function () {
    it('Should successfully unstake Owned tokens', async function () {
      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[0].address,
        1,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        1,
      )
      getDojoBalance = await dojoContract.balanceOf(accounts[0].address)
      expect(getStakedErc721.amount).to.equal(1)
      expect(getStakedErc1155[0].amount).to.equal(5)
      expect(getDojoBalance).to.equal(0)

      await stakingContract.unstakeERC721(1)
      await stakingContract.unstakeERC1155(1, 0)

      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[0].address,
        1,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        1,
      )
      getDojoBalance = await dojoContract.balanceOf(accounts[0].address)

      expect(getStakedErc721.amount).to.equal(0)
      expect(getStakedErc1155.length).to.equal(4)
      expect(getDojoBalance).to.not.equal(0)
    })
  })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Unstake Multiple ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Stake Multiple ERC 1155', function () {
    it('Should successfully stake same token multiple times', async function () {
      await stakingContract.stakeERC1155(1, 3)
      await stakingContract.stakeERC1155(1, 2)

      expect(await itemsContract.balanceOf(accounts[0].address, 1)).to.equal(0)

      await stakingContract.unstakeERC1155(1, 0)
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        1,
      )
      expect(getStakedErc1155[0].amount).to.equal(2)
      expect(getStakedErc1155[1].amount).to.equal(4)

      await stakingContract.unstakeERC1155(1, 0)
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        1,
      )
      expect(getStakedErc1155[0].amount).to.equal(3)

      await stakingContract.unstakeERC1155(1, 0)
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        1,
      )
      expect(getStakedErc1155.length).to.equal(3)

      expect(await itemsContract.balanceOf(accounts[0].address, 1)).to.equal(8)
    })
  })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Unstake Nonexistant ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Unstake Nonexistant ERC 721 & ERC 1155', function () {
    it('Should successfully reject unstake Unowned ERC 721 & ERC 1155', async function () {
      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[1].address,
        10,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[1].address,
        10,
      )
      getDojoBalance = await dojoContract.balanceOf(accounts[1].address)
      expect(getStakedErc721.amount).to.equal(0)
      expect(getStakedErc1155.length).to.equal(0)
      expect(getDojoBalance).to.equal(0)

      await expect(
        stakingContract.connect(accounts[1]).unstakeERC721(10),
      ).to.be.revertedWith(
        'Nft Staking System: user must be the owner of the staked nft',
      )
      await expect(
        stakingContract.connect(accounts[1]).unstakeERC1155(10, 1),
      ).to.be.revertedWith(
        'Nft Staking System: user has no nfts of this type staked',
      )

      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[1].address,
        10,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[1].address,
        10,
      )
      getDojoBalance = await dojoContract.balanceOf(accounts[1].address)

      expect(getStakedErc721.amount).to.equal(0)
      expect(getStakedErc1155.length).to.equal(0)
      expect(getDojoBalance).to.equal(0)
    })
  })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Unstake Unstaked ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Unstake Unstaked ERC 721 & ERC 1155', function () {
    it('Should successfully reject unstake Unowned ERC 721 & ERC 1155', async function () {
      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[0].address,
        2,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        0,
      )
      getDojoBalanceA = await dojoContract.balanceOf(accounts[0].address)
      expect(getStakedErc721.amount).to.equal(1)
      expect(getStakedErc1155.length).to.equal(0)

      await expect(stakingContract.unstakeERC721(22)).to.be.revertedWith(
        'Nft Staking System: user must be the owner of the staked nft',
      )
      await expect(stakingContract.unstakeERC1155(0, 0)).to.be.revertedWith(
        'Nft Staking System: user has no nfts of this type staked',
      )

      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[0].address,
        2,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        0,
      )
      getDojoBalanceB = await dojoContract.balanceOf(accounts[0].address)

      expect(getStakedErc721.amount).to.equal(1)
      expect(getStakedErc1155.length).to.equal(0)
      expect(getDojoBalanceA - getDojoBalanceB).to.equal(0)
    })
  })
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ GET NONEMPTY STAKED ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Query for staked erc721 and erc1155', function () {
    it('Should successfully reject unstake Unowned ERC 721 & ERC 1155', async function () {
      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[0].address,
        1,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        1,
      )

      expect(getStakedErc721.amount).to.equal(0)
      expect(getStakedErc1155[0].amount).to.equal(2)
    })
  })
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ GET EMPTY STAKED ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Query for already unstaked erc721 and erc1155', function () {
    it('Should successfully reject unstake Unowned ERC 721 & ERC 1155', async function () {
      getStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[0].address,
        0,
      )
      getStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        0,
      )

      expect(getStakedErc721.amount).to.equal(0)
      expect(getStakedErc1155.length).to.equal(0)
    })
  })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ GET EMPTY STAKED ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Query for nonstaked erc721 and erc1155 tokens', function () {
    it('Should successfully reject unstake Unowned ERC 721 & ERC 1155', async function () {
      getEmptyStakedErc721 = await stakingContract.GetStakedERC721(
        accounts[0].address,
        10,
      )
      getEmptyStakedErc1155 = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        10,
      )

      expect(getEmptyStakedErc721.amount).to.equal(0)
      expect(getEmptyStakedErc1155.length).to.equal(0)
    })
  })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Batch Stake Owned ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Batch Stake Owned ERC 721 & ERC 1155', function () {
    it('Should successfully reject unstake Unowned ERC 721 & ERC 1155', async function () {
      await itemsContract.gift(accounts[0].address, 2, 5, '')
      erc271Balance = await landContract.balanceOf(accounts[0].address)
      erc1155ABalance = await itemsContract.balanceOf(accounts[0].address, 1)
      erc1155BBalance = await itemsContract.balanceOf(accounts[0].address, 2)
      expect(erc271Balance).to.equal(14)
      expect(erc1155ABalance).to.equal(8)
      expect(erc1155BBalance).to.equal(5)

      console.log(
        'await  :>> ',
        await stakingContract.GetAllStakedERC721(accounts[0].address),
      )
      await stakingContract.batchStakeERC721([6, 7, 8])
      await stakingContract.batchStakeERC1155([1, 2], [5, 5])

      erc271Balance = await landContract.balanceOf(accounts[0].address)
      erc1155ABalance = await itemsContract.balanceOf(accounts[0].address, 1)
      erc1155BBalance = await itemsContract.balanceOf(accounts[0].address, 2)
      expect(erc271Balance).to.equal(11)
      expect(erc1155ABalance).to.equal(3)
      expect(erc1155BBalance).to.equal(0)
    })
  })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Batch Stake Unowned ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Batch Stake Unowned ERC 721 & ERC 1155', function () {
    it('Should successfully reject unstake Unowned ERC 721 & ERC 1155', async function () {
      erc271Balance = await landContract.balanceOf(accounts[1].address)
      erc1155ABalance = await itemsContract.balanceOf(accounts[1].address, 0)
      erc1155BBalance = await itemsContract.balanceOf(accounts[2].address, 2)
      expect(erc1155ABalance).to.equal(0)
      expect(erc1155BBalance).to.equal(0)
      expect(erc271Balance).to.equal(1)

      await expect(
        stakingContract.connect(accounts[1]).batchStakeERC721([1, 2]),
      ).to.be.revertedWith('Account doesnt own token')
      await expect(
        stakingContract
          .connect(accounts[1])
          .batchStakeERC1155([0, 1, 2], [5, 5, 5]),
      ).to.be.revertedWith('Account have less token')

      erc271Balance = await landContract.balanceOf(accounts[1].address)
      erc1155ABalance = await itemsContract.balanceOf(accounts[1].address, 0)
      erc1155BBalance = await itemsContract.balanceOf(accounts[2].address, 2)
      expect(erc1155ABalance).to.equal(0)
      expect(erc1155BBalance).to.equal(0)
      expect(erc271Balance).to.equal(1)
    })
  })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Batch Stake Already Staked ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Batch Stake Already Staked ERC 721 & ERC 1155', function () {
    it('Should successfully reject unstake Unowned ERC 721 & ERC 1155', async function () {
      erc271Balance = await landContract.balanceOf(accounts[0].address)
      erc1155ABalance = await itemsContract.balanceOf(accounts[0].address, 0)
      erc1155BBalance = await itemsContract.balanceOf(accounts[0].address, 2)
      expect(erc1155ABalance).to.equal(0)
      expect(erc1155BBalance).to.equal(0)
      expect(erc271Balance).to.equal(11)

      await landContract.connect(accounts[1]).publicSaleMint(20)
      await expect(stakingContract.batchStakeERC721([20, 3])).to.be.revertedWith(
        'Account doesnt own token',
      )
      await expect(
        stakingContract.batchStakeERC1155([0, 2], [5, 5]),
      ).to.be.revertedWith('Account have less token')

      erc271Balance = await landContract.balanceOf(accounts[0].address)
      erc1155ABalance = await itemsContract.balanceOf(accounts[0].address, 0)
      erc1155BBalance = await itemsContract.balanceOf(accounts[0].address, 2)
      expect(erc1155ABalance).to.equal(0)
      expect(erc1155BBalance).to.equal(0)
      expect(erc271Balance).to.equal(11)
    })
  })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Batch Unstake Owned ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Batch Unstake Owned ERC 721 & ERC 1155', function () {
    it('Should successfully reject unstake Unowned ERC 721 & ERC 1155', async function () {
      await itemsContract.gift(accounts[0].address, 2, 5, '')
      await stakingContract.stakeERC721(1)
      await stakingContract.stakeERC1155(2, 5)
      getStakedErc721A = await stakingContract.GetStakedERC721(
        accounts[0].address,
        1,
      )
      getStakedErc721B = await stakingContract.GetStakedERC721(
        accounts[0].address,
        2,
      )
      getStakedErc1155A = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        1,
      )
      getStakedErc1155B = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        2,
      )
      expect(getStakedErc721A.amount).to.equal(1)
      expect(getStakedErc721B.amount).to.equal(1)
      expect(getStakedErc1155A[0].amount).to.equal(2)
      expect(getStakedErc1155B[0].amount).to.equal(5)

      erc271Balance = await landContract.balanceOf(accounts[0].address)
      erc1155ABalance = await itemsContract.balanceOf(accounts[0].address, 1)
      erc1155BBalance = await itemsContract.balanceOf(accounts[0].address, 2)
      expect(erc1155ABalance).to.equal(3)
      expect(erc1155BBalance).to.equal(0)
      expect(erc271Balance).to.equal(10)

      await stakingContract.batchUnstakeERC721([1, 2])
      await stakingContract.batchUnstakeERC1155([1, 2], [0, 0])

      getStakedErc721A = await stakingContract.GetStakedERC721(
        accounts[0].address,
        1,
      )
      getStakedErc721B = await stakingContract.GetStakedERC721(
        accounts[0].address,
        2,
      )
      getStakedErc1155A = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        1,
      )
      getStakedErc1155B = await stakingContract.GetStakedERC1155(
        accounts[0].address,
        2,
      )
      expect(getStakedErc721A.amount).to.equal(0)
      expect(getStakedErc721B.amount).to.equal(0)
      expect(getStakedErc1155A.length).to.equal(3)
      expect(getStakedErc1155B.length).to.equal(1)

      erc271Balance = await landContract.balanceOf(accounts[0].address)
      erc1155ABalance = await itemsContract.balanceOf(accounts[0].address, 1)
      erc1155BBalance = await itemsContract.balanceOf(accounts[0].address, 2)
      expect(erc1155ABalance).to.equal(5)
      expect(erc1155BBalance).to.equal(5)
      expect(erc271Balance).to.equal(12)
    })
  })

  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Batch Unstake Unowned ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Batch Unstake Unowned ERC 721 & ERC 1155', function () {
    it('Should successfully reject unstake Unowned ERC 721 & ERC 1155', async function () {
      await expect(
        stakingContract.connect(accounts[1]).batchUnstakeERC721([1, 2]),
      ).to.be.revertedWith(
        'Nft Staking System: user must be the owner of the staked nft',
      )
      await expect(
        stakingContract
          .connect(accounts[1])
          .batchUnstakeERC1155([0, 1, 2], [5, 5, 5]),
      ).to.be.revertedWith(
        'Nft Staking System: user has no nfts of this type staked',
      )
    })
  })
  //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Batch Unstake Already Staked ERC 721 & ERC 1155 ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
  describe('Batch Unstake Already Staked ERC 721 & ERC 1155', function () {
    it('Should successfully reject unstake Unowned ERC 721 & ERC 1155', async function () {
      await expect(
        stakingContract.batchUnstakeERC721([1, 2]),
      ).to.be.revertedWith(
        'Nft Staking System: user must be the owner of the staked nft',
      )
      await expect(
        stakingContract.batchUnstakeERC1155([0, 1, 2], [5, 5, 5]),
      ).to.be.revertedWith(
        'Nft Staking System: user has no nfts of this type staked',
      )
    })
  })
})
