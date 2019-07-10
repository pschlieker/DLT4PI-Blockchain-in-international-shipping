const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const fs = require('fs');

// Create a new file system based wallet for managing identities.
const walletPath = path.join(process.cwd(), 'wallet');
const wallet = new FileSystemWallet(walletPath);
// console.log(`Wallet path: ${walletPath}`);

module.exports = {

    /**
     * Execute queryShip chaincode
     * @param {string} ccpPath - path to connection profile
     * @param {string} username - username of the peer
     * @param {string} channelName
     * @param {string} imo - imo number of the ship
     */
    async queryShip(ccpPath, username, channelName, imo) {
        try {
            const userExists = await wallet.exists(username);
            if (!userExists) {
                console.log(`An identity for the user ${username} does not exist in the wallet`);
                console.log('Run the registerUser before retrying');
                return;
            }

            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccpPath, { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork(channelName);

            // Get the contract from the network.
            const contractName = 'shipping';
            const contract = network.getContract(contractName);

            // Evaluate the specified transaction.
            // queryShip - requires 1 argument, e.g. ('queryShip', '5671234')
            const transactionName = 'queryShip';
            const result = await contract.evaluateTransaction(transactionName, imo);
            console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
            return result;

        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
        }
    },

    /**
     * Execute queryAllShipsByCountry chaincode
     * @param {string} ccpPath - path to connection profile
     * @param {string} username - username of the peer
     * @param {string} channelName
     * @param {string} country
     */
    async queryAllShipsByCountry(ccpPath, username, channelName, country) {
        try {
            const userExists = await wallet.exists(username);
            if (!userExists) {
                console.log(`An identity for the user ${username} does not exist in the wallet`);
                console.log('Run the registerUser before retrying');
                return;
            }

            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccpPath, { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork(channelName);

            // Get the contract from the network.
            const contractName = 'shipping';
            const contract = network.getContract(contractName);

            // Evaluate the specified transaction.
            // queryAllShipsByCountry - requires 1 argument, e.g. ('queryAllShipsByCountry', 'Denmark')
            const transactionName = 'queryAllShipsByCountry';
            const result = await contract.evaluateTransaction(transactionName, country);
            console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
            return result;

        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
        }
    },

    /**
     * Execute grantCertAccess to grant the private certificate collection to another Marititme Authority
     * @param {string} ccpPath - path to connection profile
     * @param {string} username - username of the peer
     * @param {string} chaincodeVersion - new version of chaincode (e.g. 0.0.3 or v3)
     * @param {string} channelName
     * @param {string} requester
     * @param {string} target
     */
    async grantCertAccess(ccpPath, username, chaincodeVersion, channelName, requester, target) {
        try {
            const userExists = await wallet.exists(username);
            if (!userExists) {
                console.log(`An identity for the user ${username} does not exist in the wallet`);
                console.log('Run the registerUser before retrying');
                return;
            }

            let requesterName = requester.charAt(0).toUpperCase() + requester.slice(1);
            let targetName = target.charAt(0).toUpperCase() + target.slice(1);
            let collectionConfigPath = path.resolve('..', '..', 'chaincode', 'collections_config.json');

            // read the original endorsement policy
            let config = JSON.parse(fs.readFileSync(collectionConfigPath));
            config.forEach((collection) => {
                if (collection.name === `collection${targetName}ShipCertificates`) {
                    let policy = collection.policy; // OR('DenmarkMSP.member') change to OR('DenmarkMSP.member', 'EstoniaMSP.member')
                    let orginalPolicy = policy.substring(0, policy.lastIndexOf('\'') + 1);
                    let requesterMSP = requesterName + 'MSP.member';
                    let newPolicy = orginalPolicy + `, '${requesterMSP}')`;
                    collection.policy = newPolicy;
                    console.log('New policy will be: ' + newPolicy);
                }
            });
            // write the new endorsement policy to the file
            fs.writeFileSync(collectionConfigPath, JSON.stringify(config, null, 2));

            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccpPath, { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } });

            // Get the identity (client) connected to the gateway
            const client = gateway.getClient();
            // Install chaincode
            await client.installChaincode({
                chaincodePath: '../../chaincode/lib/shipping',
                chaincodeId: 'shipping',
                chaincodeVersion: chaincodeVersion, // every upgrade requires new chaincode version number
                chaincodeType: 'node',
                channelNames: [channelName]
            });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork(channelName);
            // Upgrade chaincode
            let proposalResponse = await network.sendUpgradeProposal({
                chaincodeType: 'node',
                chaincodeId: 'shipping',
                chaincodeVersion: chaincodeVersion,
                txId: client.newTransactionID()
            });
            console.log(proposalResponse);

            console.info('============= START : Chaincode Upgrade ===========');
            const transactionResponse = await network.sendTransaction({
                proposalResponses: proposalResponse[0],
                proposal: proposalResponse[1]
            });

            console.log(transactionResponse);
        } catch (error) {
            console.error(`Failed to send transaction: ${error}`);
        }
    },

    /**
     * Execute queryCert chaincode
     * @param {string} ccpPath - path to connection profile
     * @param {string} username - username of the peer
     * @param {string} channelName
     * @param {string} imo - imo number of the ship
     */
    async queryCert(ccpPath, username, channelName, imo) {
        try {
            const userExists = await wallet.exists(username);
            if (!userExists) {
                console.log(`An identity for the user ${username} does not exist in the wallet`);
                console.log('Run the registerUser before retrying');
                return;
            }

            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccpPath, { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork(channelName);

            // Get the contract from the network.
            const contractName = 'shipping';
            const contract = network.getContract(contractName);

            // Evaluate the specified transaction.
            // readPrivateShipCertificate - requires 1 argument, e.g. ('readPrivateShipCertificate', '5671234')
            const transactionName = 'readPrivateShipCertificate';
            const result = await contract.evaluateTransaction(transactionName, imo);
            console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
            return result;

        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
        }
    },

    /**
     * Execute createShip chaincode
     * @param {string} ccpPath - path to connection profile
     * @param {string} username - username of the peer
     * @param {string} channelName
     * @param {string} imo
     * @param {string} name
     * @param {string} shipType
     * @param {string} flag
     * @param {string} homePort
     * @param {number} tonnage
     * @param {string} owner
     */
    async createShip(ccpPath, username, channelName, imo, name, shipType, flag, homePort, tonnage, owner) {
        try {
            const userExists = await wallet.exists(username);
            if (!userExists) {
                console.log(`An identity for the user ${username} does not exist in the wallet`);
                console.log('Run the registerUser before retrying');
                return;
            }

            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccpPath, { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork(channelName);

            // Get the contract from the network.
            const contractName = 'shipping';
            const contract = network.getContract(contractName);

            // Submit the specified transaction.
            // createShip - requires 7 argument, e.g. ('createShip', '5671234', 'APPLE', 'Container Ship', 'Denmark', 'Port of Copenhagen', '1234', 'Alice')
            const transactionName = 'createShip';
            await contract.submitTransaction(transactionName, imo, name, shipType, flag, homePort, tonnage, owner);
            console.log('Transaction has been submitted');

            await gateway.disconnect();

        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
        }
    }

};