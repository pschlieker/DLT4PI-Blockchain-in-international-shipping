/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway } = require('fabric-network');
const path = require('path');
const readline = require('readline');

const ccpPath = path.resolve(__dirname, '..', '..', 'shipping-network', 'connection-org1.json');

let username;
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    try {

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        rl.question('Username: ', (answer) => {
            username = answer;
            console.log(`Identity with username ${username} will be used.`);
            rl.close();
        });

        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists(username);
        if (!userExists) {
            console.log(`An identity for the user ${username} does not exist in the wallet`);
            console.log('Run the registerUser.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: username, discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const channelName = 'CHANNEL NAME HERE';
        const network = await gateway.getNetwork(channelName);

        // Get the contract from the network.
        const contractName = 'CONTRACT NAME HERE';
        const contract = network.getContract(contractName);

        // Evaluate the specified transaction.
        const transactionName = 'TRANSACTION NAME HERE';
        const result = await contract.evaluateTransaction(transactionName);
        console.log(`Transaction has been evaluated, result is: ${result.toString()}`);

    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);
        process.exit(1);
    }
}

main();
