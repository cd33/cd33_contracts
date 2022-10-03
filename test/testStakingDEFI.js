const { expect } = require('chai')
const { ethers } = require('hardhat')

function addDays(days) {
  return days * 24 * 60 * 60
}

maxTotalSupply = ethers.utils.parseEther((2e8).toString())
balanceDeployMarketing = ethers.utils.parseEther((3e7).toString())
balanceStaking = ethers.utils.parseEther((1e7).toString())

describe('STAKING TESTS', function () {
  beforeEach(async function () {
    ;[
      owner,
      investor,
      vesting,
      marketing,
      toto,
      tata,
    ] = await ethers.getSigners()
    // // owner = 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266, investor = 0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
    // // marketing = 0x90F79bf6EB2c4f870365E785982E1f101E93b906
    // // toto = 0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65, tata = 0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc

    Bibscoin20 = await hre.ethers.getContractFactory('Bibscoin20')
    bibscoin20 = await Bibscoin20.deploy()
    await bibscoin20.deployed()

    StakingERC20 = await hre.ethers.getContractFactory('StakingERC20')
    staking = await StakingERC20.deploy(bibscoin20.address)
    await staking.deployed()

    await staking.setRewardsDuration(addDays(365)) // 1 an
    await staking.setPause()
    await bibscoin20.mint(staking.address, balanceStaking) // 10 millions

    // // UNIQUEMENT POUR LES TESTS: Vesting transfere 1000 à investor, toto et tata
    await bibscoin20.mint(investor.address, ethers.utils.parseEther('1000'))
    await bibscoin20.mint(toto.address, ethers.utils.parseEther('1000'))
    await bibscoin20.mint(tata.address, ethers.utils.parseEther('1000'))
    await bibscoin20
      .connect(investor)
      .approve(staking.address, ethers.utils.parseEther('1000'))
    await bibscoin20
      .connect(toto)
      .approve(staking.address, ethers.utils.parseEther('1000'))
    await bibscoin20
      .connect(tata)
      .approve(staking.address, ethers.utils.parseEther('1000'))

    await staking.notifyRewardAmount(balanceStaking)
  })

  it('StakingERC20 est bien initialisé, notifyRewardAmount()', async function () {
    const { timestamp } = await hre.ethers.provider.getBlock('latest')
    expect(await bibscoin20.balanceOf(staking.address)).to.equal(balanceStaking)
    expect(await bibscoin20.balanceOf(investor.address)).to.equal(
      ethers.utils.parseEther('1000'),
    )
    expect(await bibscoin20.balanceOf(toto.address)).to.equal(
      ethers.utils.parseEther('1000'),
    )
    expect(await bibscoin20.balanceOf(tata.address)).to.equal(
      ethers.utils.parseEther('1000'),
    )

    expect(await staking.duration()).to.equal(addDays(365))
    expect(await staking.finishAt()).to.equal(timestamp + addDays(365))
    expect(await staking.updatedAt()).to.equal(timestamp)
    expect(await staking.rewardRate()).to.equal(
      balanceStaking.div(addDays(365)),
    )
    expect(await staking.rewardPerTokenStored()).to.equal(0)
    expect(await staking.totalSupply()).to.equal(0)
  })

  it('Tax = 0, console.log dans le contrat', async function () {
    expect(await bibscoin20.balanceOf(staking.address)).to.equal(balanceStaking)
    expect(await staking.balanceOf(investor.address)).to.equal(0)

    await staking.connect(investor).stake('1')

    expect(await bibscoin20.balanceOf(staking.address)).to.equal(
      balanceStaking.add('1'),
    )
    expect(await staking.balanceOf(investor.address)).to.equal('1')

    await staking.connect(investor).unstake('1')
  })

  //   // ~~~~~~~~~~~~~~~~~~~~~~~~~~ CLASSIQUES ~~~~~~~~~~~~~~~~~~~~~~~~~~//

  it('setPause() Activation et desactivation de la pause', async function () {
    pause = await staking.notPaused()
    expect(pause).to.equal(true)
    await staking.setPause()
    pause = await staking.notPaused()
    expect(pause).to.equal(false)
  })

  it('REVERT: setPause() Not Owner', async function () {
    await expect(staking.connect(investor).setPause()).to.be.revertedWith(
      'Ownable: caller is not the owner',
    )
  })

  it('setRewardsDuration() Changement de la durée du staking', async function () {
    duration = await staking.duration()
    expect(duration).to.equal(addDays(365))

    const { timestamp } = await hre.ethers.provider.getBlock('latest')
    await ethers.provider.send('evm_mine', [
      parseInt(ethers.BigNumber.from(timestamp).add(addDays(365))),
    ])

    await staking.setRewardsDuration(3600)
    duration = await staking.duration()
    expect(duration).to.equal(3600)
  })

  it('REVERT: setRewardsDuration() Not Owner', async function () {
    await expect(
      staking.connect(investor).setRewardsDuration(60),
    ).to.be.revertedWith('Ownable: caller is not the owner')
  })

  it('REVERT: setRewardsDuration() Reward duration not finished', async function () {
    await expect(staking.setRewardsDuration(60)).to.be.revertedWith(
      'Reward duration not finished',
    )
  })

  describe('Initialisation et update de la pool, notifyRewardAmount()', function () {
    it('notifyRewardAmount() Ajout de liquidité dans la pool == Update', async function () {
      timestampBefore = await hre.ethers.provider.getBlock('latest')

      expect(await bibscoin20.balanceOf(staking.address)).to.equal(
        balanceStaking,
      )
      expect(await staking.finishAt()).to.equal(
        timestampBefore.timestamp + addDays(365),
      )
      expect(await staking.updatedAt()).to.equal(timestampBefore.timestamp)
      expect(await staking.rewardRate()).to.equal(
        balanceStaking.div(addDays(365)),
      )

      amountToAdd = ethers.utils.parseEther((1e6).toString())
      await bibscoin20.mint(staking.address, amountToAdd)

      await staking.notifyRewardAmount(amountToAdd)

      timestampAfter = await hre.ethers.provider.getBlock('latest')

      expect(await bibscoin20.balanceOf(staking.address)).to.equal(
        balanceStaking.add(amountToAdd),
      )
      expect(await staking.finishAt()).to.equal(
        timestampAfter.timestamp + addDays(365),
      )
      expect(await staking.updatedAt()).to.equal(timestampAfter.timestamp)
      calculArrondi1 = Math.round((await staking.rewardRate()) / 1e11) * 1e11
      calculArrondi2 =
        Math.round(balanceStaking.add(amountToAdd).div(31536000) / 1e11) * 1e11

      expect(calculArrondi1).to.equal(calculArrondi2)
    })

    it('REVERT: notifyRewardAmount() Not Owner', async function () {
      await expect(
        staking.connect(investor).notifyRewardAmount(60),
      ).to.be.revertedWith('Ownable: caller is not the owner')
    })

    it('REVERT: notifyRewardAmount() Reward rate must be greater than 0', async function () {
      const { timestamp } = await hre.ethers.provider.getBlock('latest')

      await ethers.provider.send('evm_mine', [
        parseInt(ethers.BigNumber.from(timestamp).add(addDays(365))),
      ])
      await expect(staking.notifyRewardAmount(1)).to.be.revertedWith(
        'Reward rate must be greater than 0',
      )
    })

    it('REVERT: notifyRewardAmount() Balance of contract must be greater than reward amount', async function () {
      await expect(
        staking.notifyRewardAmount(ethers.utils.parseEther('1')),
      ).to.be.revertedWith(
        'Balance of contract must be greater than reward amount',
      )
    })
  })

  describe('STAKE', function () {
    it('Staking', async function () {
      await staking.connect(investor).stake(ethers.utils.parseEther('1000'))

      const { timestamp } = await hre.ethers.provider.getBlock('latest')

      updatedAtBefore = await staking.updatedAt()
      balanceInvestorBefore = await bibscoin20.balanceOf(investor.address)
      balanceStakingBefore = await bibscoin20.balanceOf(staking.address)
      expect(await staking.rewardPerTokenStored()).to.equal(0)
      expect(await staking.rewardPerToken()).to.equal(0)

      expect(await staking.balanceOf(investor.address)).to.equal(
        ethers.utils.parseEther('1000'),
      )
      expect(await staking.totalSupply()).to.equal(
        ethers.utils.parseEther('1000'),
      )

      await ethers.provider.send('evm_mine', [
        parseInt(ethers.BigNumber.from(timestamp).add(60)),
      ])

      await staking.connect(investor).claimReward()

      updatedAtAfter = await staking.updatedAt()
      balanceInvestorAfter = await bibscoin20.balanceOf(investor.address)
      balanceStakingAfter = await bibscoin20.balanceOf(staking.address)
      expect(updatedAtBefore).to.be.lt(updatedAtAfter)
      expect(balanceInvestorBefore).to.be.lt(balanceInvestorAfter)
      expect(balanceStakingBefore).to.be.gt(balanceStakingAfter)

      await bibscoin20
        .connect(investor)
        .approve(staking.address, ethers.utils.parseEther('1000'))
      await bibscoin20.mint(investor.address, ethers.utils.parseEther('1000'))
      await staking.connect(investor).stake(ethers.utils.parseEther('1000'))

      expect(await staking.balanceOf(investor.address)).to.equal(
        ethers.utils.parseEther('2000'),
      )
      expect(await staking.totalSupply()).to.equal(
        ethers.utils.parseEther('2000'),
      )
    })

    it('REVERT: stake(), Staking unavailable for the moment', async function () {
      await staking.setPause()
      await expect(staking.connect(investor).stake(1)).to.be.revertedWith(
        'Staking unavailable for the moment',
      )
    })

    it('REVERT: stake(), Amount must be greater than 0', async function () {
      await expect(staking.connect(investor).stake(0)).to.be.revertedWith(
        'Amount must be greater than 0',
      )
    })

    it('REVERT: stake() ERC20: insufficient allowance', async function () {
      await expect(
        staking.connect(investor).stake(ethers.utils.parseEther('2000')),
      ).to.be.revertedWith('ERC20: insufficient allowance')
    })

    it('REVERT: stake() ERC20: transfer amount exceeds balance', async function () {
      await bibscoin20
        .connect(investor)
        .approve(staking.address, ethers.utils.parseEther('2000'))
      await expect(
        staking.connect(investor).stake(ethers.utils.parseEther('2000')),
      ).to.be.revertedWith('ERC20: transfer amount exceeds balance')
    })
  })

  describe('UNSTAKE', function () {
    it('Unstaking', async function () {
      const { timestamp } = await hre.ethers.provider.getBlock('latest')

      // Stake 1000 WRN
      await staking.connect(investor).stake(ethers.utils.parseEther('1000'))

      expect(await staking.balanceOf(investor.address)).to.equal(
        ethers.utils.parseEther('1000'),
      )
      expect(await staking.totalSupply()).to.equal(
        ethers.utils.parseEther('1000'),
      )

      // 1 minute plus tard
      await ethers.provider.send('evm_mine', [
        parseInt(ethers.BigNumber.from(timestamp).add(60)),
      ])

      // Unstake 500 WRN
      unstake = await staking
        .connect(investor)
        .unstake(ethers.utils.parseEther('500'))
      unstake = await unstake.wait()
      rewardPaid = unstake.events[2].args.reward

      expect(await staking.balanceOf(investor.address)).to.equal(
        ethers.utils.parseEther('500'),
      )
      expect(await staking.totalSupply()).to.equal(
        ethers.utils.parseEther('500'),
      )

      // 1 minute + 6 mois plus tard
      await ethers.provider.send('evm_mine', [
        parseInt(ethers.BigNumber.from(timestamp).add(15811260)),
      ])

      // Claim rewards, aifn de tester la tax avec le meme montant de rewards, 6 mois après'
      await staking.connect(investor).claimReward()

      // 1 minute + 6 mois + 1 minute plus tard')
      await ethers.provider.send('evm_mine', [
        parseInt(ethers.BigNumber.from(timestamp).add(15811320)),
      ])

      // Unstake 500 WRN
      unstake = await staking
        .connect(investor)
        .unstake(ethers.utils.parseEther('500'))
      unstake = await unstake.wait()
      rewardPaid2 = unstake.events[2].args.reward

      expect(await staking.balanceOf(investor.address)).to.equal(0)
      console.log('toto', await staking.totalSupply())
      expect(await staking.totalSupply()).to.equal(0)
    })

    it('REVERT: unstake(), Amount must be greater than 0', async function () {
      await expect(staking.connect(investor).unstake(0)).to.be.revertedWith(
        'Amount must be greater than 0',
      )
    })

    it('REVERT: unstake() Not enough funds', async function () {
      await expect(
        staking.connect(investor).unstake(ethers.utils.parseEther('2000')),
      ).to.be.revertedWith('Not enough funds')
    })
  })

  describe('CLAIM REWARD', function () {
    it('claimReward', async function () {
      const { timestamp } = await hre.ethers.provider.getBlock('latest')

      // Stake 1000 WRN
      await staking.connect(investor).stake(ethers.utils.parseEther('1000'))

      expect(await staking.balanceOf(investor.address)).to.equal(
        ethers.utils.parseEther('1000'),
      )
      balanceERC20InvestorBefore = await bibscoin20.balanceOf(investor.address)
      expect(balanceERC20InvestorBefore).to.equal(0)

      // 1 minute plus tard
      await ethers.provider.send('evm_mine', [
        parseInt(ethers.BigNumber.from(timestamp).add(60)),
      ])

      await staking.connect(investor).claimReward()

      expect(await staking.balanceOf(investor.address)).to.equal(
        ethers.utils.parseEther('1000'),
      )
      balanceERC20InvestorAfter = await bibscoin20.balanceOf(investor.address)
      expect(balanceERC20InvestorAfter).to.be.gt(balanceERC20InvestorBefore)

      // 1 minute + 1 minute plus tard')
      await ethers.provider.send('evm_mine', [
        parseInt(ethers.BigNumber.from(timestamp).add(120)),
      ])

      claimReward = await staking.connect(investor).claimReward()
      claimReward = await claimReward.wait()
      rewardPaid = claimReward.events[1].args.reward

      expect(await bibscoin20.balanceOf(investor.address)).to.equal(
        balanceERC20InvestorAfter.add(rewardPaid),
      )
    })

    it('REVERT: claimReward() No reward to claim', async function () {
      await expect(staking.connect(investor).claimReward()).to.be.revertedWith(
        'No reward to claim',
      )
    })
  })

  // it('Observations', async function () {
  //   await staking.connect(investor).stake(ethers.utils.parseEther('1000'))

  //   const { timestamp } = await hre.ethers.provider.getBlock('latest')

  //   console.log('**************************************')
  //   await ethers.provider.send('evm_mine', [
  //     parseInt(ethers.BigNumber.from(timestamp).add(60)),
  //   ])
  //   console.log('1 minute')

  //   console.log(
  //     'earnedInvestor :>> ',
  //     await staking.earned(investor.address),
  //   )

  //   await staking.connect(toto).stake(ethers.utils.parseEther('1000'))

  //   console.log('**************************************')
  //   await ethers.provider.send('evm_mine', [
  //     parseInt(ethers.BigNumber.from(timestamp).add(120)),
  //   ])
  //   console.log('2 minutes')

  //   console.log(
  //     'earnedInvestor :>> ',
  //     await staking.earned(investor.address),
  //   )
  //   console.log('earnedToto :>> ', await staking.earned(toto.address))

  //   await staking.connect(tata).stake(ethers.utils.parseEther('1000'))

  //   console.log('**************************************')
  //   await ethers.provider.send('evm_mine', [
  //     parseInt(ethers.BigNumber.from(timestamp).add(180)),
  //   ])
  //   console.log('3 minutes')

  //   console.log(
  //     'earnedInvestor :>> ',
  //     await staking.earned(investor.address),
  //   )
  //   console.log('earnedToto :>> ', await staking.earned(toto.address))
  //   console.log('earnedTata :>> ', await staking.earned(tata.address))

  //   console.log('RETRAIT INVESTOR')
  //   await staking
  //     .connect(investor)
  //     .unstake(ethers.utils.parseEther('1000'))

  //   console.log('**************************************')
  //   await ethers.provider.send('evm_mine', [
  //     parseInt(ethers.BigNumber.from(timestamp).add(240)),
  //   ])
  //   console.log('4 minutes')

  //   console.log(
  //     'balanceInvestor :>> ',
  //     await bibscoin20.balanceOf(investor.address),
  //   )
  //   console.log(
  //     'earnedInvestor :>> ',
  //     await staking.earned(investor.address),
  //   )
  //   console.log('earnedToto :>> ', await staking.earned(toto.address))
  //   console.log('earnedTata :>> ', await staking.earned(tata.address))

  //   console.log('duration', await staking.duration())
  //   console.log('finishAt', await staking.finishAt())
  //   console.log('updatedAt', await staking.updatedAt())
  //   console.log('rewardRate', await staking.rewardRate())
  //   console.log(
  //     'rewardPerTokenStored',
  //     await staking.rewardPerTokenStored(),
  //   )
  //   console.log('rewardPerToken', await staking.rewardPerToken())
  //   console.log('totalSupply', await staking.totalSupply())
  // })
})
