const hre = require('hardhat')
const { MerkleTree } = require('merkletreejs')
const keccak256 = require('keccak256')
const tokens = require('./tokens.json')

async function main() {
  let tab = []
  tokens.map((token) => {
    tab.push(token.address)
  })
  const leaves = tab.map((address) => keccak256(address))
  const tree = new MerkleTree(leaves, keccak256, { sort: true })
  const root = tree.getHexRoot()

  const Bibs721A = await hre.ethers.getContractFactory('Bibs721A')
  const bibs721A = await Bibs721A.deploy(
    root,
    'ipfs://QmYkpa28u51JFnCjrnoaMf1LfyNiB9n5oSp6ERRQCX5eKE/',
  )
  await bibs721A.deployed()
  console.log('Bibs721A deployed to:', bibs721A.address)
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })