# blockchain-shipping
When ships arrive at the port of foreign countries, they present various certificates. This prototype allows certificates to be shared between different maritime authorities in a secure, tamperproof and privacy preserving way.
## Requirements
* Docker-compose 1.24 (1.18 does not work!)
* Node runtime LTS version 8.9.0 (Required by Hyperledger Fabric SDK)
* Node runtime LTS version 10 (Required by Angular)
* NVM to switch between the different node verions (optional)
* Angular CLI v8.1.2 (npm install -g @angular/cli)
## Folder Structure
* `application` Contains the REST-API to connect to the fabric network
* `bin` Plattform dependent binaries
* `chaincode` Chaincode to be deployed on the fabric network
* `fabric-network` Hyperledger Fabric Network
* `ipfs` Connection module for IPFS
* `oracle` Data used for mock oracle of ships position
* `ToopShipping`
## Usage
### General Init 
Clone the repo
```
git clone https://bitbucket.org/fogshot/blockchain-shipping.git
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
node runFabricModuleTests.js testGeneralData
node runFabricModuleTests.js testPrivateData
node runFabricModuleTests.js testSharePrivateData
node runFabricModuleTests.js testAccessCert
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

#### Mock of ship position
The following call allows a ship to be moved within the territory of Denmark. 
`http://localhost:3000/moveShipMock/imo`
An example is prepared for the ship with the imo 3827367. 
1. When the system is first started, the ship will be displayed, but no certificates are visible.
2. The ship can be moved to Denmark by making a GET-Request on  `http://localhost:3000/moveShipMock/3827367`
3. The certificates can now be displayed


