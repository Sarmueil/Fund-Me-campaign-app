require("@nomicfoundation/hardhat-toolbox");
require("hardhat-deploy")
require("dotenv").config()
require("hardhat-gas-reporter");


const RIKEBY_RPC_URL = process.env.RIKEBY_RPC_URL || ""
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  defaultNetwork:"hardhat",
  networks: {
    rinkeby: {
      url:RIKEBY_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId:4
     },
     localhost: {
      url:"http://127.0.0.1:8545/",
      //hardhat already took care of accounts
      chainId:31337
     }
  },
  solidity: {
    compilers: [
        {
            version: "0.8.8",
        },
        {
            version: "0.6.6",
        },
    ],
},
  gasReporter : {
    enabled:true,
    outputFile:'gas-report.txt',
    noColors:true,
    currency:"USD"
  },
  namedAccounts : {
    deployer :{
      default:0
    }
  }
};
