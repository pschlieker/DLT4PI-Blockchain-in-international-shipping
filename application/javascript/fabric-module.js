const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const ipfs = require('../../ipfs/ipfs-module');
const fs = require('fs');

// Create a new file system based wallet for managing identities.
const walletPath = path.join(process.cwd(), 'dma','wallet');
const wallet = new FileSystemWallet(walletPath);
// console.log(`Wallet path: ${walletPath}`);

let chaincodeVer = 'v1';

module.exports = {

    // add chaincode version everytime
    getNewChaincodeVer() {
        let newVer = chaincodeVer.charAt(0) + (parseInt(chaincodeVer.charAt(1)) + 1);
        chaincodeVer = newVer;
        return chaincodeVer;
    },

    /**
     * Execute queryShip chaincode
     * @param {string} ccpPath - path to connection profile
     * @param {string} username - username of the peer
     * @param {string} channelName
     * @param {string} country
     * @param {string} imo - imo number of the ship
     */
    async queryShip(ccpPath, username, channelName, country, imo) {
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
            const contractName = 'mycc';
            const contract = network.getContract(contractName);

            // Evaluate the specified transaction.
            // queryShip - requires 2 argument, e.g. ("queryShip", "Denmark", "9166778")
            const transactionName = 'queryShip';
            country = country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
            const result = await contract.evaluateTransaction(transactionName, country, imo);
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
            const contractName = 'mycc';
            const contract = network.getContract(contractName);

            // Evaluate the specified transaction.
            // queryAllShipsByCountry - requires 1 argument, e.g. ("queryAllShipsByCountry", "Denmark")
            const transactionName = 'queryAllShipsByCountry';
            country = country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
            const result = await contract.evaluateTransaction(transactionName, country);
            console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
            return result;

        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
        }
    },

    /**
     * Execute grantCertAccess to grant the private certificate collection to another Marititme Authority
     * e.g. grantCertAccess('connectionProfile.json', 'Denmark', 'shipChannel', 'Denmark', 'Estonia)
     * @param {string} ccpPath - path to connection profile
     * @param {string} username - username of the peer
     * @param {string} channelName
     * @param {string} requester - the country name of the requesting authority
     * @param {string} target - the country name of the queried ship
     */
    async grantCertAccess(ccpPath, username, channelName, requester, target) {
        try {
            const userExists = await wallet.exists(username);
            if (!userExists) {
                console.log(`An identity for the user ${username} does not exist in the wallet`);
                console.log('Run the registerUser before retrying');
                return;
            }

            let requesterName = requester.charAt(0).toUpperCase() + requester.slice(1).toLowerCase();
            let targetName = target.charAt(0).toUpperCase() + target.slice(1).toLowerCase();
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
            // Get new chaincode version
            const chaincodeVersion = this.getNewChaincodeVer();
            const peers = client.getPeersForOrg(gateway.getClient().getMspid());
            // Install chaincode
            let installResponse = await client.installChaincode({
                targets: peers,
                chaincodeId: 'shipping',
                chaincodeType: 'node',
                chaincodePath: '../../chaincode',
                chaincodeVersion: chaincodeVersion, // every upgrade requires new chaincode version number
                channelNames: [channelName]
            });

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork(channelName);
            // Upgrade chaincode
            let proposalResponse = await network.sendUpgradeProposal({
                chaincodeId: 'shipping',
                chaincodeType: 'node',
                chaincodeVersion: chaincodeVersion,
                'collections-config': collectionConfigPath,
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
            const contractName = 'mycc';
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
            const contractName = 'mycc';
            const contract = network.getContract(contractName);

            // Submit the specified transaction.
            // createShip - requires 7 argument, e.g. ('createShip', '5671234', 'APPLE', 'Container Ship', 'Denmark', 'Port of Copenhagen', '1234', 'Alice')
            const transactionName = 'createShip';
            await contract.submitTransaction(transactionName, imo, name, shipType, flag, homePort, tonnage, owner);
            console.log('Transaction has been submitted');

            await gateway.disconnect();

        } catch (error) {
            console.error(`Failed to submit transaction: ${error}`);
        }
    },

    /**
     * Create a ship certificate and store it into PDC of that maritime authority
     * @param {string} ccpPath - path to connection profile
     * @param {string} username - username of the peer
     * @param {string} channelName
     * @param {string} country
     * @param {string} certName
     * @param {string} certNum
     * @param {string} imo
     * @param {string} issueDate
     * @param {string} expiryDate
     * @param {string} fileHash - the IPFS Hash that links to the PDF certificate
     */
    async createShipCertificate(ccpPath, username, channelName, country, certName, certNum, imo, issueDate, expiryDate, fileHash) {
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
            const contractName = 'mycc';
            const contract = network.getContract(contractName);

            // Submit the specified transaction.
            // createPrivateShipCertificate - requires 7 argument, e.g. ("createPrivateShipCertificate", "Denmark", "International Oil Prevention certificate", "901234", "9166778", "2030-01-01", "2031-12-31", "IPFS_HashKey_to_Cert")
            const transactionName = 'createPrivateShipCertificate';

            await contract.submitTransaction(transactionName, country, certName, certNum, imo, issueDate, expiryDate, fileHash);
            console.log('Transaction has been submitted');

            await gateway.disconnect();

        } catch (error) {
            console.error(`Failed to submit transaction: ${error}`);
        }
    },

    /**
     * Request ship certificate
     * 1. call the chaincode to verify whether the ship location is within country's border
     * 2. if true, grant the requesting authority access to certificate using grantCertAccess()
     * @param {string} ccpPath - path to connection profile
     * @param {string} username - username of the peer
     * @param {string} channelName
     * @param {string} country
     * @param {string} imo
     */
    async requestShipCert(ccpPath, username, channelName, country, imo) {
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
            const contractName = 'mycc';
            const contract = network.getContract(contractName);

            // Get the MSPid of the logged in identity (i.e. the requesting authority)
            const requester = ((gateway.getClient().getMspid() == 'DmaMSP') ? 'Denmark' : 'Estonia');

            // Get the country of the queried ship
            const ship = await contract.evaluateTransaction('queryShip', country, imo);
            console.log(`Evaluated queryShip transaction, result is ${ship.toString()}`);
            const targetCountry = JSON.parse(ship.toString()).flag;

            // Check the location of the ship by calling the verifyLocation chaincode
            const isWithinBorder = await contract.evaluateTransaction('verifyLocation', imo, requester);
            console.log(`Evaluated verifyLocation transaction, result is: ${isWithinBorder.toString()}`);

            // If consensus is reached on the location of the ship (i.e. ship is within the requester's borders)
            if (isWithinBorder) {
                this.grantCertAccess(ccpPath, username, channelName, requester, targetCountry);
                console.log(`Certificates of ship ${imo}: Access Granted`);
            } else {
                console.log(`The ship ${imo} is not within ${requester}'s borders`);
            }

        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
        }
    }
};
