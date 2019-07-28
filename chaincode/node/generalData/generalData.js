import MaritimeAuthority from '../common/class-module';
import Ship from '../common/class-module';
const shim = require('fabric-shim');
const geolocation = require('geolocation-utils');
const fs = require('fs');
const request = require('request');

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

    // ==========================================================================
    // createShip - create a ship to the state
    // Endorsement Policy: OR('Org1.member', ..., 'OrgN.member')
    // ==========================================================================
    async createShip(stub, args) {
        // e.g. '{"Args":["createShip", "5671234", "APPLE", "Container Ship", "Denmark", "Port of Copenhagen", "1234", "Alice"]}'
        console.info('============= START : Create Ship ===========');
        if (args.length !== 7) {
            throw new Error('Incorrect number of arguments. Expecting 7');
        }

        // === Create ship object, get MA from the flag, add the newly created ship to shipList, save to state ===
        let ship = new Ship('ship', args[0], args[1], args[2], args[3], args[4], args[5], args[6]);
        try {
            let cid = new ClientIdentity(stub);
            let invokingMSP = cid.getMSPID();   // "DmaMSP" or "VtaMSP"
            // === Ensure an organization can't create ships for other orgs ===
            if ((invokingMSP === 'DmaMSP' && args[3] === 'Denmark') || (invokingMSP === 'VtaMSP' && args[3] === 'Estonia')) {
                let maAsBytes = await stub.getState(ship.flag);
                let ma = JSON.parse(maAsBytes);
                console.log(ma.shipList);
                ma.shipList.push(ship);

                await stub.putState(ma.country, Buffer.from(JSON.stringify(ma)));
                console.log(`Ship ${args[1]} created with ${ma.country}`);
            }
        } catch (err) {
            throw new Error(err)
        }
        console.info('============= END : Create Ship ===========');
    }

    // ==========================================================================
    // queryShip - return the queried ship by imo from the state
    // Endorsement Policy: OR('Org1.member', ..., 'OrgN.member')
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
        console.log(maAsBytes.toString());
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
    // Endorsement Policy: OR('Org1.member', ..., 'OrgN.member')
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
    // Endorsement Policy: OR('Org1.member', ..., 'OrgN.member')
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
};

shim.start(new Chaincode());
