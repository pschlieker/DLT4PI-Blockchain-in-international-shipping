const {FileSystemWallet, Gateway} = require('fabric-network');
const path = require('path');
const fs = require('fs');

// Create a new file system based wallet for managing identities.
const walletPath = path.join(process.cwd(), 'dma', 'wallet');
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
            await gateway.connect(ccpPath, {wallet, identity: username, discovery: {enabled: true, asLocalhost: true}});

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork(channelName);

            // Get the contract from the network. (generalData, generalDataSolo, privateData, sharePrivateData)
            const contract = network.getContract('generalData');

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
            await gateway.connect(ccpPath, {wallet, identity: username, discovery: {enabled: true, asLocalhost: true}});

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork(channelName);

            // Get the contract from the network. (generalData, generalDataSolo, privateData, sharePrivateData)
            const contract = network.getContract('generalData');

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
     * e.g. grantCertAccess('connectionProfile.json', 'username', 'channelName','Denmark', 'Estonia)
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
            if (targetName === 'Denmark') {
                targetName = 'Dma';
            } else if (targetName === 'Estonia') {
                targetName = 'Vta';
            }
            // TODO check this path
            let collectionConfigPath = path.resolve('..', '..', 'chaincode', 'collections_config-vta.json');
            // read the original endorsement policy
            let config = JSON.parse(await fs.readFileSync(collectionConfigPath));
            config.forEach((collection) => {
                if (collection.name === `collection${targetName}ShipCertificates`) {
                    // OR('DmaMSP.member') change to OR('DmaMSP.member', 'VtaMSP.member')
                    let policy = collection.policy;
                    let orginalPolicy = policy.substring(0, policy.lastIndexOf('\'') + 1);
                    let requesterMSP = requesterName + 'MSP.member';
                    let newPolicy = orginalPolicy + `, '${requesterMSP}')`;
                    collection.policy = newPolicy;
                    console.log('New policy will be: ' + newPolicy);
                }
            });
            // write the new endorsement policy to the file
            await fs.writeFileSync(collectionConfigPath, JSON.stringify(config, null, 2));
            console.log('New policy is written');

            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccpPath, {wallet, identity: username, discovery: {enabled: true, asLocalhost: true}});

            // Get the identity (client) connected to the gateway
            const client = gateway.getClient();
            // Get new chaincode version
            const chaincodeVersion = this.getNewChaincodeVer();
            const peers = client.getPeersForOrg(gateway.getClient().getMspid());
            // Install chaincode
            await client.installChaincode({
                targets: peers,
                chaincodeId: 'shipping',
                chaincodeType: 'node',
                chaincodePath: '../../chaincode/node',
                chaincodeVersion: chaincodeVersion, // every upgrade requires new chaincode version number
                channelNames: [channelName]
            });
            console.log('Chaincode is installed');

            // Get the channel our contract is deployed to.
            const channel = await client.getChannel();
            // Upgrade chaincode
            let proposalResponse = await channel.sendUpgradeProposal({
                chaincodeId: 'shipping',
                chaincodeType: 'node',
                chaincodeVersion: chaincodeVersion,
                'collections-config': collectionConfigPath,
                txId: client.newTransactionID()
            });
            console.log(proposalResponse);

            console.info('============= START : Chaincode Upgrade ===========');
            const transactionResponse = await channel.sendTransaction({
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
            await gateway.connect(ccpPath, {wallet, identity: username, discovery: {enabled: true, asLocalhost: true}});

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork(channelName);

            // Get the contract from the network. (generalData, generalDataSolo, privateData, sharePrivateData)
            const contract = network.getContract('privateData');

            // Get the country of the logged user
            const Mspid = gateway.getClient().getMspid();
            let country;
            console.log(Mspid);
            if (Mspid === 'DmaMSP') {
                country = 'Denmark';
            } else if (Mspid === 'VtaMSP') {
                country = 'Estonia';
            }
            console.log(country);

            // Evaluate the specified transaction.
            // readPrivateShipCertificate - requires 2 argument, e.g. ('readPrivateShipCertificate', 'Denmark', '9274848')
            const transactionName = 'readPrivateShipCertificate';
            const result = await contract.evaluateTransaction(transactionName, country, imo);
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
            await gateway.connect(ccpPath, {wallet, identity: username, discovery: {enabled: true, asLocalhost: true}});

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork(channelName);

            // Get the contract from the network. (generalData, generalDataSolo, privateData, sharePrivateData)
            const contract = network.getContract('generalData');

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
     * @param {string} certHash - the IPFS Hash that links to the PDF certificate
     */

    async createShipCertificate(ccpPath, username, channelName, country, certName, certNum, imo, issueDate, expiryDate, certHash) {
        try {
            const userExists = await wallet.exists(username);
            if (!userExists) {
                console.log(`An identity for the user ${username} does not exist in the wallet`);
                console.log('Run the registerUser before retrying');
                return;
            }

            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccpPath, {wallet, identity: username, discovery: {enabled: true, asLocalhost: true}});

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork(channelName);

            // Get the contract from the network. (generalData, generalDataSolo, privateData, sharePrivateData)
            const contract = network.getContract('sharePrivateData');

            // private data
            const transientData = {
                certName: Buffer.from(certName),
                certNum: Buffer.from(certNum),
                imo: Buffer.from(imo),
                issueDate: Buffer.from(issueDate),
                expiryDate: Buffer.from(expiryDate),
                certHash: Buffer.from(certHash)
            };
            // Create Transaction and submit
            const transactionName = 'createPrivateShipCertificateTransient';
            const result = await contract.createTransaction(transactionName)
                .setTransient(transientData)
                .submit(country, imo);

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
    async requestShipCert(ccpPath, username, channelName, contractName, country, imo) {
        try {
            const userExists = await wallet.exists(username);
            if (!userExists) {
                console.log(`An identity for the user ${username} does not exist in the wallet`);
                console.log('Run the registerUser before retrying');
                return;
            }

            // Create a new gateway for connecting to our peer node.
            const gateway = new Gateway();
            await gateway.connect(ccpPath, {wallet, identity: username, discovery: {enabled: true, asLocalhost: true}});

            // Get the network (channel) our contract is deployed to.
            const network = await gateway.getNetwork(channelName);

            // Get the MSPid of the logged in identity (i.e. the requesting authority)
            const requester = ((gateway.getClient().getMspid() === 'DmaMSP') ? 'Denmark' : 'Estonia');
            console.log('Request Country: ' + requester);
            let contract;

            // Get the country of the queried ship
            contract = network.getContract('generalData');
            const ship = await contract.evaluateTransaction('queryShip', country, imo);
            console.log(`Evaluated queryShip transaction, result is ${ship.toString()}`);
            const targetCountry = JSON.parse(ship.toString()).flag;
            console.log('Target Country: ' + targetCountry);

            // Check the location of the ship by calling the verifyLocation chaincode
            contract = network.getContract('generalData');
            const isWithinBorder = await contract.evaluateTransaction('verifyLocation', imo, requester);
            console.log(`Evaluated verifyLocation transaction, result is: ${isWithinBorder.toString()}`);

            // If consensus is reached on the location of the ship (i.e. ship is within the requester's borders)
            if (isWithinBorder) {
                await this.grantCertAccess(ccpPath, username, channelName, requester, targetCountry);
                console.log(`Certificates of ship ${imo}: Access Granted`);
            } else {
                console.log(`The ship ${imo} is not within ${requester}'s borders`);
            }

        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
        }
    },

    /**
     * Verify the ship location
     * @param {string} ccpPath - path to connection profile
     * @param {string} username - username of the peer
     * @param {string} channelName
     * @param {string} country
     * @param {string} imo
     */
    async verifyLocation(ccpPath, username, channelName, country, imo) {
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

            // Get the contract from the network. (generalData, generalDataSolo, privateData, sharePrivateData)
            const contract = network.getContract('generalData');

            // Evaluate the specified transaction.
            // verifyLocation - requires 2 argument, e.g. ("verifyLocation", "9166778", "Estonia")
            const transactionName = 'verifyLocation';
            country = country.charAt(0).toUpperCase() + country.slice(1).toLowerCase();
            console.log(imo + ' ' + country);
            const result = await contract.evaluateTransaction(transactionName, imo, country);
            console.log(`Transaction has been evaluated, result is: ${result}`);
            return result;

        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
        }
    }
};
