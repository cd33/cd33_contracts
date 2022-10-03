const { expect } = require('chai')
const { ethers } = require('hardhat')

maxTotalSupply = ethers.utils.parseEther((21e6).toString())

describe('ERC20 TESTS', function () {
  beforeEach(async function () {
    ;[owner, investor] = await ethers.getSigners() // owner = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, investor = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
    Bibscoin20 = await hre.ethers.getContractFactory('Bibscoin20')
    bibscoin20 = await Bibscoin20.deploy()
    await bibscoin20.deployed()
  })

  it('a un nom', async function () {
    expect(await bibscoin20.name()).to.equal('Bibscoin')
  })

  it('a un symbole', async function () {
    expect(await bibscoin20.symbol()).to.equal('BIBS')
  })

  it('a une valeur décimal', async function () {
    expect(await bibscoin20.decimals()).to.equal(18)
  })

  it('Balances and totalSupply', async function () {
    await bibscoin20.mint(owner.address, 1000)
    await bibscoin20.mint(bibscoin20.address, 2000)
    expect(await bibscoin20.balanceOf(owner.address)).to.equal(1000)
    expect(await bibscoin20.balanceOf(bibscoin20.address)).to.equal(2000)
    expect(await bibscoin20.totalSupply()).to.equal(1000 + 2000)
  })

  it('REVERT: mint() OnlyOwner', async function () {
    await expect(
      bibscoin20.connect(investor).mint(owner.address, 1000),
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('REVERT: mint() Sold Out', async function () {
    await bibscoin20.mint(owner.address, maxTotalSupply)
    expect(await bibscoin20.totalSupply()).to.equal(maxTotalSupply)
    await expect(bibscoin20.mint(owner.address, 1)).to.be.revertedWith(
      'Sold Out',
    )
  })
})
