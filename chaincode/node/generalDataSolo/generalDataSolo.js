import Ship from '../common/class-module';
const shim = require('fabric-shim');

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

    // ==========================================================================
    // createShip - create a ship to the state
    // Endorsement Policy: OR('Org1.member', ..., 'OrgN.member')
    // TODO how to ensure an organization can't create ships for other orgs?
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
