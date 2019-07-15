'use strict'

require('fabric-ca-client');
const { FileSystemWallet, X509WalletMixin } = require('fabric-network');
const Client = require('fabric-client');
const path = require('path');

var client = Client.loadFromConfig('../../fabric-network/connection.yaml');
var fabricCAClient;
var adminUser;

const walletPath = path.join(process.cwd(), 'dma', 'wallet');
const wallet = new FileSystemWallet(walletPath);
console.log(`Wallet path: ${walletPath}`);

adminUser = client.initCredentialStores().then((nothing) => {
    fabricCAClient = client.getCertificateAuthority();
    return client.getUserContext('admin', true);
}).then((user) => {
    if (user) {
        adminUser = user;
        console.log("Admin already exists");
        return client.setUserContext(adminUser);
    } else {
        return fabricCAClient.enroll({
            enrollmentID: 'admin',
            enrollmentSecret: 'adminpw',
            attr_reqs: [
                { name: "hf.Registrar.Roles" },
                { name: "hf.Registrar.Attributes" }
            ]
        }).then((enrollment) => {
            console.log('Successfully enrolled admin user "admin"');
            return client.createUser({
                username: 'admin',
                mspid: 'DmaMSP',
                cryptoContent: { privateKeyPEM: enrollment.key.toBytes(), signedCertPEM: enrollment.certificate }
            });
        }).then((user) => {
            adminUser = user;
            return client.setUserContext(adminUser);
        }).catch((err) => {
            console.error('Failed to enroll and persist admin. Error: ' + err.stack ? err.stack : err);
            throw new Error('Failed to enroll admin');
        });
    }
}).then(() => {
    //console.log('Assigned the admin user to the fabric client ::' + adminUser.toString());
    console.log('Assigned the admin user to the fabric client.');
    fabricCAClient.register({ affiliation: '', enrollmentID: 'user1', role: 'client', maxEnrollments: -1 }, adminUser).then((secret) => {
        // fjysObVxluPO
        console.log("Secret " + secret);
        enrollUser('user1', secret);
    }, (reason) => {
        if (reason.message.includes('"code":0')) {
            // user already registered
            console.error('User already registered.');
        } else {
            console.error('Failed to register user1: ' + reason);
        }
    })
}).catch((err) => {
    console.error('Failed to enroll admin: ' + err);
});

function enrollUser(enrollmentID, secret) {
    fabricCAClient.enroll({ enrollmentID: enrollmentID, enrollmentSecret: secret }).then((enrollment) => {
        console.log(enrollment);
        const userIdentity = X509WalletMixin.createIdentity('DmaMSP', enrollment.certificate, enrollment.key.toBytes());
        wallet.import('user1', userIdentity);
        console.log('Successfully registered and enrolled user "user1" and imported it into the wallet');
    }, (reason) => {
        console.error('Failed to enroll user: ' + reason);
    });
}
