const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Bibs721A', function () {
  const merkleRoot =
    '0x1dfde04fd51b018c2d83a9273cba666580c79a9b5543fcbc8c3d9a469bae2b55'
  const proofOwner = [
    '0x96e8b17b5e17b5861adf5f6806a65cc54fa2ecdbf519b4898dfcf7851c2fa568',
    '0xefa651290ed1dfbd4e27bb6766a98aeb40198f07684f4682159135999fc36725',
  ]
  const proofListedInvestor = [
    '0x7ddf0c5320713853bb4e9d8b1ccfa0acbabe07bf95e4c8fe3154160e80fdace7',
    '0x69544beb25890c934579c67525db2c2f61ff18dc332f9d5412e8ec3282cbcc3b',
  ]
  const baseURI = 'ipfs://QmXezwmuWWwuQDUFzWuMyfv63KWdbzsk517BCgWWhe9AXX/'
  const MAX_SUPPLY = 6530
  const whitelistSalePrice = ethers.utils.parseEther('0.01')
  const publicSalePrice = ethers.utils.parseEther('0.02')
  whitelistLimitBalance = 2
  publicSaleLimitBalance = 4

  beforeEach(async function () {
    [owner, investor, listedInvestor] = await ethers.getSigners() // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 et 0x3c44cdddb6a900fa2b585dd299e03d12fa4293bc
    Bibs721A = await ethers.getContractFactory('Bibs721A')
    bibs = await Bibs721A.deploy(merkleRoot, baseURI)
    await bibs.deployed()
  })

  it("Receive test d'impossibilité, Only if you mint", async function () {
    balanceOwnerETHBefore = await ethers.provider.getBalance(owner.address)
    balanceContractETHBefore = await ethers.provider.getBalance(bibs.address)

    await expect(
      owner.sendTransaction({
        to: bibs.address,
        value: ethers.utils.parseEther('10'),
      }),
    ).to.be.revertedWith('Only if you mint'),

    balanceOwnerETHAfter = await ethers.provider.getBalance(owner.address)
    balanceContractETHAfter = await ethers.provider.getBalance(bibs.address)
    expect(balanceOwnerETHBefore).to.equal(balanceOwnerETHAfter)
    expect(balanceContractETHAfter).to.equal(balanceContractETHAfter).to.equal(0)
  })

  it('SetStep setStep() Changements de steps sellingStep()', async function () {
    step = await bibs.sellingStep()
    expect(step).to.equal(0)
    await bibs.setStep(1)
    step = await bibs.sellingStep()
    expect(step).to.equal(1)
    await bibs.setStep(2)
    step = await bibs.sellingStep()
    expect(step).to.equal(2)
    await bibs.setStep(0)
    step = await bibs.sellingStep()
    expect(step).to.equal(0)
  })

  it('REVERT: setStep() Not Owner', async function () {
    await expect(bibs.connect(investor).setStep(1)).to.be.revertedWith(
      'Ownable: caller is not the owner',
    )
  })

  // it('SetMaxSupply setMaxSupply() Changement de la max supply', async function () {
  //   test = await bibs.MAX_SUPPLY()
  //   expect(test).to.equal(MAX_SUPPLY)
  //   await bibs.setMaxSupply(1000)
  //   test = await bibs.MAX_SUPPLY()
  //   expect(test).to.equal(1000)
  // })

  // it('REVERT: setMaxSupply() Not Owner', async function () {
  //   await expect(bibs.connect(investor).setMaxSupply(1)).to.be.revertedWith(
  //     'Ownable: caller is not the owner',
  //   )
  // })

  // it('SetWhitelistSalePrice setWhitelistSalePrice() Changement du prix de la whitelist', async function () {
  //   test = await bibs.whitelistSalePrice()
  //   expect(test).to.equal(whitelistSalePrice)
  //   await bibs.setWhitelistSalePrice(1000)
  //   test = await bibs.whitelistSalePrice()
  //   expect(test).to.equal(1000)
  // })

  // it('REVERT: setWhitelistSalePrice() Not Owner', async function () {
  //   await expect(
  //     bibs.connect(investor).setWhitelistSalePrice(1),
  //   ).to.be.revertedWith('Ownable: caller is not the owner')
  // })

  // it('SetWhitelistLimitBalance setWhitelistLimitBalance() Changement de la balance limite de la whitelist', async function () {
  //   test = await bibs.whitelistLimitBalance()
  //   expect(test).to.equal(whitelistLimitBalance)
  //   await bibs.setWhitelistLimitBalance(250)
  //   test = await bibs.whitelistLimitBalance()
  //   expect(test).to.equal(250)
  // })

  // it('REVERT: setWhitelistLimitBalance() Not Owner', async function () {
  //   await expect(
  //     bibs.connect(investor).setWhitelistLimitBalance(1),
  //   ).to.be.revertedWith('Ownable: caller is not the owner')
  // })

  // it('SetPublicSalePrice setPublicSalePrice() Changement du prix de la public sale', async function () {
  //   test = await bibs.publicSalePrice()
  //   expect(test).to.equal(publicSalePrice)
  //   await bibs.setPublicSalePrice(1000)
  //   test = await bibs.publicSalePrice()
  //   expect(test).to.equal(1000)
  // })

  // it('REVERT: setPublicSalePrice() Not Owner', async function () {
  //   await expect(
  //     bibs.connect(investor).setPublicSalePrice(1),
  //   ).to.be.revertedWith('Ownable: caller is not the owner')
  // })

  // it('SetPublicSaleLimitBalance setPublicSaleLimitBalance() Changement de la balance limite de la public sale', async function () {
  //   test = await bibs.publicSaleLimitBalance()
  //   expect(test).to.equal(publicSaleLimitBalance)
  //   await bibs.setPublicSaleLimitBalance(250)
  //   test = await bibs.publicSaleLimitBalance()
  //   expect(test).to.equal(250)
  // })

  // it('REVERT: setPublicSaleLimitBalance() Not Owner', async function () {
  //   await expect(
  //     bibs.connect(investor).setPublicSaleLimitBalance(1),
  //   ).to.be.revertedWith('Ownable: caller is not the owner')
  // })

  it('REVERT: setBaseUri() Not Owner', async function () {
    await expect(bibs.connect(investor).setBaseUri('toto')).to.be.revertedWith(
      'Ownable: caller is not the owner',
    )
  })

  it("REVERT: tokenURI() NFT doesn't exist", async function () {
    await expect(bibs.connect(investor).tokenURI(0)).to.be.revertedWith(
      "NFT doesn't exist",
    )
    await bibs.setStep(1)
    await bibs.whitelistSaleMint(1, proofOwner, {
      value: whitelistSalePrice,
    })
    tokenUri = await bibs.connect(investor).tokenURI(0)
    expect(tokenUri).to.be.equal("ipfs://QmXezwmuWWwuQDUFzWuMyfv63KWdbzsk517BCgWWhe9AXX/0.json")
  })

  // WHITELIST
  it('WhitelistMint whitelistSaleMint() tests argents', async function () {
    await bibs.setStep(1)
    balanceOwnerNFT = await bibs.balanceOf(owner.address)
    expect(balanceOwnerNFT).to.equal(0)
    balanceOwnerETHBefore = await ethers.provider.getBalance(owner.address)
    balanceInvestorETHBefore = await ethers.provider.getBalance(investor.address)

    mint = await bibs.whitelistSaleMint(1, proofOwner, {
      value: whitelistSalePrice,
    })
    await mint.wait() // wait until the transaction is mined

    balanceOwnerNFT = await bibs.balanceOf(owner.address)
    expect(balanceOwnerNFT).to.equal(1)
    balanceOwnerETHAfter = await ethers.provider.getBalance(owner.address)
    balanceInvestorETHAfter = await ethers.provider.getBalance(investor.address)
    expect(balanceOwnerETHBefore).to.be.gt(balanceOwnerETHAfter)
    expect(balanceInvestorETHBefore).to.be.lt(balanceInvestorETHAfter)
  })

  it('REVERT: whitelistSaleMint() Not active', async function () {
    await expect(
      bibs.whitelistSaleMint(1, proofOwner, { value: whitelistSalePrice }),
    ).to.be.revertedWith('Whitelist sale not active')
  })

  it('REVERT: publicSaleMint() Quantity must be greater than 0', async function () {
    await bibs.setStep(1)
    await expect(bibs.whitelistSaleMint(0, proofOwner)).to.be.revertedWith('MintZeroQuantity()')
  })

  it('REVERT: whitelistSaleMint() merkle access Not whitelisted', async function () {
    await bibs.setStep(1)
    await expect(
      bibs
        .connect(investor)
        .whitelistSaleMint(1, proofOwner, { value: whitelistSalePrice }),
    ).to.be.revertedWith('Not whitelisted')
  })

  it('REVERT: whitelistSaleMint() Limited number per wallet', async function () {
    await bibs.setStep(1)
    await bibs.whitelistSaleMint(2, proofOwner, {
      value: (2 * whitelistSalePrice).toString(),
    })

    await expect(
      bibs.whitelistSaleMint(1, proofOwner, { value: whitelistSalePrice }),
    ).to.be.revertedWith('Limited number per wallet')
  })

  it('REVERT: whitelistSaleMint() Not enough money', async function () {
    await bibs.setStep(1)
    await expect(
      bibs.whitelistSaleMint(1, proofOwner, {
        value: ethers.utils.parseEther('0.0000005'),
      }),
    ).to.be.revertedWith('Not enough funds')
  })

  // PUBLIC SALE
  it('PublicSaleMint publicSaleMint() tests argents', async function () {
    await bibs.setStep(2)
    balanceOwnerNFT = await bibs.balanceOf(owner.address)
    expect(balanceOwnerNFT).to.equal(0)
    balanceOwnerETHBefore = await ethers.provider.getBalance(owner.address)
    balanceInvestorETHBefore = await ethers.provider.getBalance(investor.address)

    mint = await bibs.publicSaleMint(3, {
      value: (3 * publicSalePrice).toString(),
    })
    await mint.wait()

    balanceOwnerNFT = await bibs.balanceOf(owner.address)
    expect(balanceOwnerNFT).to.equal(3)
    balanceOwnerETHAfter = await ethers.provider.getBalance(owner.address)
    balanceInvestorETHAfter = await ethers.provider.getBalance(investor.address)
    expect(balanceOwnerETHBefore).to.be.gt(balanceOwnerETHAfter)
    expect(balanceInvestorETHBefore).to.be.lt(balanceInvestorETHAfter)
  })

  it('REVERT: publicSaleMint() Not active', async function () {
    await expect(
      bibs.publicSaleMint(3, { value: (3 * publicSalePrice).toString() }),
    ).to.be.revertedWith('Public sale not active')
  })

  it('REVERT: publicSaleMint() Quantity must be greater than 0', async function () {
    await bibs.setStep(2)
    await expect(bibs.publicSaleMint(0)).to.be.revertedWith('MintZeroQuantity()')
  })

  // it('REVERT: publicSaleMint() Sold out et tests de balances', async function () {
  //   await bibs.setStep(2)
  //   currentIdNFT = await bibs.totalSupply()
  //   expect(currentIdNFT).to.equal(0)
  //   balanceOwnerNFT = await bibs.balanceOf(owner.address)
  //   expect(balanceOwnerNFT).to.equal(0)

  //   await bibs.setMaxSupply(3)
  //   await bibs.publicSaleMint(3, {
  //     value: (3 * publicSalePrice).toString(),
  //   })
  //   currentIdNFT = await bibs.totalSupply()
  //   expect(currentIdNFT).to.equal(3)
  //   balanceOwnerNFT = await bibs.balanceOf(owner.address)
  //   expect(balanceOwnerNFT).to.equal(3)

  //   await expect(
  //     bibs
  //       .connect(listedInvestor)
  //       .publicSaleMint(3, { value: (3 * publicSalePrice).toString() }),
  //   ).to.be.revertedWith('Sold out')
  // })

  it('REVERT: publicSaleMint() Not enough money', async function () {
    await bibs.setStep(2)
    await expect(
      bibs.publicSaleMint(3, { value: ethers.utils.parseEther('0.00000005') }),
    ).to.be.revertedWith('Not enough funds')
  })

  // GIFT
  it('Gift gift() tests argents', async function () {
    balanceOwnerNFT = await bibs.balanceOf(owner.address)
    expect(balanceOwnerNFT).to.equal(0)

    mint = await bibs.gift(owner.address, 3)
    await mint.wait()

    balanceOwnerNFT = await bibs.balanceOf(owner.address)
    expect(balanceOwnerNFT).to.equal(3)
  })

  it('REVERT: gift() Not Owner', async function () {
    await expect(
      bibs.connect(investor).gift(investor.address, 10),
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  // it('REVERT: gift() Sold out', async function () {
  //   await bibs.setMaxSupply(3)
  //   await bibs.gift(investor.address, 1)
  //   await expect(bibs.gift(investor.address, 3)).to.be.revertedWith('Sold out')
  // })

  it('REVERT: setMerkleRoot() Not Owner', async function () {
    await expect(
      bibs
        .connect(investor)
        .setMerkleRoot(
          '0x83cf4855b2c3c8c4e206fcba016cc84f201cd5b8b480fb6878405db4065e94ea',
        ),
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('Royalty royaltyInfo()', async function () {
    royalties = await bibs.royaltyInfo(1, ethers.utils.parseEther('1'))
    expect(royalties.receiver).to.equal(bibs.address)
    expect(ethers.utils.formatEther(royalties.royaltyAmount)).to.equal('0.07')
  })

  it('Test déroulement complet collection #1', async function () {
    await bibs.setMerkleRoot(
      '0x1dfde04fd51b018c2d83a9273cba666580c79a9b5543fcbc8c3d9a469bae2b55',
    )
    await bibs.setBaseUri(
      'ipfs://QmYkpa28u51JFnCjrnoaMf1LfyNiB9n5oSp6ERRQCX5eKE/',
    )

    balanceOwnerETHBefore = await ethers.provider.getBalance(owner.address)
    balanceInvestorETHBefore = await ethers.provider.getBalance(
      investor.address,
    )

    await bibs.setStep(1)
    mint = await bibs.whitelistSaleMint(1, proofOwner, {
      value: whitelistSalePrice,
    })
    await mint.wait()
    mint = await bibs
      .connect(listedInvestor)
      .whitelistSaleMint(2, proofListedInvestor, {
        value: (2 * whitelistSalePrice).toString(),
      })
    await mint.wait()

    await bibs.setStep(2)
    mint = await bibs.connect(listedInvestor).publicSaleMint(1, {
      value: publicSalePrice.toString(),
    })
    await mint.wait()
    mint = await bibs.connect(investor).publicSaleMint(2, {
      value: (2 * publicSalePrice).toString(),
    })
    await mint.wait()
    mint = await bibs.publicSaleMint(1, {
      value: publicSalePrice.toString(),
    })
    await mint.wait()

    await bibs.setBaseUri(
      'ipfs://QmXezwmuWWwuQDUFzWuMyfv63KWdbzsk517BCgWWhe9AXX/',
    )

    balanceOwnerETHAfter = await ethers.provider.getBalance(owner.address)
    balanceInvestorETHAfter = await ethers.provider.getBalance(investor.address)
    expect(balanceOwnerETHBefore).to.be.gt(balanceOwnerETHAfter)
    expect(balanceInvestorETHBefore).to.be.lt(balanceInvestorETHAfter)
  })
})
