#!/bin/bash

#This script is used to start up the backend

#Retrieve platform specific binaries 
./bootstrap.sh

#Shutdown previous networks
cd ./fabric-network
echo -ne '\n' | ./build-network.sh down

#Install dependencies of application layer
cd ../ipfs
npm install
cd ../application/javascript/
npm install

cd ../../fabric-network
echo -ne '\n' | ./build-network.sh up -f docker-compose-e2e.yaml -q

#Reset Enrollement of users
cd ../application/javascript
./resetEnrollement.sh

#Start REST API
node app.js