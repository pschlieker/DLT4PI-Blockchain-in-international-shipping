

const shippingClient = require('./fabric-module');
const path = require('path');
const shell = require('shelljs');
const ccpPath = path.resolve(__dirname, '..', '..', 'fabric-network', 'connection-dma.json');

async function testGeneralData() {
    console.log('########## START QUERY TESTS ##########');
    //Retrieve Ships
    console.log('########## Query all ships of Denmark ##########');
    await shippingClient.queryAllShipsByCountry(ccpPath, 'user1', 'mychannel', 'Denmark');

    console.log('########## Query all ships of Estonia ##########');
    await shippingClient.queryAllShipsByCountry(ccpPath, 'user1', 'mychannel', 'Estonia');

    console.log('########## Query ship of Denmark ##########');
    await shippingClient.queryShip(ccpPath, 'user1', 'mychannel', 'Denmark', '9166778');

    console.log('########## Query ship of Estonia ##########');
    await shippingClient.queryShip(ccpPath, 'user1', 'mychannel', 'Estonia', '9148843');

    console.log('########## Create Ship for Denmark ##########');
    await shippingClient.createShip(ccpPath, 'user1', 'mychannel', '1234567', 'GreatShip', 'Container Ship', 'Denmark', 'BlockPort', '1234', 'Blocky');

    console.log('########## Query the ship ##########');
    await shippingClient.queryShip(ccpPath, 'user1', 'mychannel', 'Denmark', '1234567');

    console.log('########## Verify Location ##########');
    await shippingClient.verifyLocation(ccpPath, 'user1', 'mychannel', 'Estonia', '9166778');

    console.log('########## END QUERY TESTS ##########');
}

async function testPrivateData() {
    console.log('########## START CREATE TESTS ##########');

    console.log('########## Query certs of Denmark ##########');
    await shippingClient.queryCert(ccpPath, 'user1', 'mychannel', '9166778');

    console.log('########## Query certs of Estonia ##########');
    await shippingClient.queryCert(ccpPath, 'user1', 'mychannel', '9148843');

    console.log('########## Request certs of Estonia ##########');
    await shippingClient.requestShipCert(ccpPath, 'user1', 'mychannel', 'Estonia', '9148843');

    console.log('########## Request certs of Estonia ##########');
    await shippingClient.requestShipCert(ccpPath, 'user1', 'mychannel', 'Estonia', '9166778');

    console.log('########## Create certificate for the ship ##########');
    await shippingClient.createShipCertificate(ccpPath, 'user1', 'mychannel', 'Denmark', 'International Oil Prevention certificate', '00000', '1234567', '2030-01-01', '2031-12-31', '0291392131231234test');

    console.log('########## Query certs of the ship ##########');
    await shippingClient.queryCert(ccpPath, 'user1', 'mychannel', '1234567');

    console.log('########## END CREATE TESTS ##########');
}

async function testSharePrivateData() {
    console.log('########## START ADD CERTIFICATE TESTS ##########');

    console.log('########## Query the ship ##########');
    await shippingClient.queryShip(ccpPath, 'user1', 'mychannel', 'Denmark', '9166778');

    console.log('########## Query certs of the ship ##########');
    await shippingClient.queryCert(ccpPath, 'user1', 'mychannel', '9166778');

    console.log('########## Create certificate for the ship ##########');
    await shippingClient.createShipCertificate(ccpPath, 'user1', 'mychannel', 'Denmark', 'NEW International Oil Prevention certificate', '00000', '9166778', '2030-01-01', '2031-12-31', 'testhash');

    console.log('########## Query certs of the ship ##########');
    await shippingClient.queryCert(ccpPath, 'user1', 'mychannel', '9166778');

    console.log('########## END ADD CERTIFICATE TESTS ##########');
}

async function testAccessCert() {
    console.log('########## START ACCESS CERTIFICATE TESTS (As Denmark) ##########');

    console.log('########## Query the ship ##########');
    console.log('########## Expected: Access OK ##########');
    await shippingClient.queryShip(ccpPath, 'user1', 'mychannel', 'Estonia', '9762687');

    console.log('########## Move Estonia ship out of Denmark borders ##########');
    await shell.exec('../../oracle/moveShip.sh out');

    console.log('########## Query certs of the ship ##########');
    console.log('########## Expected: Not able to access ##########');
    await shippingClient.querySharedCert(ccpPath, 'user1', 'mychannel', '9762687');

    console.log('########## Check the location of the ship ##########');
    console.log('########## Expected: false (Ship should be out of Denmark borders) ##########');
    await shippingClient.verifyLocation(ccpPath, 'user1', 'mychannel', 'Denmark', '9762687');

    console.log('########## Move Estonia ship into Denmark borders ##########');
    await shell.exec('../../oracle/moveShip.sh in');

    console.log('########## Share the Estonia Ship Certificate to Denmark ##########');
    console.log('########## Expected: true (Ship should be inside Denmark borders) ##########');
    await shippingClient.shareShipCertificate(ccpPath, 'user1', 'mychannel', 'Estonia', 'Denmark', '9762687');

    console.log('########## Query certs of the ship ##########');
    console.log('########## Expected: Access OK ##########');
    await shippingClient.querySharedCert(ccpPath, 'user1', 'mychannel', '9762687');

    console.log('########## Move Estonia ship out of Denmark borders ##########');
    await shell.exec('../../oracle/moveShip.sh out');
}

async function main() {
    // await testGeneralData();
    // await testPrivateData();
    // await testSharePrivateData();
    await testAccessCert();
}


main();
