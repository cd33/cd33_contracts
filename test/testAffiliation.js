const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Affiliation', function () {
  const baseURI = 'ipfs://QmYkpa28u51JFnCjrnoaMf1LfyNiB9n5oSp6ERRQCX5eKE/'
  const salePrice = ethers.utils.parseEther('0.001')

  beforeEach(async function () {
    ;[owner, investor, titi, tata] = await ethers.getSigners() // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 et 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
    Bibscoin20 = await hre.ethers.getContractFactory('Bibscoin20')
    bibscoin20 = await Bibscoin20.deploy()
    await bibscoin20.deployed()

    Affiliation = await ethers.getContractFactory('Affiliation')
    contract721 = await Affiliation.deploy(baseURI)
    await contract721.deployed()

    await contract721.setPause()
  })

  it('mintSale() Referrer', async function () {
    referrerOwner = await contract721.referrer(owner.address)
    expect(referrerOwner.referredCount).to.equal(0)
    expect(referrerOwner.alreadyClaimed).to.equal(0)

    await contract721
      .connect(investor)
      .mintSale(20, owner.address, { value: (20 * salePrice).toString() })

    referrerOwner = await contract721.referrer(owner.address)
    expect(referrerOwner.referredCount).to.equal(20)

    await contract721
      .connect(investor)
      .mintSale(2, owner.address, { value: (2 * salePrice).toString() })
    await contract721.mintSale(15, investor.address, {
      value: (15 * salePrice).toString(),
    })

    referrerOwner = await contract721.referrer(owner.address)
    expect(referrerOwner.referredCount).to.equal(22)

    referrerInvestor = await contract721.referrer(investor.address)
    expect(referrerInvestor.referredCount).to.equal(15)

    // Fausse adresse
    await expect(
      contract721
        .connect(investor)
        .mintSale(2, '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92267', {
          value: (2 * salePrice).toString(),
        }),
    ).to.be.reverted

    // Mauvais format d'adresse
    await expect(
      contract721.connect(investor).mintSale(2, '', {
        value: (2 * salePrice).toString(),
      }),
    ).to.be.reverted
    await expect(
      contract721.connect(investor).mintSale(2, ' ', {
        value: (2 * salePrice).toString(),
      }),
    ).to.be.reverted
    await expect(
      contract721.connect(investor).mintSale(2, 'toto', {
        value: (2 * salePrice).toString(),
      }),
    ).to.be.reverted
  })

  it('REVERT: mintSale() Not allowed to self-referral', async function () {
    await expect(
      contract721.connect(investor).mintSale(1, investor.address),
    ).to.be.revertedWith('Not allowed to self-referral')
    await expect(
      contract721.connect(investor).mintSale(5, owner.address, {
        value: (5 * salePrice).toString(),
      }),
    ).not.to.be.reverted
  })

  describe('CLAIM REWARD', function () {
    it('claimReward()', async function () {
      await contract721
        .connect(investor)
        .mintSale(100, owner.address, { value: (100 * salePrice).toString() })

      referrerOwner = await contract721.referrer(owner.address)
      expect(referrerOwner.referredCount).to.equal(100)
      expect(referrerOwner.alreadyClaimed).to.equal(0)
      expect(await contract721.balanceOf(owner.address)).to.equal(0)

      await contract721.claimReward()

      referrerOwner = await contract721.referrer(owner.address)
      expect(referrerOwner.referredCount).to.equal(100)
      expect(referrerOwner.alreadyClaimed).to.equal(1)
      expect(await contract721.balanceOf(owner.address)).to.equal(1)

      await contract721
        .connect(investor)
        .mintSale(34, owner.address, { value: (34 * salePrice).toString() })

      referrerOwner = await contract721.referrer(owner.address)
      expect(referrerOwner.referredCount).to.equal(134)
      expect(referrerOwner.alreadyClaimed).to.equal(1)
      expect(await contract721.balanceOf(owner.address)).to.equal(1)

      await contract721.claimReward()

      referrerOwner = await contract721.referrer(owner.address)
      expect(referrerOwner.referredCount).to.equal(134)
      expect(referrerOwner.alreadyClaimed).to.equal(2)
      expect(await contract721.balanceOf(owner.address)).to.equal(2)
    })

    it('claimReward() Vérification des calculs, bon nombre de récompenses à chaque paliers', async function () {
      await contract721
        .connect(investor)
        .mintSale(100, owner.address, { value: (100 * salePrice).toString() })

      referrerOwner = await contract721.referrer(owner.address)
      expect(referrerOwner.referredCount).to.equal(100)
      expect(referrerOwner.alreadyClaimed).to.equal(0)
      expect(await contract721.balanceOf(owner.address)).to.equal(0)

      await contract721.claimReward()

      referrerOwner = await contract721.referrer(owner.address)
      expect(referrerOwner.referredCount).to.equal(100)
      expect(referrerOwner.alreadyClaimed).to.equal(1)
      expect(await contract721.balanceOf(owner.address)).to.equal(1)

      for (let i = 1; i < 27; i++) {
        await contract721
          .connect(investor)
          .mintSale(34, owner.address, { value: (34 * salePrice).toString() })

        referrerOwner = await contract721.referrer(owner.address)
        expect(referrerOwner.referredCount).to.equal(100 + 34 * i)
        expect(referrerOwner.alreadyClaimed).to.equal(i)
        expect(await contract721.balanceOf(owner.address)).to.equal(i)

        await contract721.claimReward()

        referrerOwner = await contract721.referrer(owner.address)
        expect(referrerOwner.referredCount).to.equal(100 + 34 * i)
        expect(referrerOwner.alreadyClaimed).to.equal(i + 1)
        expect(await contract721.balanceOf(owner.address)).to.equal(i + 1)
      }

      await contract721
        .connect(investor)
        .mintSale(16, owner.address, { value: (16 * salePrice).toString() })

      await contract721.claimReward()

      for (let i = 1; i < 10; i++) {
        await contract721
          .connect(investor)
          .mintSale(20, owner.address, { value: (20 * salePrice).toString() })

        referrerOwner = await contract721.referrer(owner.address)
        expect(referrerOwner.referredCount).to.equal(1000 + 20 * i)
        expect(referrerOwner.alreadyClaimed).to.equal(i + 27)
        expect(await contract721.balanceOf(owner.address)).to.equal(i + 27)

        await contract721.claimReward()

        referrerOwner = await contract721.referrer(owner.address)
        expect(referrerOwner.referredCount).to.equal(1000 + 20 * i)
        expect(referrerOwner.alreadyClaimed).to.equal(i + 27 + 1)
        expect(await contract721.balanceOf(owner.address)).to.equal(i + 27 + 1)
      }
    })

    it('claimReward() Vérification des calculs, bon nombre de récompenses en une fois', async function () {
      await contract721
        .connect(investor)
        .mintSale(100, owner.address, { value: (100 * salePrice).toString() })

      referrerOwner = await contract721.referrer(owner.address)
      expect(referrerOwner.referredCount).to.equal(100)
      expect(referrerOwner.alreadyClaimed).to.equal(0)
      expect(await contract721.balanceOf(owner.address)).to.equal(0)

      for (let i = 1; i < 27; i++) {
        await contract721
          .connect(investor)
          .mintSale(34, owner.address, { value: (34 * salePrice).toString() })

        referrerOwner = await contract721.referrer(owner.address)
        expect(referrerOwner.referredCount).to.equal(100 + 34 * i)
        expect(referrerOwner.alreadyClaimed).to.equal(0)
      }

      await contract721
        .connect(investor)
        .mintSale(16, owner.address, { value: (16 * salePrice).toString() })

      for (let i = 1; i < 10; i++) {
        await contract721
          .connect(investor)
          .mintSale(20, owner.address, { value: (20 * salePrice).toString() })

        referrerOwner = await contract721.referrer(owner.address)
        expect(referrerOwner.referredCount).to.equal(1000 + 20 * i)
        expect(referrerOwner.alreadyClaimed).to.equal(0)
      }

      await contract721.claimReward()

      referrerOwner = await contract721.referrer(owner.address)
      expect(referrerOwner.referredCount).to.equal(1180)
      expect(referrerOwner.alreadyClaimed).to.equal(37)
      expect(await contract721.balanceOf(owner.address)).to.equal(37)

      for (let i = 1; i < 20; i++) {
        await contract721
          .connect(investor)
          .mintSale(20, owner.address, { value: (20 * salePrice).toString() })

        referrerOwner = await contract721.referrer(owner.address)
        expect(referrerOwner.referredCount).to.equal(1180 + 20 * i)
        expect(referrerOwner.alreadyClaimed).to.equal(37)
      }

      await contract721.claimReward()

      referrerOwner = await contract721.referrer(owner.address)
      expect(referrerOwner.referredCount).to.equal(1560)
      expect(referrerOwner.alreadyClaimed).to.equal(56)
      expect(await contract721.balanceOf(owner.address)).to.equal(56)
    })

    it('claimReward() Vérification des calculs, multiple referrals et nombre aléatoire', async function () {
      function generateRandomInt(min, max) {
        return Math.floor(Math.random() * (max + 1 - min) + min)
      }

      random1 = generateRandomInt(50, 1000)
      random2 = generateRandomInt(50, 1000)
      random3 = generateRandomInt(50, 1000)

      await contract721.connect(investor).mintSale(random1, owner.address, {
        value: (random1 * salePrice).toString(),
      })

      referrerOwner = await contract721.referrer(owner.address)
      expect(referrerOwner.referredCount).to.equal(random1)
      expect(referrerOwner.alreadyClaimed).to.equal(0)
      expect(await contract721.balanceOf(owner.address)).to.equal(0)

      await contract721.connect(titi).mintSale(random2, owner.address, {
        value: (random2 * salePrice).toString(),
      })

      referrerOwner = await contract721.referrer(owner.address)
      expect(referrerOwner.referredCount).to.equal(random1 + random2)
      expect(referrerOwner.alreadyClaimed).to.equal(0)
      expect(await contract721.balanceOf(owner.address)).to.equal(0)

      await contract721.connect(tata).mintSale(random3, owner.address, {
        value: (random3 * salePrice).toString(),
      })

      referrerOwner = await contract721.referrer(owner.address)
      expect(referrerOwner.referredCount).to.equal(random1 + random2 + random3)
      expect(referrerOwner.alreadyClaimed).to.equal(0)
      expect(await contract721.balanceOf(owner.address)).to.equal(0)

      await contract721.claimReward()

      referrerOwner = await contract721.referrer(owner.address)
      if (referrerOwner.referredCount < 1000) {
        amountNFTClaimable = 1 + (referrerOwner.referredCount - 100) / 34
      } else {
        amountNFTClaimable = 28 + (referrerOwner.referredCount - 1000) / 20
      }

      expect(referrerOwner.referredCount).to.equal(random1 + random2 + random3)
      expect(referrerOwner.alreadyClaimed).to.equal(
        Math.floor(amountNFTClaimable),
      )
      expect(await contract721.balanceOf(owner.address)).to.equal(
        Math.floor(amountNFTClaimable),
      )
    })

    it('REVERT: claimReward() Not enough referral yet', async function () {
      await contract721
        .connect(investor)
        .mintSale(99, owner.address, { value: (99 * salePrice).toString() })

      await expect(contract721.claimReward()).to.be.revertedWith(
        'Not enough referral yet',
      )
    })

    it('REVERT: claimReward() No rewards available', async function () {
      await contract721
        .connect(investor)
        .mintSale(100, owner.address, { value: (100 * salePrice).toString() })

      await contract721.claimReward()

      await contract721
        .connect(investor)
        .mintSale(32, owner.address, { value: (32 * salePrice).toString() })

      await expect(contract721.claimReward()).to.be.revertedWith(
        'No rewards available',
      )
    })

    it('REVERT: claimReward() Sale unavailable for the moment', async function () {
      await contract721
        .connect(investor)
        .mintSale(100, owner.address, { value: (100 * salePrice).toString() })
      await contract721.setPause()

      await expect(contract721.claimReward()).to.be.revertedWith(
        'Sale unavailable for the moment',
      )
    })

    it('REVERT: claimReward() Sold out', async function () {
      await contract721
        .connect(investor)
        .mintSale(800, owner.address, { value: (800 * salePrice).toString() })
      await contract721
        .connect(investor)
        .mintSale(800, owner.address, { value: (800 * salePrice).toString() })
      await contract721
        .connect(investor)
        .mintSale(900, owner.address, { value: (900 * salePrice).toString() })
      await expect(contract721.claimReward()).to.be.revertedWith('Sold out')
    })
  })
})
