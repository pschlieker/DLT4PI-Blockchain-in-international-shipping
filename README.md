# blockchain-shipping
## Requirements
* Docker-compose 1.24 (1.18 does not work!)
* MacOS Binaries

# Usage
Clone the repo  (`git clone https://bitbucket.org/fogshot/blockchain-shipping.git`)

Install Hyperledger Fabric binaries (platform dependent ) to `./bin` by running `./bootstrap.sh`

In the `./fabric-network` directory, use the following command to boot up the fabric network including CAs:

`./build-network.sh up -f docker-compose-e2e.yaml`

You can skip the execution of test queries by supplying `-q`:

`./build-network.sh up -f docker-compose-e2e.yaml -q`

Import `./application/javascript/fabric-module.js` into your frontend application to invoke
chaincode on the network. It runs on the Fabric Node SDK (requires Node v8.x).

To test queries without a frontend, run `queryTest.js`. To do that, the following commands should be used:

```
cd ipfs
npm install
cd ../application/javascript/
npm install
node queryTest.js
```
