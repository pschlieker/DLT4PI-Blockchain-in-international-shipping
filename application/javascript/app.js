'use strict'

var express = require("express");
var bodyParser = require('body-parser')
var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const ipfs = require('../../ipfs/ipfs-module');
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
 * @apiSuccess {json} {status: 'ok', data: [{ship}]}
 * @apiError {json} {status: 'error', details: err}
 *  
**/
app.get("/queryShips/:country", (req, res, next) => {
    shippingClient.queryAllShipsByCountry(ccpPath, user, channelName, req.params.country).then(function(ships){
            res.json({status: 'ok', data: JSON.parse(ships)});
    }).catch(function(err){
        console.error(`Failure: ${err}`);
        res.json({status: 'error', details: err});
    });
});

/**
 * @api {get} /queryShips Request all ships registered in the system
 * @apiName Query Ships by Country
 *
 * @apiParam {String} country name
 *
 * @apiSuccess {json} {status: 'ok', data: [{ship}]}
 * @apiError {json} {status: 'error', details: err}
 *  
**/
app.get("/queryShips", (req, res, next) => {
    shippingClient.queryAllShips(ccpPath, user, channelName).then(function(ships){
        res.json({status: 'ok', data: JSON.parse(ships)})
    }).catch(function(err){
        console.error(`Failure: ${err}`);
        res.json({status: 'error', details: err});
   });
});

/**
 * @api {get} /queryCertificates/:imo Query a list of all certificates for a specific ship
 * @apiName Query Certificates for Ship
 *
 * @apiParam {String} imo (ID of Ship)
 *
 * @apiSuccess {json} {status: 'ok', data: {[certificate]} }
 * @apiError {json} {status: 'error', details: err}
 *  
**/
app.get("/queryCertificates/:imo", (req, res, next) => {
    shippingClient.queryCert(ccpPath, user, channelName, req.params.imo).then(function(certs){
        console.log(`Certs: ${certs}`);
        res.json({status: 'ok', data: JSON.parse(certs)});  
    }).catch(function(err){
        console.error(`Failure: ${err}`);
        res.json({status: 'error', details: err});
    });
});

/**
 * @api {post} /createCertificate/:country Create new certificate
 * @apiName Create Certificate

 * @apiParam {String} Name of the country creating certificate
 * @apiParam {json} Object of certificate to be created
 * {
 *  "certName": "Dangerous Cargo Carrying Certificate",
 *  "certNum": "123456",
 *  "imo": "9166778",
 *  "issueDate": "2018-02-01T00:00:00.000Z",
 *  "expiryDate": "2020-02-01T00:00:00.000Z",
 *   }
 *
 * @apiSuccess {json} {status: 'ok'}
 * @apiError {json} {status: 'error', details: err}
 *  
**/
app.post("/createCertificate/:country", (req, res, next) => {
    let cert = req.body;
    let country = req.params.country;

    let certHash = 'missinghash';

    /**
     * TODO Handle file upload
     * certHash = await ipfs.uploadFile('mssing buffer');
     */

    shippingClient.createShipCertificate(
        ccpPath,
        user,
        channelName,
        country,
        cert.certName,
        cert.certNum,
        cert.imo,
        cert.issueDate,
        cert.expiryDate,
        certHash
    ).then(function(certs){
        console.log(`Created new certificate`);
        res.json({status: 'ok'});  
    }).catch(function(err){
        console.error(`Failure: ${err}`);
        res.json({status: 'error', details: err});
    });
});

/**
 * @api {post} /createShip Create new ship
 * @apiName Create Sthip

 * @apiParam {json} Object of ship to be created
 * {
 *       "imo": "9166778",
 *       "name": "AOTEA MAERSK",
 *       "shipType": "Container Ship",
 *       "flag": "Denmark",
 *       "homePort": "Port of Copenhagen",
 *       "tonnage": "92198",
 *       "owner": "Alice"
  *  }
 *
 * @apiSuccess {json} {status: 'ok'}
 * @apiError {json} {status: 'error', details: err}
 *  
**/
app.post("/createShip", (req, res, next) => {
    let ship = req.body;

    shippingClient.createShip(
        ccpPath,
        user,
        channelName,
        ship.imo,
        ship.name,
        ship.shipType,
        ship.flag,
        ship.homePort,
        ship.tonnage,
        ship.owner
    ).then(function(certs){
        console.log(`Created new Ship`);
        res.json({status: 'ok'});  
    }).catch(function(err){
        console.error(`Failure: ${err}`);
        res.json({status: 'error', details: err});
    });
});

/**
 * @api {get} /getCertificate/:certHash Retrieve certificate from System
 * @apiName Get Certificate
 *
 * @apiParam {String} Hash of certificate to be retrieved
 *
 * @apiSuccess {pdffile} certificate as application/pdf
 * @apiError {json} {status: 'error', details: err}
 *  
**/
app.get("/getCertificate/:certHash", (req, res, next) => {
    ipfs.retrieveFile(req.params.certHash).then(function(pdfData){
        console.log(pdfData.length);
        res.writeHead(200, {
            'Content-Type': 'application/pdf',
            'Content-Disposition': 'attachment; filename=certificate.pdf',
            'Content-Length': pdfData.length
        });
        res.end(pdfData);
    }).catch(function(err){
        console.error(`Failure: ${err}`);
        res.json({status: 'error', details: err});
    });
});
