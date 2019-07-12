# Install and instantiate the chaincode

## Required packages
`npm install geolocation-utils`
`npm install request`
`npm install fabric-shim`
A fabric network running with version 1.4

sudo docker exec -i -t peer0.veeteedeamet.ee /bin/bash
sudo docker exec -i -t peer0.dma.dk /bin/bash


## After the network is built in the fabric-network folder
- Enter the cli container
`sudo docker exec -i -t cli /bin/bash`

- Install the chaincode to every peer on the network
`CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dma.dk/users/Admin@dma.dk/msp`
`CORE_PEER_ADDRESS=peer0.dma.dk:7051`
`CORE_PEER_LOCALMSPID="DmaMSP"`
`CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dma.dk/peers/peer0.dma.dk/tls/ca.crt`
`peer chaincode install -n shipping -v 0.0.1 -l node -p /opt/gopath/src/github.com/chaincode/lib`
`CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dma.dk/users/Admin@dma.dk/msp`
`CORE_PEER_ADDRESS=peer1.dma.dk:8051`
`CORE_PEER_LOCALMSPID="DmaMSP"`
`CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dma.dk/peers/peer0.dma.dk/tls/ca.crt`
`peer chaincode install -n shipping -v 0.0.1 -l node -p /opt/gopath/src/github.com/chaincode/lib`
`CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/veeteedeamet.ee/users/Admin@veeteedeamet.ee/msp`
`CORE_PEER_LOCALMSPID="VtaMSP"`
`CORE_PEER_ADDRESS=peer0.veeteedeamet.ee:9051`
`CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/veeteedeamet.ee/peers/peer0.veeteedeamet.ee/tls/ca.crt`
`peer chaincode install -n shipping -v 0.0.1 -l node -p /opt/gopath/src/github.com/chaincode/lib`
`CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/veeteedeamet.ee/users/Admin@veeteedeamet.ee/msp`
`CORE_PEER_LOCALMSPID="VtaMSP"`
`CORE_PEER_ADDRESS=peer1.veeteedeamet.ee:10051`
`CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/veeteedeamet.ee/peers/peer0.veeteedeamet.ee/tls/ca.crt`
`peer chaincode install -n shipping -v 0.0.1 -l node -p /opt/gopath/src/github.com/chaincode/lib`

- Instantiate the installed chaincode
`CORE_CHAINCODE_DEPLOYTIMEOUT=300s`
`CORE_CHAINCODE_STARTUPTIMEOUT=300s`
`peer chaincode instantiate -o orderer.emsa.europa.eu:7050 --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/emsa.europa.eu/orderers/orderer.emsa.europa.eu/msp/tlscacerts/tlsca.emsa.europa.eu-cert.pem --channelID mychannel --collections-config /opt/gopath/src/github.com/chaincode/collections_config.json -n shipping -l node -v 0.0.1 -c '{"Args":["init"]}' -P "AND ('DmaMSP.peer','VtaMSP.peer')"`

- View the log inside peer
`docker logs [container_id]`
