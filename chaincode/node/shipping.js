const shim = require('fabric-shim');
const ClientIdentity = shim.ClientIdentity;
// const util = require('util');
const geolocation = require('geolocation-utils');
const path = require('path');
const fs = require('fs');
const request = require('request');

class MaritimeAuthority {
    constructor(objType, name, country, domain, borders) {
        this.objType = objType; // "MA" - used to distinguish  various types of objects in state database
        this.name = name;
        this.country = country; // country is the key
        this.domain = domain;
        this.borders = borders;
        this.shipList = [];
    }
    addShips(shipList) {
        return Array.prototype.push.apply(this.shipList, shipList);
    }
}
class Ship {
    constructor(objType, imo, name, shipType, flag, homePort, tonnage, owner) {
        this.objType = objType; // "ship" - used to distinguish  various types of objects in state database
        this.imo = imo; // imo is the key
        this.name = name;
        this.shipType = shipType;
        this.flag = flag;
        this.homePort = homePort;
        this.tonnage = tonnage;
        this.owner = owner;
    }
}

// === All peers will have this private data in a side database ===
// In Fabric 1.4, it is not possible to define private data collection at run-time
// (i.e. could not grant access to another organization at runtime)
// Private Data Collections must be be defined statically
// Reference: https://medium.com/@spsingh559/deep-dive-into-private-data-in-hyperledger-fabric-cf23931e8f96

// In this apporach, each Maritime Authority will have its own PrivateShipCertificates PDC
// At first, they could only be accessed by themselves (defined in the "collections_config.json")
// If location consensus is reached, the chaincode function will trigger a chaincode upgrade
// to update the endorsement policy of the corresponding PrivateShipCertificates PDC
class PrivateShipCertificate {
    constructor(objType, certName, certNum, imo, issueDate, expiryDate, certHash) {
        this.objType = objType; // "privShipCert" - used to distinguish  various types of objects in state database
        this.certName = certName;
        this.certNum = certNum;
        this.imo = imo; // imo is the key
        this.issueDate = issueDate;
        this.expiryDate = expiryDate;
        this.certHash = certHash;
    }
    getCertHash() {
        if (this.certHash || this.certHash.length <= 0) {
            return this.certHash;
        } else {
            throw new Error('certHash is empty');
        }
    }
    setCertHash(certHash) {
        this.certHash = certHash;
    }
}

let Chaincode = class {

    // ===========================
    // Init initializes chaincode
    // Init method is called when chaincode "shipping" is instantiated
    // ===========================
    async Init(stub) {
        console.info('=========== Instantiated shipping chaincode ===========');
        return shim.success();
    }

    // ===========================
    // Invoke chaincode
    // ===========================
    async Invoke(stub) {
        let ret = stub.getFunctionAndParameters();
        console.info(ret);

        let method = this[ret.fcn];
        if (!method) {
            console.error('no function of name:' + ret.fcn + ' found');
            throw new Error('Received unknown function ' + ret.fcn + ' invocation');
        }
        try {
            let payload = await method(stub, ret.params);
            return shim.success(payload);
        } catch (err) {
            console.log(err);
            return shim.error(err);
        }
    }

    // === only Maritime Authority peers could access this method ===
    // async accessCtrlOnlyMA(stub) {
    //     let cid = new ClientIdentity(stub);
    //     let mspid = cid.getMSPID();
    //     switch(mspid) {
    //     case 'DmaMSP':
    //         return true;
    //     case 'VtaMSP':
    //         return true;
    //     default:
    //         throw new Error('Wrong MSP');
    //     }
    // }

    // ===========================================================================
    // initLedger - create 3 Marititme Authorities (Denmark, Estonia and Germany),
    //              each with 2 ships, store into chaincode state
    // ===========================================================================
    async initLedger(stub, args) {
        console.info('============= START : Initialize Ledger ===========');

        // === Create MaritimeAuthorities objects ===
        let denmarkBorders = JSON.parse(fs.readFileSync('./denmark-eez-outerbounds.json')).geometry.coordinates;
        let estoniaBorders = JSON.parse(fs.readFileSync('./estonia-eez-outerbounds.json')).geometry.coordinates;
        let maritimeAuthorities = [
            new MaritimeAuthority('MA', 'Danish Maritime Authority', 'Denmark', 'dma.dk', denmarkBorders),
            new MaritimeAuthority('MA', 'Estonian Maritime Administration', 'Estonia', 'veeteedeeamet.ee', estoniaBorders)
        ];
        let denmarkShips = [
            new Ship('ship', '9166778', 'AOTEA MAERSK', 'Container Ship', 'Denmark', 'Port of Copenhagen', 92198, 'Alice'),
            new Ship('ship', '9274848', 'FREESIA SEAWAYS', 'Ro-Ro Cargo Ship', 'Denmark', 'Port of Esbjerg', 37939, 'Bob')
        ];
        let estoniaShips = [
            new Ship('ship', '9148843', 'CRYSTALWATER', 'Oil Products Tanker', 'Estonia', 'Muuga Harbour', 1655, 'Charile'),
            new Ship('ship', '9762687', 'TIIU', 'Passenger/Ro-Ro Cargo Ship', 'Estonia', 'Tallinn Passenger Port', 4987, 'David')
        ];
        maritimeAuthorities[0].addShips(denmarkShips);
        maritimeAuthorities[1].addShips(estoniaShips);

        // === Save MaritimeAuthorities to state ===
        try {
            await stub.putState('Denmark', Buffer.from(JSON.stringify(maritimeAuthorities[0])));
            console.info('Added <--> Denmark MA');
            await stub.putState('Estonia', Buffer.from(JSON.stringify(maritimeAuthorities[1])));
            console.info('Added <--> Estonia MA');
        } catch (err) {
            throw new Error('Cannot initialize MaritimeAuthority: ' + err)
        }

        // === Create PrivateShipCertificates private data collections, save to state ===
        let PrivateDenmarkShipCertificates = [
            new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '123456', '9166778', new Date(2018, 1, 1), new Date(2020, 1, 1), ''),
            new PrivateShipCertificate('privShipCert', 'Cargo ship safety certificate', '567890', '9166778', new Date(2019, 1, 1), new Date(2021, 1, 1), ''),
            new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '123456', '9274848', new Date(2018, 2, 2), new Date(2020, 2, 2), ''),
            new PrivateShipCertificate('privShipCert', 'Cargo ship safety certificate', '567890', '9274848', new Date(2019, 2, 2), new Date(2021, 2, 2), '')
        ];
        let PrivateEstoniaShipCertificates = [
            new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '123456', '9148843', new Date(2018, 3, 3), new Date(2020, 3, 3), ''),
            new PrivateShipCertificate('privShipCert', 'Cargo ship safety certificate', '567890', '9148843', new Date(2019, 3, 3), new Date(2021, 3, 3), ''),
            new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '123456', '9762687', new Date(2018, 4, 4), new Date(2020, 4, 4), ''),
            new PrivateShipCertificate('privShipCert', 'Cargo ship safety certificate', '567890', '9762687', new Date(2019, 4, 4), new Date(2021, 4, 4), '')
        ];

        // === Save PrivateDenmarkShipCertificates to state ===
        try {
            for (let i = 0; i < PrivateDenmarkShipCertificates.length; i = i+2) {
                let imo = PrivateDenmarkShipCertificates[i].imo.toString();
                let certAsBytes = Buffer.from(JSON.stringify([PrivateDenmarkShipCertificates[i], PrivateDenmarkShipCertificates[i + 1]]));
                await stub.putPrivateData('collectionDenmarkShipCertificates', imo, certAsBytes);
                console.info(`Added <--> ${PrivateDenmarkShipCertificates[i].certName} and ${PrivateDenmarkShipCertificates[i + 1].certName} to Ship ${PrivateDenmarkShipCertificates[i].imo} and ${PrivateDenmarkShipCertificates[i + 1].imo}`);
            }
        } catch (err) {
            throw new Error('Cannot initialize PrivateDenmarkShipCertificates: ' + err)
        }

        // === Save PrivateEstoniaShipCertificates to state ===
        try{
            for (let i = 0; i < PrivateEstoniaShipCertificates.length; i = i+2) {
                let imo = PrivateEstoniaShipCertificates[i].imo.toString();
                let certAsBytes = Buffer.from(JSON.stringify([PrivateEstoniaShipCertificates[i], PrivateEstoniaShipCertificates[i + 1]]));
                await stub.putPrivateData('collectionEstoniaShipCertificates', imo, certAsBytes);
                console.info(`Added <--> ${PrivateEstoniaShipCertificates[i].certName} and ${PrivateEstoniaShipCertificates[i + 1].certName} to Ship ${PrivateEstoniaShipCertificates[i].imo} and ${PrivateEstoniaShipCertificates[i + 1].imo}`);
            }
        } catch (err) {
            throw new Error('Cannot initialize PrivateEstoniaShipCertificates: ' + err)
        }
        
        console.info('============= END : Initialize Ledger ===========');
    }

    // ==========================================================================
    // readPrivateShipCertificate - return certs in Bytes
    // ==========================================================================
    async readPrivateShipCertificate(stub, args) {
        // e.g. '{"Args":["readPrivateShipCertificate", "Denmark", "9274848"]}'
        console.info('============= START : Reading Ship Certificates ===========');
        if (args.length !== 2) {
            throw new Error('Incorrect number of arguments. Expecting 2 argument (country, imo number) ex: Denmark, 9274848');
        }
        let country = args[0];
        let imo = args[1];

        // === Check whether the ship exists from chaincode state ===
        let maAsBytes = await stub.getState(country);
        let ship = JSON.parse(maAsBytes).shipList.find(ship => ship.imo === imo);
        console.log(ship.toString());
        if (!ship || ship.length <= 1) {
            throw new Error('Error occured retrieving the ship');
        }

        // === Get the ship certificate from chaincode state ===
        let certsAsBytes = await stub.getPrivateData(`collection${country}ShipCertificates`, imo);
        console.info('============= END : Reading Ship Certificates ===========');
        console.log(certsAsBytes.toString())
        return certsAsBytes;
    }

    // ==========================================================================
    // createPrivateShipCertificate - create a ship certificate to the PDC
    // ==========================================================================
    async createPrivateShipCertificate(stub, args) {
        // e.g. '{"Args":["createPrivateShipCertificate", "Denmark", "International Oil Prevention certificate", "901234", "9166778", "2030-01-01", "2031-12-31", "IPFS_Hash_to_Cert"]}'
        console.info('============= START : Creating Ship Certificate ===========');
        if (args.length !== 7) {
            throw new Error('Incorrect number of arguments. Expecting 7 argument (country, certName, certNum, imo, issueDate, expiryDate, certHash)');
        }
        // === Create the certificate ===
        let country = args[0];
        let imo = args[3];
        let newCert = new PrivateShipCertificate('privShipCert', country, args[1], args[2], imo, args[4], args[5], args[6]);
        console.log(newCert.toString());

        // === Check whether the ship exists from chaincode state ===
        let maAsBytes = await stub.getState(country);
        let ship = JSON.parse(maAsBytes).shipList.find(ship => ship.imo === imo);
        console.log('Ship exists: ' + ship.toString());
        if (!ship || ship.length <= 1) {
            throw new Error('Error occured retrieving the ship');
        }

        // === Get the certificates of the ship from the state ===
        let certsAsBytes = await stub.getPrivateData(`collection${country}ShipCertificates`, imo);
        let certs = JSON.parse(certsAsBytes);
        console.log('List of certificates: ' + certs);
        // === Push the new certificates into the list of certificates ===
        certs.push(newCert);

        // === Save PrivateDenmarkShipCertificates to state ===
        certsAsBytes = Buffer.from(JSON.stringify(certs));
        await stub.putPrivateData(`collection${country}ShipCertificates`, imo, certsAsBytes);
        console.info(`Added <--> ${args[0]} to ${imo}`);
        console.info('============= END : Creating Ship Certificate ===========');
    }

    async createPrivateShipCertificateTransient(stub, args) {
        console.info('============= START : Creating Ship Certificate using Transient Data ===========');
        if (args.length !== 2) {
              throw new Error('Incorrect number of arguments. Expecting 2 argument (country, imo).'+
                'The transient data contains the certificate as JSON '+
                '{"certName":"International Oil Prevention certificate", "certNum": "00000", "imo": "1234567", "issueDate":"2030-01-01", "expiryDate":"2031-12-31", "certHash":"0291392131231234test"}');
        }

        // === Retrieve Transient Data ===
        console.log('Getting Transient Data');
        let transientData = stub.getTransient();
        // === convert into string ===
        console.log('===================================================')
        let certName = transientData.map.certName.value.toString("utf8"),
            certNum = transientData.map.certNum.value.toString("utf8"),
            issueDate = transientData.map.issueDate.value.toString("utf8"),
            expiryDate = transientData.map.expiryDate.value.toString("utf8"),
            certHash = transientData.map.certHash.value.toString("utf8")

        console.log(certName);

        // === Set Parameters ===
        let country = args[0];
        let imo = args[1];
        console.log(country, imo);

        // === Create certificate ===
        let newCert = new PrivateShipCertificate('privShipCert', 
            certName, 
            certNum, 
            imo,
            issueDate,
            expiryDate,
            certHash);
        console.log("Created new certificate!");

        // === Check whether the ship exists from chaincode state ===
        let maAsBytes = await stub.getState(country);
        let ship = JSON.parse(maAsBytes).shipList.find(ship => ship.imo === imo);
        console.log('Ship exists: ' + ship.toString());
        if (!ship || ship.length <= 1) {
            throw new Error('Error occured retrieving the ship');
        }

        // === Get the certificates of the ship from the state ===
        let certs;
        let certsAsBytes = await stub.getPrivateData(`collection${country}ShipCertificates`, imo);
        // === check if the ship already contains one or more certificates ===
        // if yes, append new certificate
        // if no, just add the new certificate
        try {
            certs = JSON.parse(certsAsBytes);
            // === Push the new certificates into the list of certificates ===
            certs.push(newCert);
        } catch (SyntaxError) {
            certs = newCert;
        }
        console.log('List of certificates: ' + certs);
        // === Save PrivateDenmarkShipCertificates to state ===
        certsAsBytes = Buffer.from(JSON.stringify(certs));
        await stub.putPrivateData(`collection${country}ShipCertificates`, imo, certsAsBytes);
        console.info(`Added <--> ${args[0]} to ${imo}`);
        console.info('============= END : Creating Ship Certificate ===========');
    }

    // ==========================================================================
    // createShip - create a ship to the state
    // ==========================================================================
    async createShip(stub, args) {
        // e.g. '{"Args":["createShip", "5671234", "APPLE", "Container Ship", "Denmark", "Port of Copenhagen", "1234", "Alice"]}'
        console.info('============= START : Create Ship ===========');
        if (args.length !== 7) {
            throw new Error('Incorrect number of arguments. Expecting 7');
        }

        // === Create ship object, get MA from the flag, add the newly created ship to shipList, save to state ===
        let ship = new Ship('ship', args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        // TODO: check if the ship is created with the correct country (only "Denmark", "Estonia", "Germany")
        let maAsBytes = await stub.getState(ship.flag);
        let ma = JSON.parse(maAsBytes);
        console.log(ma.shipList);
        ma.shipList.push(ship);

        await stub.putState(ma.country, Buffer.from(JSON.stringify(ma)));
        console.log(`Ship ${args[1]} created with ${ma.country}`);
        
        console.info('============= END : Create Ship ===========');
    }

    // ==========================================================================
    // queryShip - return the queried ship by imo from the state
    // ==========================================================================
    async queryShip(stub, args) {
        // e.g. '{"Args":["queryShip", "Denmark", "9166778"]}'
        console.info('============= START : Query Ship ===========');
        if (args.length !== 2) {
            throw new Error('Incorrect number of arguments. Expecting 2 argument (country, imo number) eg: Denmark, 9166778');
        }

        // === Get MA from the state ===
        let country = args[0];
        let imo = args[1];

        let maAsBytes = await stub.getState(country);
        let ship = JSON.parse(maAsBytes).shipList.find(ship => ship.imo === imo);
        if (!maAsBytes || maAsBytes.toString().length <= 0) {
            throw new Error(country + ' does not exist: ');
        }
        console.log(ship.toString());
        let shipAsBytes = Buffer.from(JSON.stringify(ship));
        console.info('============= END : Query Ship ===========');
        return shipAsBytes;
    }

    // ==========================================================================
    // queryAllShipsByCountry - return an array of ships on the blockchain
    // ==========================================================================
    async queryAllShipsByCountry(stub, args) {
        // e.g. '{"Args":["queryAllShipsByCountry", "Denmark"]}'
        console.info('============= START : Query All Ships by Country ===========');
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1 argument (country) eg: Denmark');
        }
        let country = args[0].charAt(0).toUpperCase() + args[0].slice(1);
        let maAsBytes = await stub.getState(country);
        if (!maAsBytes || maAsBytes.toString().length <= 0) {
            throw new Error(country + ' does not exist.');
        }
        console.log('Successful getting maAsBytes');
        let result = JSON.parse(maAsBytes).shipList;
        console.log('shiplist: ' + result);
        if (!result || result.toString().length <= 0) {
            throw new Error(`ShipList of ${country} does not exist.`);
        }
        let resultAsBytes = Buffer.from(JSON.stringify(result));
        console.info('============= END : Query All Ships by Country ===========');
        return resultAsBytes;
    }

    // ==========================================================================
    // queryMaritimeAuthority - return the queried Maritime Authority from the state
    // ==========================================================================
    async queryMaritimeAuthority(stub, args) {
        // e.g. '{"Args":["queryMaritimeAuthority", "Denmark"]}'
        console.info('============= START : Query Maritime Authority ===========');
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1 argument (country) eg: Denmark');
        }

        // === Query MaritimeAuthority object ===
        let country = args[0];

        let maAsBytes = await stub.getState(country);
        if (!maAsBytes || maAsBytes.toString().length <= 0) {
            throw new Error(country + ' does not exist: ');
        }
        console.log(maAsBytes.toString());
        console.info('============= END : Query Maritime Authority ===========');
        return maAsBytes;
    }


    // ==========================================================================
    // verifyLocation - check whether the ship is within country's border by calling external api (oracle)
    // ==========================================================================
    async verifyLocation(stub, args) {
        // e.g. '{"Args":["verifyLocation", "9166778", "Estonia"]}'
        console.info('============= START : Verify Location ===========');
        if (args.length !== 2) {
            throw new Error('Incorrect number of arguments. Expecting 2 argument (imo, country)');
        }
        let imo = args[0];
        let country = args[1];

        // Get the country's borders
        
        let maAsBytes = await stub.getState(country);
        if (!maAsBytes || maAsBytes.toString().length <= 0) {
            throw new Error(country + ' does not exist: ');
        }
        let borders = JSON.parse(maAsBytes).borders;
        console.log(country + ' borders: ');
        console.log(borders);

        // TODO: connect to external api
        let api = `http://oracle/${imo}`;
        console.log('Ship IMO: ' + api);
        request(api, (err, res, body) => {
            if (err || res.statusCode !== 200) { throw new Error(err); }
            let msgBody = JSON.parse(body);
            let resultAsBytes;
            let shipLat = parseFloat(msgBody['entries'][0].lat);
            let shipLng = parseFloat(msgBody['entries'][0].lng);
            console.info(shipLat + ' ' + shipLng);
            // check if the location is within the country's maritime borders
            let check = geolocation.insidePolygon([shipLat, shipLng], borders);
            console.log(check)
            if (check) {
                console.info('============= END : Verify Location ===========');
                resultAsBytes = Buffer.from('true');
            } else {
                resultAsBytes = Buffer.from('false');
            }
            return resultAsBytes;
        });
    }

};

shim.start(new Chaincode());
