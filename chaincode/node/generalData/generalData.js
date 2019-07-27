const shim = require('fabric-shim');
// const util = require('util');
const geolocation = require('geolocation-utils');
const fs = require('fs');
const request = require('request');

class MaritimeAuthority {
    constructor(objType, name, country, domain, borders) {
        // this.objType = objType; // "MA" - used to distinguish  various types of objects in state database
        this.name = name;
        this.country = country; // country is the key
        // this.domain = domain;
        this.borders = borders;
        this.shipList = [];
    }
    addShips(shipList) {
        return Array.prototype.push.apply(this.shipList, shipList);
    }
}
class Ship {
    constructor(objType, imo, name, shipType, flag, homePort, tonnage, owner) {
        // this.objType = objType; // "ship" - used to distinguish  various types of objects in state database
        this.imo = imo; // imo is the key
        this.name = name;
        // this.shipType = shipType;
        this.flag = flag;
        // this.homePort = homePort;
        // this.tonnage = tonnage;
        // this.owner = owner;
    }
}

let Chaincode = class {

    // ===========================
    // Init initializes chaincode
    // Init method is called when chaincode "shipping" is instantiated
    // ===========================
    async Init() {
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

    // ===========================================================================
    // initLedger - create 2 Marititme Authorities (Denmark and Estonia),
    //              each with 2 ships on the ledger
    // Endorsement Policy: AND('Org1.member', ... 'OrgN.member')
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
        try {
            await stub.putState('Denmark', Buffer.from(JSON.stringify(maritimeAuthorities[0])));
            console.info('Added <--> Denmark MA');
            await stub.putState('Estonia', Buffer.from(JSON.stringify(maritimeAuthorities[1])));
            console.info('Added <--> Estonia MA');
        } catch (err) {
            throw new Error('Cannot initialize MaritimeAuthority: ' + err)
        }

        console.info('============= END : Initialize Ledger ===========');
    }


    // ==========================================================================
    // verifyLocation - check whether the ship is within country's border by calling external api (oracle)
    // Endorsement Policy: AND('Org1.member', ..., 'OrgN.member')
    // ==========================================================================
    async verifyLocation(stub, args) {
        // e.g. '{"Args":["verifyLocation", "9166778", "Denmark"]}'
        console.info('============= START : Verify Location ===========');
        if (args.length !== 2) {
            throw new Error('Incorrect number of arguments. Expecting 2 argument (imo, country)');
        }
        let imo = args[0];
        let country = args[1];

        // Get the country's borders

        let maAsBytes = await stub.getState(country);
        console.log(maAsBytes.toString());
        let borders = JSON.parse(maAsBytes).borders;
        if (!maAsBytes || maAsBytes.toString().length <= 0) {
            throw new Error(country + ' does not exist: ');
        }

        // TODO: connect to external api
        let api = `http://oracle/${imo}`;
        request(api, { json: true }, (err, res, body) => {
            if (err || res.statusCode !== 200) { throw new Error(err); }
            let shipLat = body.entries[0].lat;
            let shipLng = body.entries[0].lng;
            // check if the location is within the country's maritime borders
            if (geolocation.insidePolygon([shipLat, shipLng], borders)) {
                console.info('============= END : Verify Location ===========');
                return shim.success(Buffer.from('true'));
            } else {
                return shim.success(Buffer.from('false'));
            }
        });
    }
};

shim.start(new Chaincode());
