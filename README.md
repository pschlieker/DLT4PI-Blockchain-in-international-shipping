# blockchain-shipping
## Requirements
* Docker-compose 1.24 (1.18 does not work!)
* MacOS Binaries

# Usage
Use the following command to boot up a fabric network including CAs:

`./build-network.sh up -f docker-compose-e2e.yaml`

# Steps to run demo
1. `git clone https://bitbucket.org/fogshot/blockchain-shipping.git`
2. `./fabric-network/build-network.sh down`
3. `./fabric-network/build-network.sh generate`
4. `./fabric-network/build-network.sh up`
5. Fabric network is up and running