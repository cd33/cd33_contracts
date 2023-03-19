const { ethers } = require("hardhat");
const { expect } = require("chai");

describe.only("Vault", function () {
  let accounts;
  let owner;
  let user1;
  let user2;
  let user3;
  let tokenContract;
  let vaultContract;
  before(async function () {
    accounts = await hre.ethers.getSigners();
    owner = accounts[0];
    user1 = accounts[1];
    user2 = accounts[2];
    user3 = accounts[3];

    const ERC20_Reward_Token = await ethers.getContractFactory("Bibscoin20");
    tokenContract = await ERC20_Reward_Token.deploy();
    await tokenContract.deployed();

    const Vault = await ethers.getContractFactory("Vault");
    vaultContract = await Vault.deploy(tokenContract.address);
    await vaultContract.deployed();
  });

  describe("Stake Owned ERC 721 & ERC 115", function () {
    it("Should successfully stake owned tokens", async function () {
      // Owner mint and transfer to all users of the token
      const amountTokenMint = ethers.utils.parseEther((1e6).toString());
      const amountshared = ethers.utils.parseEther((2.5e5).toString());
      await tokenContract.mint(owner.address, amountTokenMint);
      await tokenContract.transfer(user1.address, amountshared);
      await tokenContract.transfer(user2.address, amountshared);
      await tokenContract.transfer(user3.address, amountshared);
      expect(await tokenContract.balanceOf(owner.address))
        .to.equal(await tokenContract.balanceOf(user1.address))
        .to.equal(await tokenContract.balanceOf(user2.address))
        .to.equal(await tokenContract.balanceOf(user3.address))
        .to.equal(amountshared);

      // Two users deposit a token amount on the vault
      const amountDepositUser1 = ethers.utils.parseEther((2e5).toString());
      const amountDepositUser2 = ethers.utils.parseEther((1e5).toString());
      let totalSupply = amountDepositUser1.add(amountDepositUser2);
      await tokenContract
        .connect(user1)
        .approve(vaultContract.address, amountDepositUser1);
      await tokenContract
        .connect(user2)
        .approve(vaultContract.address, amountDepositUser2);
      await vaultContract.connect(user1).deposit(amountDepositUser1);
      await vaultContract.connect(user2).deposit(amountDepositUser2);
      expect(await tokenContract.balanceOf(user1.address)).to.equal(
        amountshared.sub(amountDepositUser1)
      );
      expect(await tokenContract.balanceOf(user2.address)).to.equal(
        amountshared.sub(amountDepositUser2)
      );
      expect(await vaultContract.balanceOf(user1.address)).to.equal(
        amountDepositUser1
      );
      expect(await vaultContract.balanceOf(user2.address)).to.equal(
        amountDepositUser2
      );
      expect(await tokenContract.balanceOf(vaultContract.address)).to.equal(
        totalSupply
      );

      // Owner adds tokens to the vault
      const amountTransferOwner = ethers.utils.parseEther((1.5e5).toString());
      await tokenContract.transfer(vaultContract.address, amountTransferOwner);
      expect(await tokenContract.balanceOf(owner.address)).to.equal(
        amountshared.sub(amountTransferOwner)
      );
      const balanceVault = amountDepositUser1
        .add(amountDepositUser2)
        .add(amountTransferOwner);
      expect(await tokenContract.balanceOf(vaultContract.address))
        .to.equal(balanceVault)
        .to.equal(ethers.utils.parseEther((4.5e5).toString()));

      // User2 withdraws its money from the vault
      await vaultContract.connect(user2).withdraw(amountDepositUser2);
      expect(await tokenContract.balanceOf(user2.address))
        .to.equal(
          amountshared
            .sub(amountDepositUser2)
            .add(amountDepositUser2.mul(balanceVault).div(totalSupply))
        )
        .to.equal(ethers.utils.parseEther((3e5).toString()));

      // User who has not deposited, deposits money
      const amountDepositUser3 = ethers.utils.parseEther((2.5e5).toString());
      totalSupply = await vaultContract.totalSupply();
      await tokenContract
        .connect(user3)
        .approve(vaultContract.address, amountDepositUser3);
      await vaultContract.connect(user3).deposit(amountDepositUser3);
      expect(await tokenContract.balanceOf(user3.address))
        .to.equal(amountshared.sub(amountDepositUser3))
        .to.equal(0);
      sharesUser3 = await vaultContract.balanceOf(user3.address);

      // Both withdraw
      await vaultContract.connect(user1).withdraw(amountDepositUser1);
      await vaultContract.connect(user3).withdraw(sharesUser3);
      expect(await tokenContract.balanceOf(user3.address)).to.equal(
        amountDepositUser3
      );
    });
  });
});
