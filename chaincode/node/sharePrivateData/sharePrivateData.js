const shim = require('fabric-shim');

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
    async Init() {
        console.info('=========== Instantiated shipping chaincode Shared Data===========');
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

     /**
     * create initial shared private data for the Vta & Dma Organisation
     * Endorsement Policy: "OR('DmaMSP.member', 'VtaMSP.member')"
     */
    async initSharedPrivateLedge(stub, args) {
        console.info('============= START : Initialize Dma Vta Shared Private Data ===========');
        // === Create PrivateShipCertificates private data collections, save to state ===
        let SharedDenmarkAndEstoniaShipCertificates = [
            new PrivateShipCertificate('privShipCert', 'Great Dangerous Cargo Carrying Certificate', '127666', '9166778', new Date(2018, 1, 1), new Date(2020, 1, 1), ''),
            new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '223456', '9166778', new Date(2018, 3, 3), new Date(2020, 3, 3), ''),
            new PrivateShipCertificate('privShipCert', 'Very Dangerous Cargo Carrying Certificate', '323456', '9148843', new Date(2018, 1, 1), new Date(2020, 1, 1), ''),
            new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '423456', '9148843', new Date(2018, 3, 3), new Date(2020, 3, 3), ''),

        ];

        // === Save SharedDenmarkAndEstoniaShipCertificates to state ===
        try {
            for (let i = 0; i < SharedDenmarkAndEstoniaShipCertificates.length; i = i+2) {
                let imo = SharedDenmarkAndEstoniaShipCertificates[i].imo.toString();
                let certAsBytes = Buffer.from(JSON.stringify([SharedDenmarkAndEstoniaShipCertificates[i], SharedDenmarkAndEstoniaShipCertificates[i + 1]]));
                await stub.putPrivateData('SharedDenmarkAndEstoniaShipCertificates', imo, certAsBytes);
                console.info(`Added <--> ${SharedDenmarkAndEstoniaShipCertificates[i].certName} and ${SharedDenmarkAndEstoniaShipCertificates[i + 1].certName} to Ship ${SharedDenmarkAndEstoniaShipCertificates[i].imo} and ${SharedDenmarkAndEstoniaShipCertificates[i + 1].imo}`);
            }
        } catch (err) {
            throw new Error('Cannot initialize SharedShipCertificates: ' + err)
        }
        console.info('============= END : Initialize Dma Vta Shared Private Data ===========');
    }

    // ==========================================================================
    // readSharedShipCertificate - return certs in Bytes from private data collection
    //   that is shared between two orgs
    // Endorsement Policy: OR('OrgX.peer', 'OrgY.peer')
    // ==========================================================================
    async readSharedShipCertificate(stub, args) {
        // e.g. '{"Args":["readSharedShipCertificate", "Denmark", "9274848"]}'
        console.info('============= START : Reading Ship Certificates ===========');
        if (args.length !== 2) {
            throw new Error('Incorrect number of arguments. Expecting 2 argument (countryies, imo number) ex: DenmarkAndEstonia, 9274848');
        }
        let countryies = args[0];
        let imo = args[1];

        // === Get the ship certificate from chaincode state ===
        let certsAsBytes = await stub.getPrivateData(`Shared${countryies}ShipCertificates`, imo);
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
         // === convert into string ===
         console.log('===================================================')
         let certName = transientData.map.certName.value.toString("utf8"),
             certNum = transientData.map.certNum.value.toString("utf8"),
             issueDate = transientData.map.issueDate.value.toString("utf8"),
             expiryDate = transientData.map.expiryDate.value.toString("utf8"),
             certHash = transientData.map.certHash.value.toString("utf8")

        // === Set Parameters ===
        let countries = args[0];
        let imo = args[1];

        // === Create certificate ===
        let newCert = new PrivateShipCertificate('privShipCert',
            certName, 
            certNum, 
            imo,
            issueDate,
            expiryDate,
            certHash);
        console.log("Created new certificate!");

        // === Get the certificates of the ship from the state ===
        let certsAsBytes = await stub.getPrivateData(`Shared${countries}ShipCertificates`, imo);
        let certs = JSON.parse(certsAsBytes);
        console.log('List of certificates: ' + certs);
        // === Push the new certificates into the list of certificates ===
        certs.push(newCert);

        // === Save PrivateDenmarkShipCertificates to state ===
        certsAsBytes = Buffer.from(JSON.stringify(certs));
        await stub.putPrivateData(`Shared${countries}ShipCertificates`, imo, certsAsBytes);
        console.info(`Added <--> ${args[0]} to ${imo}`);
        console.info('============= END : Creating Ship Certificate ===========');
    }
};

shim.start(new Chaincode());
