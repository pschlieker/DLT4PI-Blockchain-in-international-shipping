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
        // this.objType = objType; // "privShipCert" - used to distinguish  various types of objects in state database
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

    // ==========================================================================
    // readSharedShipCertificate - return certs in Bytes from private data collection
    //   that is shared between two orgs
    // Endorsement Policy: OR('OrgX.peer', 'OrgY.peer')
    // ==========================================================================
    async readSharedShipCertificate(stub, args) {
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
        return certsAsBytes;
    }

    // ==========================================================================
    // sharePrivateShipCertificate - put a ship certificate into the shared PDC
    // Endorsement Policy: OR('OrgX.peer', 'OrgY.peer')
    // ==========================================================================
    async sharePrivateShipCertificate(stub, args) {
        console.info('============= START : Creating Ship Certificate using Transient Data ===========');
        if (args.length !== 2) {
              throw new Error('Incorrect number of arguments. Expecting 1 argument (country, imo).'+
                'The transient data contains the certificate as JSON '+
                '{"certName":"NEW International Oil Prevention certificate", "certNum": "901234", "imo": "9166778", "issueDate":"2030-01-01", "expiryDate":"2031-12-31", "certHash":"IPFS_Hash_to_Cert"}');
        }

        // === Retrieve Transient Data ===
        let transientData = stub.getTransient();
        console.log(transientData);
        // convert into buffer
        const buffer = new Buffer(transientData.map.certificate.value.toArrayBuffer());
        // from buffer into JSON
        console.log(buffer.toString());
        const certificate = JSON.parse(transientData);
        console.log(certificateJSON);

        // === Set Parameters ===
        let country = args[0];
        let imo = args[1];

        // === Create certificate ===
        let newCert = new PrivateShipCertificate('privShipCert',
            certificateJSON.certName,
            certificateJSON.certNum,
            certificateJSON.imo,
            certificateJSON.issueDate,
            certificateJSON.expiryDate,
            certificateJSON.certHash);
        console.log("Created new certificate!");

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
};

shim.start(new Chaincode());
