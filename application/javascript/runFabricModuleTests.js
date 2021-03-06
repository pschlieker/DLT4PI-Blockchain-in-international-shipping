

const shippingClient = require('./fabric-module');
const path = require('path');
const shell = require('shelljs');
const fs = require('fs');
const ipfs = require('../../ipfs/ipfs-module');

const ccpPathDenmark = path.resolve(__dirname, '..', '..', 'fabric-network', 'connection-dma.json');
const ccpPathEstonia = path.resolve(__dirname, '..', '..', 'fabric-network', 'connection-vta.json');


async function testGeneralData() {
    console.log('########## START GENERAL DATA TESTS ##########');
    //Retrieve Ships
    console.log('########## Query all ships of Denmark ##########');
    await shippingClient.queryAllShipsByCountry(ccpPathDenmark, 'user1', 'mychannel', 'dma', 'Denmark');

    console.log('########## Query all ships of Estonia ##########');
    await shippingClient.queryAllShipsByCountry(ccpPathDenmark, 'user1', 'mychannel', 'dma', 'Estonia');

    console.log('########## Query ship of Denmark ##########');
    await shippingClient.queryShip(ccpPathDenmark, 'user1', 'mychannel', 'dma', 'Denmark', '9166778');

    console.log('########## Query ship of Estonia ##########');
    await shippingClient.queryShip(ccpPathDenmark, 'user1', 'mychannel', 'dma', 'Estonia', '9148843');

    console.log('########## Create Ship for Denmark ##########');
    await shippingClient.createShip(ccpPathDenmark, 'user1', 'mychannel', 'dma', '1234567', 'GreatShip', 'Container Ship', 'Denmark', 'BlockPort', '1234', 'Blocky');

    console.log('########## Query the ship ##########');
    await shippingClient.queryShip(ccpPathDenmark, 'user1', 'mychannel', 'dma', 'Denmark', '1234567');

    console.log('########## END GENERAL DATA TESTS ##########');
}

async function testPrivateData() {
    console.log('########## START PRIVATE DATA TESTS ##########');

    console.log('########## Query Denmark ship certificates as Denmark ##########');
    console.log('########## Expected: Access OK (inside private PDC) ##########');
    await shippingClient.queryCert(ccpPathDenmark, 'user1', 'mychannel', 'dma', 'Denmark', '9166778');

    console.log('########## Query Estonia ship certificates as Estonia ##########');
    console.log('########## Expected: Access OK (inside private PDC) ##########');
    await shippingClient.queryCert(ccpPathEstonia, 'user2', 'mychannel', 'vta', 'Estonia', '9148843');

    console.log('########## Create private certificate for the ship as Denmark ##########');
    console.log('########## Name of certificate BRAND NEW International Oil Prevention certificate ##########');
    console.log('########## Expected: Access OK (inside private PDC) ##########');
    await shippingClient.createPrivateShipCertificate(ccpPathDenmark, 'user1', 'mychannel', 'dma', 'Denmark', 'BRAND NEW International Oil Prevention certificate', '00000', '9166778', '2030-01-01', '2031-12-31', 'testhash');

    console.log('########## Query Denmark ship certificates as Denmark ##########');
    console.log('########## Expected: Access OK (inside private PDC) ##########');
    await shippingClient.queryCert(ccpPathDenmark, 'user1', 'mychannel', 'dma', 'Denmark', '9166778');

    console.log('########## END PRIVATE DATA TESTS ##########');
}

async function testSharePrivateData() {
    console.log('########## START SHARED DATA TESTS ##########');

    console.log('########## Query Estonia ship certificates as Denmark ##########');
    console.log('########## Expected: Access OK (inside shared PDC) ##########');
    await shippingClient.queryCert(ccpPathDenmark, 'user1', 'mychannel', 'dma', 'Estonia', '9148843');

    console.log('########## Query Denmark ship certificates as Estonia ##########');
    console.log('########## Expected: Access OK (inside shared PDC) ##########');
    await shippingClient.queryCert(ccpPathEstonia, 'user2', 'mychannel', 'vta', 'Denmark', '9166778');

    console.log('########## Create shared certificate for the ship by Denmark ##########');
    await shippingClient.createSharedShipCertificate(ccpPathDenmark, 'user1', 'mychannel', 'dma', 'Denmark', 'Danish International Oil Prevention certificate', '00000', '9166778', '2030-01-01', '2031-12-31', 'testhash');

    console.log('########## Query Denmark ship certificates as Estonia ##########');
    console.log('########## Expected: Access OK (inside shared PDC) ##########');
    await shippingClient.queryCert(ccpPathEstonia, 'user2', 'mychannel', 'vta', 'Denmark', '9166778');

    console.log('########## END SHARED DATA TESTS ##########');
}

async function testAccessCert() {
    console.log('########## START ACCESS CERTIFICATE TESTS (As Denmark) ##########');

    console.log('########## Query Estonia ship As Denmark ##########');
    console.log('########## Expected: Access OK ##########');
    await shippingClient.queryShip(ccpPathDenmark, 'user1', 'mychannel', 'dma', 'Estonia', '9762687');

    console.log('########## Move Estonia ship out of Denmark borders ##########');
    await shell.exec('./moveShip.sh out');

    console.log('########## Query Estonia ship certificates as Denmark ##########');
    console.log('########## Expected: Not able to access (outside shared PDC) ##########');
    await shippingClient.querySharedCert(ccpPathDenmark, 'user1', 'mychannel', 'dma', '9762687');

    console.log('########## Check the location of the ship ##########');
    console.log('########## Expected: false (Ship should be out of Denmark borders) ##########');
    await shippingClient.verifyLocation(ccpPathDenmark, 'user1', 'mychannel', 'dma', 'Denmark', '9762687');

    console.log('########## Move Estonia ship into Denmark borders ##########');
    await shell.exec('./moveShip.sh in');

    console.log('########## Share the Estonia Ship Certificate to Denmark as Estonia ##########');
    console.log('########## Expected: true (Ship should be inside Denmark borders) ##########');
    await shippingClient.shareShipCertificate(ccpPathEstonia, 'user2', 'mychannel', 'vta', 'Estonia', 'Denmark', '9762687');

    console.log('########## Query Estonia ship certificates as Denmark ##########');
    console.log('########## Expected: Access OK ##########');
    await shippingClient.querySharedCert(ccpPathDenmark, 'user1', 'mychannel', 'dma', '9762687');

    console.log('########## Move Estonia ship out of Denmark borders ##########');
    await shell.exec('./moveShip.sh out');
}

async function testCreateCertificateWithPDF(){
    console.log('########## START Create Certificate with PDF (As Denmark) ##########');
    console.log('########## Create Ship for Denmark ##########');
    await shippingClient.createShip(ccpPathDenmark, 'user1', 'mychannel', 'dma', '38472334', 'PDF Ship', 'Container Ship', 'Denmark', 'BlockPort', '1234', 'Blocky');
    
    console.log('########## Create PDF Certificate ##########');
    // Creating buffer for ipfs function to add file to the system
    let fileBuffer = Buffer.from(fs.readFileSync("./IMO_Declaration_Form.pdf"));
    let certHash = await ipfs.uploadFile(fileBuffer);
    console.log('PDF file uploaded with hash: : ' + certHash);
    await shippingClient.createPrivateShipCertificate(
        ccpPathDenmark,
        'user1',
        'mychannel',
        'dma',
        'Denmark',
        'PDF Declaration Form',
        '38273',
        '38472334',
        '29-07-2019',
        '29-07-2015',
        certHash
    );

    console.log('########## Query Created Certificate ##########');
    let certFromLedger = await shippingClient.queryCert(ccpPathDenmark, 'user1', 'mychannel', 'dma', 'Denmark', '38472334');
    let certFromLedgerJSON = JSON.parse(certFromLedger);

    console.log('########## Retrieve created certificate from IPFS ##########');
    let buffer = await ipfs.retrieveFile(certFromLedgerJSON[0].certHash);
    console.log('Retrieved file of size '+buffer.length);
}

async function main() {
    let functionToCall = process.argv[2];

    switch(functionToCall) {
    case 'testGeneralData':
        await testGeneralData();
        break;
    case 'testPrivateData':
        await testPrivateData();
        break;
    case 'testSharePrivateData':
        await testSharePrivateData();
        break;
    case 'testAccessCert':
        await testAccessCert();
        break;
    case 'testCreateCertificateWithPDF':
        await testCreateCertificateWithPDF();
        break;
    default:
        await testGeneralData();
        await testPrivateData();
        await testSharePrivateData();
        await testAccessCert();
        await testCreateCertificateWithPDF();
    }
}

main();