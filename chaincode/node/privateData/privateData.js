const shim = require('fabric-shim');

// === All peers will have this private data in a side database ===
// In Fabric 1.4, it is not possible to define private data collection at run-time
// (i.e. could not grant access to another organization at runtime)
// Private Data Collections must be be defined statically
// Reference: https://medium.com/@spsingh559/deep-dive-into-private-data-in-hyperledger-fabric-cf23931e8f96

// In this apporach, each Maritime Authority will have its own PrivateShipCertificates PDC
// that only they can access. Here they will store their certificates.
// When another MA requests certificates for a ship, they can first verify the location of the ship using
// the location oracle and then create a copy of the requested certificates in another PDC shared by the
// two MAs.

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
        console.info('=========== Instantiated shipping chaincode Private Data ===========');
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
     * create initial private data for the Dma Organisation
     * Endorsement Policy: AND('DmaMSP.peer')
     */
    async initPrivateDataForDma(stub, args) {
        console.info('============= START : Initialize Dma Private Data Here asdf===========');
        // === Create PrivateShipCertificates private data collections, save to state ===
        let PrivateDenmarkShipCertificates = [
            new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '123456', '9166778', new Date(2018, 1, 1), new Date(2020, 1, 1), ''),
            new PrivateShipCertificate('privShipCert', 'Cargo ship safety certificate', '567890', '9166778', new Date(2019, 1, 1), new Date(2021, 1, 1), ''),
            new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '123456', '9274848', new Date(2018, 2, 2), new Date(2020, 2, 2), ''),
            new PrivateShipCertificate('privShipCert', 'Cargo ship safety certificate', '567890', '9274848', new Date(2019, 2, 2), new Date(2021, 2, 2), '')
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
        console.info('============= END : Initialize Dma Private Data ===========');
    }
  
      /**
       * create initial private data for the Vta Organisation
       * Endorsement Policy: AND('VtaMSP.peer')
       */
      async initPrivateDataForVta(stub, args) {
        console.info('============= START : Initialize Vta Private Data ===========');
          let PrivateEstoniaShipCertificates = [
              new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '123456', '9148843', new Date(2018, 3, 3), new Date(2020, 3, 3), ''),
              new PrivateShipCertificate('privShipCert', 'Cargo ship safety certificate', '567890', '9148843', new Date(2019, 3, 3), new Date(2021, 3, 3), ''),
              new PrivateShipCertificate('privShipCert', 'Dangerous Cargo Carrying Certificate', '123456', '9762687', new Date(2018, 4, 4), new Date(2020, 4, 4), ''),
              new PrivateShipCertificate('privShipCert', 'Cargo ship safety certificate', '567890', '9762687', new Date(2019, 4, 4), new Date(2021, 4, 4), '')
          ];
  
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
          console.info('============= END : Initialize Vta Private Data ===========');
      }
  
      // ==========================================================================
      // readPrivateShipCertificate - return certs in Bytes
      // Endorsement Policy: AND('OrgX.peer')
      // ==========================================================================
      async readPrivateShipCertificate(stub, args) {
          // e.g. '{"Args":["readPrivateShipCertificate", "Denmark", "9274848"]}'
          console.info('============= START : Reading Ship Certificates ===========');
          if (args.length !== 2) {
              throw new Error('Incorrect number of arguments. Expecting 2 argument (country, imo number) ex: Denmark, 9274848');
          }
          let country = args[0];
          let imo = args[1];
  
          // === Get the ship certificate from chaincode state ===
          let certsAsBytes = await stub.getPrivateData(`collection${country}ShipCertificates`, imo);
          console.info('============= END : Reading Ship Certificates ===========');
          return certsAsBytes;
      }
  
      // ==========================================================================
      // createPrivateShipCertificate - create a ship certificate to the PDC
      // Endorsement Policy: AND('OrgX.peer')
      // ==========================================================================
      async createPrivateShipCertificate(stub, args) {
          console.info('============= START : Creating Ship Certificate using Transient Data ===========');
          if (args.length !== 2) {
                throw new Error('Incorrect number of arguments. Expecting 1 argument (country, imo).'+
                  'The transient data contains the certificate as JSON '+
                  '{"certName":"NEW International Oil Prevention certificate", "certNum": "901234", "imo": "9166778", "issueDate":"2030-01-01", "expiryDate":"2031-12-31", "certHash":"IPFS_Hash_to_Cert"}');
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
  
          // === Set Parameters ===
          let country = args[0];
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
