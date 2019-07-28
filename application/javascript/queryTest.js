'use strict'

const shippingClient = require('./fabric-module');
const path = require('path');
const ccpPath = path.resolve(__dirname, '..', '..', 'fabric-network', 'connection-dma.json');

shippingClient.queryAllShipsByCountry(ccpPath, 'user1', 'mychannel', 'Denmark');


// createShip test (PASSED)
// shippingClient.createShip(ccpPath, 'user1', 'mychannel', '0000000', 'Apple', 'Container Ship', 'Denmark', 'Port of Copenhagen', '4444', 'Alice');

// queryShip test (PASSED)
// shippingClient.queryShip(ccpPath, 'user1', 'mychannel', 'Denmark', '0000000');

// queryCert test (this policy requires 1 of the 'Writers' sub-policies to be satisfied)
//shippingClient.queryCert(ccpPath, 'user1', 'mychannel', '9274848');

// createShipCertificate test (this policy requires 1 of the 'Writers' sub-policies to be satisfied)
// shippingClient.createShipCertificate(ccpPath, 'user1', 'mychannel', 'Denmark', 'International Oil Prevention certificate', '901234', '0000000', '2030-01-01', '2031-12-31', '0x291392131231234test');

// grantCertAccess test
// shippingClient.grantCertAccess(ccpPath, 'user1', 'mychannel', 'Denmark', 'Estonia');