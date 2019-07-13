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
    getShipList() {
        return this.shipList;
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
    async accessCtrlOnlyMA(stub) {
        let cid = new ClientIdentity(stub);
        let mspid = cid.getMSPID();
        switch(mspid) {
        case 'DmaMSP':
            return true;
        case 'VtaMSP':
            return true;
        default:
            throw new Error('Wrong MSP');
        }
    }

    // ===========================================================================
    // initLedger - create 3 Marititme Authorities (Denmark, Estonia and Germany),
    //              each with 2 ships, store into chaincode state
    // ===========================================================================
    async initLedger(stub, args) {
        console.info('============= START : Initialize Ledger ===========');

        // === Create MaritimeAuthorities objects ===
        let denmarkBorders = JSON.parse(fs.readFileSync('./denmark-eez-outerbounds.json')).geometry.coordinates;
        let estoniaBorders = JSON.parse(fs.readFileSync('./denmark-eez-outerbounds.json')).geometry.coordinates;
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
        for (let i = 0; i < maritimeAuthorities.length; i++) {
            await stub.putState(maritimeAuthorities[i].country, Buffer.from(JSON.stringify(maritimeAuthorities[i])));
            console.info('Added <--> ' + maritimeAuthorities[i]);
        }

        // === Create PrivateShipCertificates private data collections, save to state ===
        let PrivateDenmarkShipCertificates = [
            new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '123456', '9166778', new Date(2018, 1, 1), new Date(2020, 1, 1), ''),
            new PrivateShipCertificate('privShipCert', 'Cargo ship safety certificate', '567890', '9166778', new Date(2019, 1, 1), new Date(2021, 1, 1)), '',
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
        for (let i = 0; i < PrivateDenmarkShipCertificates.length; i = i+2) {
            let imo = i.imo;
            let certAsBytes = Buffer.from(JSON.stringify([PrivateDenmarkShipCertificates[i], PrivateDenmarkShipCertificates[i + 1]]));
            await stub.putPrivateData('collectionDenmarkShipCertificates', imo, certAsBytes);
            console.info(`Added <--> ${i.certName} and ${(i+1).certName} to Ship ${i.imo} and ${(i+1).imo}`);
        }

        // === Save PrivateEstoniaShipCertificates to state ===
        for (let i = 0; i < PrivateEstoniaShipCertificates.length; i = i+2) {
            let imo = i.imo;
            let certAsBytes = Buffer.from(JSON.stringify([PrivateEstoniaShipCertificates[i], PrivateEstoniaShipCertificates[i + 1]]));
            await stub.putPrivateData('collectionEstoniaShipCertificates', imo, certAsBytes);
            console.info(`Added <--> ${i.certName} and ${(i+1).certName} to Ship ${i.imo} and ${(i+1).imo}`);
        }

        console.info('============= END : Initialize Ledger ===========');
    }

    // ==========================================================================
    // readPrivateShipCertificate - return certs in Bytes
    // ==========================================================================
    async readPrivateShipCertificate(stub, args) {
        // e.g. '{"Args":["readPrivateShipCertificate", "5671234"]}'
        console.info('============= START : Reading Ship Certificates ===========');
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1 argument (imo number) ex: 1234567');
        }

        let imo = args[0];

        // === Get the flag of the ship from chaincode state ===
        let ship = JSON.parse(this.queryShip(stub, [imo]).toString());
        if (!ship || ship.length <= 1) {
            throw new Error('Error occured retrieving the ship');
        }
        let country = ship.flag;

        // === Get the ship certificate from chaincode state ===
        let certs = await stub.getPrivateData(`collection${country}ShipCertificates`, imo);
        console.info('============= END : Reading Ship Certificates ===========');
        return certs;
    }

    // ==========================================================================
    // createPrivateShipCertificate - create a ship certificate to the PDC
    // ==========================================================================
    async createPrivateShipCertificate(stub, args) {
        // e.g. '{"Args":["createPrivateShipCertificate", "Cargo ship safety certificate", "567890", "9166778", "2010-01-01", "2020-12-31", "IPFS_Hash_to_Cert"]}'
        console.info('============= START : Creating Ship Certificate ===========');
        if (args.length !== 5) {
            throw new Error('Incorrect number of arguments. Expecting 5 argument (certName, certNum, imo, issueDate, expiryDate, certHash)');
        }
        // === Create the certificate ===
        let imo = args[2];
        let newCert = new PrivateShipCertificate('privShipCert', args[0], args[1], imo, args[3], args[4], args[5]);

        // === Get the flag of the ship from chaincode state ===
        let ship = JSON.parse(this.queryShip(stub, [imo]).toString());
        if (!ship || ship.length <= 1) {
            throw new Error('Error occured retrieving the ship');
        }
        let country = ship.flag;

        // === Get the certificates of the ship from the state ===
        let certsAsBytes = await stub.getPrivateData(`collection${country}ShipCertificates`, imo);
        let certs = JSON.parse(certsAsBytes);
        // === Push the new certificates into the list of certificates ===
        certs.push(newCert);

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
        if (this.accessCtrlOnlyMA(stub)) {
            if (args.length !== 7) {
                throw new Error('Incorrect number of arguments. Expecting 7');
            }

            // === Create ship object, get MA from the flag, add the newly created ship to shipList, save to state ===
            let ship = new Ship('ship', args[1], args[2], args[3], args[4], args[5], args[6], args[7]);
            // TODO: check if the ship is created with the correct country (only "Denmark", "Estonia", "Germany")
            let maAsBytes = await stub.getState(ship.country.toUpperCase());
            let ma = JSON.parse(maAsBytes);
            ma.addShips([ship]);

            await stub.putState(ma.country.toUpperCase(), Buffer.from(JSON.stringify(ma)));
            console.log(`Ship ${args[1]} created with ${ma.country}`);
        }
        console.info('============= END : Create Ship ===========');
    }

    // ==========================================================================
    // queryShip - return the queried ship by country from the state
    // ==========================================================================
    async queryShip(stub, args) {
        // e.g. '{"Args":["queryShip", "5671234"]}'
        console.info('============= START : Query Ship ===========');
        if (args.length !== 1) {
            throw new Error('Incorrect number of arguments. Expecting 1 argument (imo number) eg: 1234567');
        }

        // === Query ship object ===
        let imo = args[0];

        let shipAsBytes = await stub.getState(imo);
        if (!shipAsBytes || shipAsBytes.toString().length <= 0) {
            throw new Error(imo + ' does not exist: ');
        }
        console.log(shipAsBytes.toString());
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
        console.log(maAsBytes.toString());
        let result = JSON.parse(maAsBytes).getShipList();
        if (!result || result.toString().length <= 0) {
            throw new Error(`ShipList of ${country} does not exist.`);
        }
        console.info('============= END : Query All Ships by Country ===========');
        return result;
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
        // e.g. '{"Args":["verifyLocation", "5671234", "Denmark"]}'
        console.info('============= START : Verify Location ===========');
        if (args.length !== 2) {
            throw new Error('Incorrect number of arguments. Expecting 2 argument (imo, country)');
        }
        let imo = args[0];
        let country = args[1];

        // Get the country's borders
        let ma = await JSON.parse(this.queryMaritimeAuthority(stub, country));
        let borders = ma.borders;

        // TODO: connect to external api
        let api = `http://192.168.179.58:9001/${imo}`;
        request(api, { json: true }, (err, res, body) => {
            if (err || res.statusCode !== 200) { throw new Error(err); }
            let shipLat = body.entries[0].lat;
            let shipLng = body.entries[0].lng;
            // check if the location is within the country's maritime borders
            if (geolocation.insidePolygon([shipLat, shipLng], borders)) {
                console.info('============= Verify Location ===========');
                return true;
            } else {
                return false;
            }
        });
    }

};

shim.start(new Chaincode());
