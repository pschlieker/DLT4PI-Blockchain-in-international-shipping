'use strict';

const shim = require('fabric-shim');
const ClientIdentity = shim.ClientIdentity;
const util = require('util');
const crypto = require('crypto');

class MaritimeAuthority {
    constructor(objType, name, country, domain, pubKey, privKey) {
        this.objType = objType; // "MA" - used to distinguish  various types of objects in state database
        this.name = name;
        this.country = country; // country is the key
        this.domain = domain;
        this.pubKey = pubKey;
        this.privKey = privKey;
        this.shipList = [];
    }
    getPubKey() {
        return this.pubKey;
    }
    getPrivateKey() {
        return this.privKey;
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
        this.certHash = '';
    }
    getCert() {
        if (this.certHash) {
            return this.certHash;
        } else {
            throw new Error('certHash is empty');
        }
    }
    setCert(certHash) {
        this.certHash = certHash;
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
    constructor(objType, certName, certNum, imo, issueDate, expiryDate, accessList) {
        this.objType = objType; // "privShipCert" - used to distinguish  various types of objects in state database
        this.certName = certName;
        this.certNum = certNum;
        this.imo = imo; // imo is the key
        this.issueDate = issueDate;
        this.expiryDate = expiryDate;
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
        case 'DenmarkMSP':
            return true;
        case 'EstoniaMSP':
            return true;
        // case 'GermanyMSP':
        //     return true;
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
        const denmark = crypto.createDiffieHellman(2048);
        const denmarkKey = denmark.generateKeys('base64');
        const estonia = crypto.createDiffieHellman(2048);
        const estoniaKey = estonia.generateKeys('base64');

        // === Create MaritimeAuthorities object ===
        let maritimeAuthorities = [
            new MaritimeAuthority('MA', 'Danish Maritime Authority', 'Denmark', 'dma.dk', denmarkKey.getPublicKey('base64'), denmarkKey.getPrivateKey('base64')),
            new MaritimeAuthority('MA', 'Estonian Maritime Administration', 'Estonia', 'veeteedeeamet.ee', estoniaKey.getPublicKey('base64'), estoniaKey.getPrivateKey('base64')),
            // new MaritimeAuthority('MA', 'Deutsche Flagge', 'Germany', 'deutsche-flagge.de', germanyKey.getPubKey('base64'), germany.getPrivateKey('base64'))
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
            await stub.putState(maritimeAuthorities[i].country.toUpperCase(), Buffer.from(JSON.stringify(maritimeAuthorities[i])));
            console.info('Added <--> ' + maritimeAuthorities[i]);
        }

        // === Create PrivateShipCertificates private data collections, save to state ===
        let PrivateDenmarkShipCertificates = [
            new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '123456', '9166778', new Date(2018, 1, 1), new Date(2020, 1, 1)),
            new PrivateShipCertificate('privShipCert', 'Cargo ship safety certificate', '567890', '9166778', new Date(2019, 1, 1), new Date(2021, 1, 1)),
            new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '123456', '9274848', new Date(2018, 2, 2), new Date(2020, 2, 2)),
            new PrivateShipCertificate('privShipCert', 'Cargo ship safety certificate', '567890', '9274848', new Date(2019, 2, 2), new Date(2021, 2, 2))
        ]
        let PrivateEstoniaShipCertificates = [
            new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '123456', '9148843', new Date(2018, 3, 3), new Date(2020, 3, 3)),
            new PrivateShipCertificate('privShipCert', 'Cargo ship safety certificate', '567890', '9148843', new Date(2019, 3, 3), new Date(2021, 3, 3)),
            new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '123456', '9762687', new Date(2018, 4, 4), new Date(2020, 4, 4)),
            new PrivateShipCertificate('privShipCert', 'Cargo ship safety certificate', '567890', '9762687', new Date(2019, 4, 4), new Date(2021, 4, 4))
        ]

        // === Save PrivateDenmarkShipCertificates to state ===
        for (let i = 0; i < PrivateDenmarkShipCertificates.length; i = i+2) {
            let imo = i.imo;
            let certAsBytes = Buffer.from(JSON.stringify([PrivateDenmarkShipCertificates[i], PrivateDenmarkShipCertificates[i + 1]]));
            await stub.PutPrivateData('collectionDenmarkShipCertificates', imo, certAsBytes);
            console.info(`Added <--> ${i.certName} and ${(i+1).certName} to Ship ${i.imo} and ${(i+1).imo}`);
        }

        // === Save PrivateEstoniaShipCertificates to state ===
        for (let i = 0; i < PrivateEstoniaShipCertificates.length; i = i+2) {
            let imo = i.imo;
            let certAsBytes = Buffer.from(JSON.stringify([PrivateEstoniaShipCertificates[i], PrivateEstoniaShipCertificates[i + 1]]));
            await stub.PutPrivateData('collectionEstoniaShipCertificates', imo, certAsBytes);
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
        let certs = await stub.GetPrivateData(`collection${country}ShipCertificates`, imo);
        return certs;
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
        return result;
    }

    // ==========================================================================
    // verifyLocation - verify the ship location by calling external api (oracle)
    // ==========================================================================
    async verifyLocation(stub, args) {
        // e.g. '{"Args":["verifyLocation", "5671234"]}'
    }


    // ==========================================================================
    // requestShipCert - query ship certificate by Maritime Authority
    // ==========================================================================
    async requestShipCert(stub, args) {
        // e.g. '{"Args":["queryShipCertificate", "5671234"]}'
        // 1. requesting authority execute this function
        // 2. verify location with oracle (external api dummy)
        // 3. grant access for the requesting authority to access the private certificate
    }

};


