# blockchain-shipping
When ships arrive at the port of foreign countries, they present various certificates. This prototype allows certificates to be shared between different maritime authorities in a secure, tamperproof and privacy preserving way.
## Architecture
The prototype has 5 components:  

* Hyperledger Fabric: Blockchain
* IPFS: Storage of certificate data
* Oracle: Mock of position service
* REST-API: REST-API provided by NodeJS to connect with the backend
* Website: Frontend provided by Angular JS
### Hyperledger Fabric
The network up is build of one channel (`mychannel`), with two maritime organizations: Denmark (Dma) and Estonia (Vta). These two organizations join with two peers each.  
The channel has four installed chaincodes in total.  

* `generalData`: This chaincode contains general data, that should be accessible to all organizations. These are the registry of maritime authorities, the registry of the ships as well as the oracle to determine a ships position. For any changes all organizations involved need to agree, hence the endorsement policy used is `AND('DmaMSP.peer','VtaMSP.peer')`.
* `privateDataDma`, `privateDataVta`: The ship certificates are kept in a private data collection by each of the maritime authorities. Each of these are controlled by a separate chaincode with the endorsement policy `"AND ('DmaMSP.peer')"` and `"AND ('VtaMSP.peer')"` respectively. This is due to the fact, that the endorsement policy of a chaincode always needs to be a subset of the collection policy. Otherwise no changes could be made to the collection, because the private data needs to be read to be able to endorse any change.
* `sharePrivateData`: In order to share a certificate with another maritime authority, the data is copied into a private data collection controlled by both. The endorsement and collection policy is hence `"OR ('DmaMSP.peer','VtaMSP.peer')"`. 

### IPFS
Since the certificates are quite big PDF-files, they are stored on IPFS. In order to prevent unauthorized access, they are first encrypted and then uploaded. The key used for encryption is randomly generated and stored along with the hash of the file on the ledger.
### Oracle
The oracle in the prototype is mocked, in order to easily demonstrate what happens if a ship arrives at a port. In reality any position provider using e.g. Automatic Identification System  (AIS) could be used. The mocked API follows the structure of https://aprs.fi/page/api, hence could easily be replaced.
## Requirements
* Docker-compose 1.24 (1.18 does not work!)
* Node runtime LTS version 8.9.0 (Required by Hyperledger Fabric SDK)
* Node runtime LTS version 10 (Required by Angular)
* NVM to switch between the different node verions (optional)
* Angular CLI v8.1.2 (npm install -g @angular/cli)
## Folder Structure
* `application`:     Contains the REST-API to connect to the fabric network
* `bin`:     Plattform dependent binaries
* `chaincode`:   Chaincode to be deployed on the fabric network
* `fabric-network`:  Hyperledger Fabric Network
* `ipfs`:    Connection module for IPFS
* `oracle`:  Data used for mock oracle of ships position
* `ToopShipping`:    Angular JS project

## Usage
### General Init 
Clone the repo
```
git clone https://bitbucket.org/fogshot/blockchain-shipping.git
cd blockchain-shipping
chmod 777 ./startItAll.sh && ./startItAll.sh
```

Navigate to the git repo and install Hyperledger Fabric binaries (platform dependent)
```
./bootstrap.sh
```

Install all dependencies
```
# folder ./ipfs
npm install
#folder ./application/javascript/
npm install
```

Launch the network (Skip the execution of test queries)
```
# folder ./fabric-network
./build-network.sh up -f docker-compose-e2e.yaml -q
```
Launch the network with all test queries
`./build-network.sh up -f docker-compose-e2e.yaml`

Enroll and Register the initial network participants
```
# folder ./application/javascript
./resetEnrollement.sh
```

Pull down the network
```
# folder ./fabric-network
./build-network.sh down
```

### Run Tests
A general set of different tests without a frontend showcasing most functionality is available.

```
# folder ./application/javascript

#Query Ships
node runFabricModuleTests.js testGeneralData 

#Create & Query Private Certificates
node runFabricModuleTests.js testPrivateData 

#Query & Share Certificates
node runFabricModuleTests.js testSharePrivateData 

#Share certificate when ship arrives at port
node runFabricModuleTests.js testAccessCert 

#Create & Retrieve PDF certificate
node runFabricModuleTests.js testCreateCertificateWithPDF 
```

### Frontend
The proof-of-concept can also be run with a Webinterface.

Launch the Node JS REST-API Backend
```
# folder ./application/javascript
node app.js
```

Launch the frontend Angular framework
```
# folder ./ToopShipping
npm install
ng serve
```
The webinterface becomes available under http://localhost:4200 .The whole showcase is developed for the country Denmark. Hence this should be selected on startup.  
The automatically created certificates do not include an actual PDF. This is due to the fact, that they are instantiated as dummy date, during the startup of the system. A certificate containing a PDF can be either created by hand as upload in the interface or using the previously introduced test function `node runFabricModuleTests.js testCreateCertificateWithPDF`.   
Some Popup-Blockers might block the PDF from being opened.

#### Mock of ship position
The following call allows a ship to be moved within the territory of Denmark. 
`http://localhost:3000/moveShipMock/imo`
An example is prepared for the ship with the imo 3827367. 
1. When the system is first started, the ship (3827367 TIIU Zoo) will be displayed, but no certificates are visible.
2. The ship can be moved to Denmark by making a GET-Request on  `http://localhost:3000/moveShipMock/3827367`
3. The certificates can now be displayed


