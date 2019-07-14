'use strict'

const shippingClient = require('./fabric-module');
const path = require('path');
const ccpPath = path.resolve(__dirname, '..', '..', 'fabric-network', 'connection-dma.json');

shippingClient.queryAllShipsByCountry(ccpPath, 'user1', 'mychannel', 'Denmark');
