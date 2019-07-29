# blockchain-shipping
## Requirements
* Docker-compose 1.24 (1.18 does not work!)
* Node runtime LTS version 8.9.0 (Required by Hyperledger Fabric SDK)
* Angular CLI v8.1.2 (npm install -g @angular/cli)

# Usage
Clone the repo under home directory
```
cd ~
git clone https://bitbucket.org/fogshot/blockchain-shipping.git
```

Navigate to the git repo and install Hyperledger Fabric binaries (platform dependent)
```
cd blockchain-shipping
./bootstrap.sh
```

Install all dependencies
```
cd ~/blockchain-shipping/ipfs
npm install
cd ../application/javascript/
npm install
```

Launch the network (Skip the execution of test queries)
```
cd ~/blockchain-shipping/fabric-network
./build-network.sh up -f docker-compose-e2e.yaml -q
```
Launch the network with all test queries
`./build-network.sh up -f docker-compose-e2e.yaml`

Enroll and Register the initial network participants
```
cd ~/blockchain-shipping/application/javascript
./resetEnrollement.sh
```

Pull down the network
```
cd ~/blockchain-shipping/fabric-network
./build-network.sh down
```

Launch the frontend Angular framework
```
cd ~/blockchain-shipping/ToopShipping
npm install
ng serve
```


Import `./application/javascript/fabric-module.js` into your frontend application to invoke
chaincode on the network. It runs on the Fabric Node SDK (requires Node v8.x).

To test queries without a frontend, run `runFabricModuleTests.js`. To do that, the following commands should be used:
`node runFabricModuleTests.js`