const shim = require('fabric-shim');
const geolocation = require('geolocation-utils');
const fs = require('fs');
const rp = require('request-promise');
const ClientIdentity = shim.ClientIdentity;

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

    // ===========================================================================
    // initLedger - create 2 Marititme Authorities (Denmark and Estonia),
    //              each with 2 ships on the ledger
    // Endorsement Policy: AND('Org1.member', ... 'OrgN.member')
    // ===========================================================================
    async initLedger(stub, args) {
        console.info('============= START : Initialize Ledger General ===========');

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

        console.info('============= END : Initialize Ledger General ===========');
    }

    // ==========================================================================
    // verifyLocation - check whether the ship is within country's border by calling external api (oracle)
    // Endorsement Policy: AND('Org1.member', ..., 'OrgN.member')
    // ==========================================================================
    async verifyLocation(stub, args) {
        // Estonia ship going to Denmark
        // e.g. '{"Args":["verifyLocation", "9762687", "Denmark"]}'
        console.info('============= START : Verify Location ===========');
        if (args.length !== 2) {
            throw new Error('Incorrect number of arguments. Expecting 2 argument (imo, country)');
        }
        let imo = args[0];
        let country = args[1];

        // Get the country's borders
        let maAsBytes = await stub.getState(country);
        let borders = JSON.parse(maAsBytes).borders;
        if (!maAsBytes || maAsBytes.toString().length <= 0) {
            throw new Error(country + ' does not exist: ');
        }

        let api = `http://oracle/${imo}`;
        const result = await rp(api, { json: true }).catch((err) => {console.error(err);});
        let shipLat = Number(result.entries[0].lat);
        let shipLng = Number(result.entries[0].lng);
        console.log(`The ship is now at ${shipLat}, ${{shipLng}}`);
        if (geolocation.insidePolygon([shipLng, shipLat], borders)) {
            console.info('============= END : Verify Location (true) ===========');
            return Buffer.from('true');
        } else {
            console.info('============= END : Verify Location (false) ===========');
            return Buffer.from('false');
        }
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
        // let maForLog = JSON.parse(maAsBytes);
        // maForLog.borders = maForLog.borders.splice(3, borders.length-4);
        // console.log(maForLog.toString());
        console.info('============= END : Query Maritime Authority ===========');
        return maAsBytes;
    }

    // ==========================================================================
    // queryAllShips - returns all ships registered in the system
    // ==========================================================================
    async queryAllShips(stub, args) {
        // e.g. '{"Args":["queryAllShips"]}'
        console.info('============= START : Query All Ships ===========');
        if (args.length !== 0) {
            throw new Error('Incorrect number of arguments. Expecting 0 arguments');
        }

        const startKey = 'A';
        const endKey = 'Z';

        const iterator = await stub.getStateByRange(startKey, endKey);

        const allResults = [];
        while (true) {
            const res = await iterator.next();

            if (res.value && res.value.value.toString()) {
                let shipList = JSON.parse(res.value.value.toString('utf8')).shipList;
                shipList.forEach(function(ship){
                    allResults.push(ship);
                })
            }
            if (res.done) {
                await iterator.close();
                console.info(allResults);
                console.info('============= END : Query All Ships ===========');
                return Buffer.from(JSON.stringify(allResults));
            }
        }
    }
};

shim.start(new Chaincode());
