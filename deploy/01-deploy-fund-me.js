const { network } = require("hardhat")
const { networkConfig,developmentChains } = require("../helper-hardhat-config")

//deconstruction getNamedaccounts and deployments from hre ===> hardhat runtime enviroment
module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log, get } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    
    let ethUsdPriceFeedAddress
    if (developmentChains.includes(network.name)) {
         //optional if statments ===> if chainId is 31337

         // to check if we are deploying to a local network and getting the most recent deployment 
        const ethUsdAggregator = await get("MockV3Aggregator")
        ethUsdPriceFeedAddress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"]
    }
    log("----------------------------------------------------")
    log("Deploying FundMe and waiting for confirmations...")


    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAddress],
        log: true,
         // we need to wait if on a live network so we can verify properly
         waitConfirmations: network.config.blockConfirmations || 1,
    })
    log(`FundMe deployed at ${fundMe.address}`)


} 

module.exports.tags = ["all", "fundme"]