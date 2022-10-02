require('dotenv').config()
require('@nomiclabs/hardhat-waffle')
require("@nomiclabs/hardhat-etherscan")
require("hardhat-gas-reporter")

module.exports = {
  paths: {
    artifacts: './artifacts',
  },
  solidity: {
    version: "0.8.7",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  mocha: {
    timeout: 40000,
  },
  networks: {
    hardhat: {
      chainId: 31337,
      allowUnlimitedContractSize: true
    },
    // rinkeby: {
    //   url: process.env.INFURA,
    //   accounts: [process.env.PRIVATE_KEY],
    // },
  //   bsctestnet: {
  //     url: "https://data-seed-prebsc-1-s1.binance.org:8545",
  //     chainId: 97,
  //     gasPrice: 20000000000,
  //     accounts: [process.env.PRIVATE_KEY]
  //   },
  },
  // etherscan: {
  //   apiKey: process.env.ETHERSCAN
  // },
  gasReporter: {
    currency: 'EUR',
    gasPrice: 21,
    showTimeSpent: true,
  }
}