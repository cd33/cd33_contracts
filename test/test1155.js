const { expect } = require('chai')
const { ethers } = require('hardhat')

describe('Bibs1155', function () {
  const merkleRoot =
    '0x83cf4855b2c3c8c4e206fcba016cc84f201cd5b8b480fb6878405db4065e94ea'
  const proofOwner = [
    '0x7096914064585e5ac032405d8543deec25485927a47d4ff0a781316cc1edbbf3',
  ]
  const proofListedInvestor = [
    '0x7ddf0c5320713853bb4e9d8b1ccfa0acbabe07bf95e4c8fe3154160e80fdace7',
    '0x69544beb25890c934579c67525db2c2f61ff18dc332f9d5412e8ec3282cbcc3b',
  ]
  const baseURI = 'ipfs://QmYkpa28u51JFnCjrnoaMf1LfyNiB9n5oSp6ERRQCX5eKE/'
  const maxSupply = 6000;
  const whitelistSalePrice = ethers.utils.parseEther('0.01')
  const publicSalePrice = ethers.utils.parseEther('0.02')
  whitelistLimitBalance = 2
  publicSaleLimitBalance = 4

  beforeEach(async function () {
    [owner, investor] = await ethers.getSigners() // 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 et 0x70997970C51812dc3A010C7d01b50e0d17dc79C8    
    Bibs1155 = await ethers.getContractFactory('Bibs1155')
    bibs = await Bibs1155.deploy(merkleRoot, baseURI)
    await bibs.deployed()
  })

  // it('Différences de prix entre prémint avec transfer et sans', async function () {
  //   await bibs.setStep(1)
  //   tx1 = await bibs.preMint(1, { value: preSalePrice })
  //   tx2 = await bibs.preMintWithoutTransfer(1, { value: preSalePrice })
  //   calcul1 = tx1.gasPrice * tx1.gasLimit
  //   console.log(ethers.utils.formatEther(calcul1.toString()))
  //   calcul2 = parseInt(tx2.gasPrice) * parseInt(tx2.gasLimit)
  //   console.log(ethers.utils.formatEther(calcul2.toString()))
  // })

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

  it("REVERT: setStep() Not Owner", async function () {
    await expect(
      bibs.connect(investor).setStep(1),
    ).to.be.revertedWith("Ownable: caller is not the owner")
  })

  it("REVERT: setBaseUri() Not Owner", async function () {
    await expect(
      bibs.connect(investor).setBaseUri("toto"),
    ).to.be.revertedWith("Ownable: caller is not the owner")
  })

  it("REVERT: setMerkleRoot() Not Owner", async function () {
    await expect(
      bibs.connect(investor).setMerkleRoot("0x83cf4855b2c3c8c4e206fcba016cc84f201cd5b8b480fb6878405db4065e94ea"),
    ).to.be.revertedWith("Ownable: caller is not the owner")
  })

  it("REVERT: uri() NFT doesn't exist", async function () {
    await expect(
      bibs.connect(investor).uri(0),
    ).to.be.revertedWith("NFT doesn't exist")
    await expect(
      bibs.connect(investor).uri(5),
    ).to.be.revertedWith("NFT doesn't exist")
  })

  it('WhitelistMint whitelistSaleMint() tests argents', async function () {
    await network.provider.send("evm_setNextBlockTimestamp", [1652738400])
    await ethers.provider.send('evm_mine')
    await bibs.setStep(1)
    balanceOwnerNFT = await bibs.balanceOf(owner.address, 1)
    expect(balanceOwnerNFT).to.equal(0)
    balanceOwnerETHBefore = await ethers.provider.getBalance(owner.address)
    balanceInvestorETHBefore = await ethers.provider.getBalance(
      investor.address,
    )

    whiteMint = await bibs.whitelistSaleMint(proofOwner, 2, { value: (2 * whitelistSalePrice).toString() })
    await whiteMint.wait() // wait until the transaction is mined

    balanceOwnerNFT = await bibs.balanceOf(owner.address, 1)
    expect(balanceOwnerNFT).to.equal(2)
    balanceOwnerETHAfter = await ethers.provider.getBalance(owner.address)
    balanceInvestorETHAfter = await ethers.provider.getBalance(investor.address)
    expect(balanceOwnerETHBefore).to.be.gt(balanceOwnerETHAfter)
    expect(balanceInvestorETHBefore).to.be.lt(balanceInvestorETHAfter)
  })
    
  it('REVERT: whitelistSaleMint() Not active', async function () {
    await expect(
      bibs.whitelistSaleMint(proofOwner, 1, { value: whitelistSalePrice }),
    ).to.be.revertedWith('Whitelist sale not active')
  })

  it("REVERT: whitelistSaleMint() Quantity between 1 & 3", async function () {
    await bibs.setStep(1)
    await expect(bibs.whitelistSaleMint(proofOwner, 0, { value: whitelistSalePrice })).to.be.revertedWith("Quantity between 1 & 3")
    await expect(bibs.whitelistSaleMint(proofOwner, 4, { value: whitelistSalePrice })).to.be.revertedWith("Quantity between 1 & 3")
  })

  it('REVERT: whitelistSaleMint() merkle access Not whitelisted', async function () {
    await bibs.setStep(1)
    await expect(
      bibs
        .connect(investor)
        .whitelistSaleMint(proofOwner, 10, { value: whitelistSalePrice }),
    ).to.be.revertedWith('Not whitelisted')
  })

//   it('REVERT: whitelistSaleMint() Sold out et tests de balances', async function () {
//     await bibs.setStep(1)
//     currentIdNFT = await bibs.nextNFT()
//     expect(currentIdNFT).to.equal(0)
//     balanceOwnerNFT = await bibs.balanceOf(owner.address, 1)
//     expect(balanceOwnerNFT).to.equal(0)

//     await bibs.whitelistSaleMint(proofOwner, maxSupply, {
//       value: (maxSupply * whitelistSalePrice).toString(),
//     })
//     currentIdNFT = await bibs.nextNFT()
//     expect(currentIdNFT).to.equal(maxSupply)
//     balanceOwnerNFT = await bibs.balanceOf(owner.address, 1)
//     expect(balanceOwnerNFT).to.equal(maxSupply)

//     await expect(
//       bibs.whitelistSaleMint(proofOwner, 1, { value: whitelistSalePrice }),
//     ).to.be.revertedWith('Sold out')
//   })

  it('REVERT: whitelistSaleMint() Not enough money', async function () {
    await bibs.setStep(1)
    await expect(
      bibs.whitelistSaleMint(proofOwner, 3, { value: whitelistSalePrice }),
    ).to.be.revertedWith('Not enough funds')
  })

  it('publicSaleMint publicSaleMint() tests argents', async function () {
    await bibs.setStep(2)
    balanceOwnerNFT = await bibs.balanceOf(owner.address, 1)
    expect(balanceOwnerNFT).to.equal(0)
    balanceOwnerETHBefore = await ethers.provider.getBalance(owner.address)
    balanceInvestorETHBefore = await ethers.provider.getBalance(
      investor.address,
    )

    publicSaleMint = await bibs.publicSaleMint(2, { value: (2 * publicSalePrice).toString() })
    await publicSaleMint.wait() // wait until the transaction is mined
    balanceOwnerNFT = await bibs.balanceOf(owner.address, 1)
    expect(balanceOwnerNFT).to.equal(2)

    balanceOwnerETHAfter = await ethers.provider.getBalance(owner.address)
    balanceInvestorETHAfter = await ethers.provider.getBalance(investor.address)

    expect(balanceOwnerETHBefore).to.be.gt(balanceOwnerETHAfter)
    expect(balanceInvestorETHBefore).to.be.lt(balanceInvestorETHAfter)
  })

  it('REVERT: publicSaleMint() Not active', async function () {
    await expect(bibs.publicSaleMint(1, { value: publicSalePrice })).to.be.revertedWith(
      'Public sale not active',
    )
  })

  it("REVERT: publicSaleMint() Quantity between 1 & 15", async function () {
    await bibs.setStep(2)
    await expect(bibs.publicSaleMint(0, { value: publicSalePrice })).to.be.revertedWith("Quantity between 1 & 15")
    await expect(bibs.publicSaleMint(16, { value: publicSalePrice })).to.be.revertedWith("Quantity between 1 & 15")
  })

//   it('REVERT: publicSaleMint() Sold out et tests de balances', async function () {
//     await bibs.setStep(2)
//     currentIdNFT = await bibs.nextNFT()
//     expect(currentIdNFT).to.equal(0)
//     balanceOwnerNFT = await bibs.balanceOf(owner.address, 1)
//     expect(balanceOwnerNFT).to.equal(0)

//     await bibs.publicSaleMint(1500, { value: (1500 * publicSalePrice).toString() })
//     currentIdNFT = await bibs.nextNFT()
//     expect(currentIdNFT).to.equal(1500)
//     balanceOwnerNFT = await bibs.balanceOf(owner.address, 1)
//     expect(balanceOwnerNFT).to.equal(1500)

//     await bibs
//       .connect(investor)
//       .publicSaleMint(500, { value: (500 * publicSalePrice).toString() })
//     currentIdNFT = await bibs.nextNFT()
//     expect(currentIdNFT).to.equal(limitNFT3)
//     balanceInvestor = await bibs.balanceOf(investor.address, 1)
//     expect(balanceInvestor).to.equal(500)

//     await expect(bibs.publicSaleMint(1, { value: publicSalePrice })).to.be.revertedWith(
//       'Sold out',
//     )
//   })

  it('REVERT: publicSaleMint() Not enough money', async function () {
    await bibs.setStep(2)
    await expect(bibs.publicSaleMint(10, { value: publicSalePrice })).to.be.revertedWith(
      'Not enough funds',
    )
  })

  it("Gift gift()", async function () {
    balanceInvestorNFT = await bibs.balanceOf(investor.address, 1)
    expect(balanceInvestorNFT).to.equal(0)
    await bibs.gift(investor.address, 1, 10, "")
    balanceInvestorNFT = await bibs.balanceOf(investor.address, 1)
    expect(balanceInvestorNFT).to.equal(10)
    currentIdNFT = await bibs.nextNFT()
    expect(currentIdNFT).to.equal(10)
  })

  it("REVERT: gift() Not Owner", async function () {
    await expect(
      bibs.connect(investor).gift(investor.address, 1, 10, ""),
    ).to.be.revertedWith("Ownable: caller is not the owner")
  })

  it("REVERT: gift() NFT Sold out", async function () {
    await expect(
      bibs.gift(investor.address, 1, 1+maxSupply, ""),
    ).to.be.revertedWith("Sold out")
  })
})
