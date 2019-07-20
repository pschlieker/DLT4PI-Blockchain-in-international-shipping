'use strict'

const fs = require('fs');
let file = Buffer.from(fs.readFileSync("../../ipfs/testfile"));

const shippingClient = require('./fabric-module');
const path = require('path');
const ccpPath = path.resolve(__dirname, '..', '..', 'fabric-network', 'connection-dma.json');


shippingClient.createShipCertificate(ccpPath, 'user1', 'mychannel', 'Denmark', 'SafetyCert', '38457671', '9166778', '08/05/2018', '08/05/2022', file);