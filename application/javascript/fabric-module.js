const {FileSystemWallet, Gateway} = require('fabric-network');
const path = require('path');

// Create a new file system based wallet for managing identities.
const walletPath = path.join(process.cwd(), 'dma', 'wallet');
const wallet = new FileSystemWallet(walletPath);
// console.log(`Wallet path: ${walletPath}`);

const self = module.exports = {

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
     * Execute queryAllShips chaincode
     * @param {string} ccpPath - path to connection profile
     * @param {string} username - username of the peer
     * @param {string} channelName
     */
    async queryAllShips(ccpPath, username, channelName) {
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
            const contractName = 'generalData';
            const contract = network.getContract(contractName);

            // Evaluate the specified transaction.
            const transactionName = 'queryAllShips';
            const result = await contract.evaluateTransaction(transactionName);
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
     * @param {string} imo - imo number of the ship
     */
    async queryPrivateCert(ccpPath, username, channelName, imo) {
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

            // Get the country of the logged user
            const Mspid = gateway.getClient().getMspid();
            let country;
            let contractName = 'privateData';
            if (Mspid === 'DmaMSP') {
                country = 'Denmark';
                contractName += 'Dma';
            } else if (Mspid === 'VtaMSP') {
                country = 'Estonia';
                contractName += 'Vta';
            }

            // Get the contract from the network. (generalData, privateData, sharePrivateData)
            const contract = network.getContract(contractName);

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
     * Execute queryCert chaincode
     * @param {string} ccpPath - path to connection profile
     * @param {string} username - username of the peer
     * @param {string} channelName
     * @param {string} imo - imo number of the ship
     */
    async querySharedCert(ccpPath, username, channelName, imo) {
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

            // Get the contract from the network. (generalData, privateData, sharePrivateData)
            const contract = network.getContract('sharePrivateData');

            //Should be later replaced by the respective countires obtained
            let countries = 'DenmarkAndEstonia';

            // Evaluate the specified transaction.
            // readPrivateShipCertificate - requires 2 argument, e.g. ('readPrivateShipCertificate', 'Denmark', '9274848')
            const transactionName = 'readSharedShipCertificate';
            const result = await contract.evaluateTransaction(transactionName, countries, imo);
            console.log(`Transaction has been evaluated, result is: ${result.toString()}`);
            return result;

        } catch (error) {
            console.error(`Failed to evaluate transaction: ${error}`);
        }
    },

    /**
     * Execute queryCert chaincode
     * @param {string} ccpPath - path to connection profile
     * @param {string} username - username of the peer
     * @param {string} channelName
     * @param {string} country - country of the ship
     * @param {string} imo - imo number of the ship
     */
    async queryCert(ccpPath, username, channelName, country, imo) {
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

            // Get the country of the logged user
            const Mspid = gateway.getClient().getMspid();
            let requestingCountry;
            console.log(Mspid);
            if (Mspid === 'DmaMSP') {
                requestingCountry = 'Denmark';
            } else if (Mspid === 'VtaMSP') {
                requestingCountry = 'Estonia';
            }

            //Decide were to get the certificate from
            //If it is own ship, private certificate, if not shared certificate
            if(requestingCountry === country){
                console.log('Getting certificate from private collection');
                return this.queryPrivateCert(ccpPath, username, channelName, imo);
            }else{
                console.log('Getting certificate from shared collection');
                return this.querySharedCert(ccpPath, username, channelName, imo);
            }
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

            // Get the contract from the network. (generalData, privateData, sharePrivateData)
            const contract = network.getContract('generalData');

            // Submit the specified transaction.
            // createShip - requires 7 argument, e.g. ('createShip', '5671234', 'APPLE', 'Container Ship', 'Denmark', 'Port of Copenhagen', '1234', 'Alice')
            const transactionName = 'createShip';
            await contract.submitTransaction(transactionName, imo, name, shipType, flag, homePort, tonnage, owner);
            console.log('Transaction has been submitted');

            await gateway.disconnect();

        } catch (error) {
            console.error(`Failed to submit transaction: ${error}`);
            return Promise.reject(`Failed to submit transaction: ${error}`);
        }
    },

    /**
     * Create a ship certificate and store it into private PDC of that maritime authority
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
    async createPrivateShipCertificate(ccpPath, username, channelName, country, certName, certNum, imo, issueDate, expiryDate, certHash) {
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

            // Get the country of the logged user
            const Mspid = gateway.getClient().getMspid();
            let country;
            let contractName = 'privateData';
            if (Mspid === 'DmaMSP') {
                country = 'Denmark';
                contractName += 'Dma';
            } else if (Mspid === 'VtaMSP') {
                country = 'Estonia';
                contractName += 'Vta';
            }

            // Get the contract from the network. (generalData, generalDataSolo, privateData, sharePrivateData)
            const contract = network.getContract(contractName);

            // private data
            const transientData = {
                certName: Buffer.from(certName),
                certNum: Buffer.from(certNum),
                imo: Buffer.from(imo),
                issueDate: Buffer.from(issueDate),
                expiryDate: Buffer.from(expiryDate),
                certHash: Buffer.from(certHash)
            };

            console.log(country);
            console.log(imo);

            // Create Transaction and submit
            const transactionName = 'createPrivateShipCertificate';
            await contract.createTransaction(transactionName)
                .setTransient(transientData)
                .submit(country, imo);

            console.log('Transaction has been submitted');
            await gateway.disconnect();
        } catch (error) {
            console.error(`Failed to submit transaction: ${error}`);
            return Promise.reject(`Failed to submit transaction: ${error}`);

        }
    },

    /**
     * Create a ship certificate and store it into private PDC of that maritime authority
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
    async createSharedShipCertificate(ccpPath, username, channelName, country, certName, certNum, imo, issueDate, expiryDate, certHash) {
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

            let countries = 'DenmarkAndEstonia';

            // Get the contract from the network. (generalData, privateData, sharePrivateData)
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
            const transactionName = 'sharePrivateShipCertificate';
            await contract.createTransaction(transactionName)
                .setTransient(transientData)
                .submit(countries, imo);

            console.log('Transaction has been submitted');
            await gateway.disconnect();
        } catch (error) {
            console.error(`Failed to submit transaction: ${error}`);
            return Promise.reject(`Failed to submit transaction: ${error}`);

        }
    },

    /**
     * Share ship certificate
     * 1. call the chaincode to verify whether the ship location is within country's border
     * 2. if true, grant the requesting authority access to certificate
     * @param {string} ccpPath - path to connection profile
     * @param {string} username - username of the peer
     * @param {string} channelName
     * @param {string} providingCountry
     * @param {string} requestingCountry
     * @param {string} imo
     */
    async shareShipCertificate(ccpPath, username, channelName, providingCountry, requestingCountry, imo){
        let positionCheck = await this.verifyLocation(ccpPath, username, channelName, requestingCountry, imo);

        //TODO Integrate & Test Position check!
        // if(positionCheck.toString() === 'true'){

        if(positionCheck.toString() === 'true'){
            console.log('Ship within reach of country!');

            let certsAsByte = await this.queryPrivateCert(ccpPath, username, channelName, imo);
            let certs = JSON.parse(certsAsByte);

            for(let i=0; i < certs.length; i++){
                let cert = certs[i];

                await self.createSharedShipCertificate(
                    ccpPath,
                    username,
                    channelName,
                    providingCountry,
                    cert.certName,
                    cert.certNum,
                    cert.imo,
                    cert.issueDate,
                    cert.expiryDate,
                    cert.certHash
                );
            }
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

            // Get the contract from the network. (generalData, privateData, sharePrivateData)
            const contract = network.getContract('generalData');

            // Evaluate the specified transaction.
            // verifyLocation - requires 2 argument, e.g. ("verifyLocation", "9166778", "Denmark")
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
