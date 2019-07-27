'use strict'

var express = require("express");
var app = express();

const shippingClient = require('./fabric-module');
const path = require('path');
const ccpPath = path.resolve(__dirname, '..', '..', 'fabric-network', 'connection-dma.json');
const user = 'user1';
const channelName = 'mychannel';

app.listen(3000, () => {
 console.log("Server running on port 3000");
});



/**
 * @api {get} /queryShips/:country Request all ships registered unter the given flag
 * @apiName Query Ships by Country
 *
 * @apiParam {String} country name
 *
 * @apiSuccess {json} All ships registered under that country
 *  
**/
app.get("/queryShips/:country", (req, res, next) => {
    shippingClient.queryAllShipsByCountry(ccpPath, user, channelName, req.params.country).then(function(ships){
            res.json({status: 'ok', data: JSON.parse(ships)});
   });
});


