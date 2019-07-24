#!/bin/bash

VERSION=$(cat lastversion)
docker exec cli /opt/gopath/src/github.com/hyperledger/fabric/peer/scripts/updateChaincode.sh ${VERSION}
VERSION=$((VERSION+1))
echo -n $VERSION > lastversion