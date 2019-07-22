'use strict'

const shippingClient = require('./fabric-module');
const path = require('path');
const ccpPath = path.resolve(__dirname, '..', '..', 'fabric-network', 'connection-dma.json');

// createShip test
// shippingClient.createShip(ccpPath, 'user1', 'mychannel', '0000000', 'Apple', 'Container Ship', 'Denmark', 'Port of Copenhagen', '4444', 'Alice');

// queryShip test
// shippingClient.queryShip(ccpPath, 'user1', 'mychannel', 'Denmark', '0000000');

// e.g. '{"Args":["createPrivateShipCertificate", "Denmark", "International Oil Prevention certificate", "901234", "9166778", "2030-01-01", "2031-12-31", "IPFS_Hash_to_Cert"]}'
shippingClient.createShipCertificate(ccpPath, 'user1', 'mychannel', 'Denmark', 'International Oil Prevention certificate', '901234', '0000000', '2030-01-01', '2031-12-31', '0x291392131231234test');