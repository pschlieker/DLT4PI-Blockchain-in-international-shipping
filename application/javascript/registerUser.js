/*
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

const { FileSystemWallet, Gateway, X509WalletMixin } = require('fabric-network');
const path = require('path');
const readline = require('readline');

// modify the paths for connection here
const ccpPath = path.resolve(__dirname, '..', '..', 'shipping-network', 'connection-org1.json');

let username;
let affiliation;
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

        // Prompt for usename input
        rl.question('Username: ', (answer) => {
            username = answer;
            console.log(`A identity with username ${username} will be created.`);
            rl.close();
        });

        // Prompt for affiliation input (e.g. peer0.dma.dk / peer0.'veeteedeeamet.ee')
        rl.question('Please input the affiliation (country name): ', (answer) => {
            affiliation = answer;
            console.log(`The affiliation with ${username} is ${affiliation}`);
            rl.close();
        });

        // Check to see if we've already enrolled the user
        const userExists = await wallet.exists(username);
        if (userExists) {
            console.log(`An identity for the user "${username}" already exists in the wallet`);
            return;
        }

        // Check to see if we've already enrolled the admin user
        const adminExists = await wallet.exists('admin');
        if (!adminExists) {
            console.log('An identity for the admin user "admin" does not exist in the wallet');
            console.log('Run the enrollAdmin.js application before retrying');
            return;
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccpPath, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });

        // Get the CA client object from the gateway for interacting with the CA.
        const ca = gateway.getClient().getCertificateAuthority();
        const adminIdentity = gateway.getCurrentIdentity();

        // Register the user, enroll the user, and import the new identity into the wallet.
        const secret = await ca.register({ affiliation: affiliation, enrollmentID: username, role: 'client' }, adminIdentity);
        const enrollment = await ca.enroll({ enrollmentID: username, enrollmentSecret: secret });
        // modify the mspID to be connected
        const userIdentity = X509WalletMixin.createIdentity('Org1MSP', enrollment.certificate, enrollment.key.toBytes());
        await wallet.import(username, userIdentity);
        console.log(`Successfully registered and enrolled admin user "${username}" and imported it into the wallet`);

    } catch (error) {
        console.error(`Failed to register user [${username}]: ${error}`);
        process.exit(1);
    }
}

main();
