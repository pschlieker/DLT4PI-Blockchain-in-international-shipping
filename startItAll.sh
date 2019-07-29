#!/bin/bash

# this script will initalize everything for you after you have cloned the repo under home directory
cd blockchain-shipping
./bootstrap.sh

cd ./blockchain-shipping/fabric-network
echo -ne '\n' | ./build-network.sh down

cd ./blockchain-shipping/ipfs
npm install
cd ../application/javascript/
npm install

cd ../../fabric-network
echo -ne '\n' | ./build-network.sh up -f docker-compose-e2e.yaml -q

cd ../application/javascript
./resetEnrollement.sh

node application/javascript/app.js