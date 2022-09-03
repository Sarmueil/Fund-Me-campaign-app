const { assert, expect } = require("chai")
const { network, deployments, ethers, getNamedAccounts } = require("hardhat")
const { developmentChains } = require("../../helper-hardhat-config")

!developmentChains.includes(network.name)
    ? describe.skip:
describe('FundMe', async function () {
    let fundMe
    let deployer
    let MockV3Aggregator 
    let sendValue = ethers.utils.parseEther("1") // 1ETH
    beforeEach(async function () {
        //get the latest deployed contract
        await deployments.fixture(['all'])
        //get the deployer from the network adresses 
        deployer = (await getNamedAccounts()).deployer
        MockV3Aggregator = await ethers.getContract('MockV3Aggregator', deployer)
        fundMe = await ethers.getContract('FundMe', deployer)

    })

    describe('constructor', async function () {
        it('sets the aggregator addresses correctely', async function () {
            const response = await fundMe.s_priceFeed()
            assert.equal(response, MockV3Aggregator.address) 
        })
    })

    describe('fund',async function () {
      it('failed when we do not send enough ETH', async function () {
        await expect(fundMe.fund()).to.be.revertedWith("You need to spend more ETH!")
      })
      it('should update the amount founded data structure', async function () {
         await fundMe.fund({value:sendValue})
         const response = await fundMe.s_addressToAmountFunded(deployer)
         assert.equal(response.toString(), sendValue.toString())
      })
      it('should pass the funders address into the funders array', async function () {
        await fundMe.fund({value:sendValue})
        const response = await fundMe.s_funders(0)
        assert.equal(response, deployer)
      })
    })
    
    describe('withdraw', async function () {
        beforeEach(async function () {
            await fundMe.fund({value:sendValue})
        })
        it("with ETH from a single founder", async function () {
            const startingFundMeBalance = await fundMe.provider.getBalance( fundMe.address )
            const startingDeployerBalance = await fundMe.provider.getBalance( deployer )

            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)

            const {gasUsed, effectiveGasPrice} = transactionReceipt

            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance( fundMe.address )
            const endingDeployerBalance = await fundMe.provider.getBalance( deployer ) 

            assert.equal(endingFundMeBalance, 0)
            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(), endingDeployerBalance.add(gasCost).toString())

        })

        it("is allows us to withdraw with multiple funders", async () => {

            //get accounts
            const accounts = await ethers.getSigners()
            for (i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectedContract.fund({ value: sendValue })
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const startingDeployerBalance = await fundMe.provider.getBalance(deployer)


            const transactionResponse = await fundMe.withdraw()
         
            const transactionReceipt = await transactionResponse.wait()
            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const withdrawGasCost = gasUsed.mul(effectiveGasPrice)
            
         
            const endingFundMeBalance = await fundMe.provider.getBalance(fundMe.address)
            const endingDeployerBalance =await fundMe.provider.getBalance(deployer)

            assert.equal(startingFundMeBalance.add(startingDeployerBalance).toString(),endingDeployerBalance.add(withdrawGasCost).toString())
            // Make a getter for storage variables
            await expect(fundMe.s_funders(0)).to.be.reverted

            for (i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.s_addressToAmountFunded(
                        accounts[i].address
                    ),
                    0
                )
            }
        })

        it("only allows the owner to withdraw", async function () {
            const accounts = await ethers.getSigners()
            const attackerAccount = accounts[1]
            const connectedAttackerAccounts = await fundMe.connect(attackerAccount)

            await expect(connectedAttackerAccounts.withdraw()).to.be.reverted
        })
    })
})