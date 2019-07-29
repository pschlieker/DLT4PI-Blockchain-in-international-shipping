#!/bin/bash

VERSION=$1

CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dma.dk/users/Admin@dma.dk/msp
CORE_PEER_ADDRESS=peer0.dma.dk:7051
CORE_PEER_LOCALMSPID="DmaMSP"
CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dma.dk/peers/peer0.dma.dk/tls/ca.crt
peer chaincode install -n mycc -v ${VERSION} -l node -p /opt/gopath/src/github.com/chaincode/node
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dma.dk/users/Admin@dma.dk/msp
CORE_PEER_ADDRESS=peer1.dma.dk:8051
CORE_PEER_LOCALMSPID="DmaMSP"
CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dma.dk/peers/peer0.dma.dk/tls/ca.crt
peer chaincode install -n mycc -v ${VERSION} -l node -p /opt/gopath/src/github.com/chaincode/node
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/veeteedeamet.ee/users/Admin@veeteedeamet.ee/msp
CORE_PEER_LOCALMSPID="VtaMSP"
CORE_PEER_ADDRESS=peer0.veeteedeamet.ee:9051
CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/veeteedeamet.ee/peers/peer0.veeteedeamet.ee/tls/ca.crt
peer chaincode install -n mycc -v ${VERSION} -l node -p /opt/gopath/src/github.com/chaincode/node
CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/veeteedeamet.ee/users/Admin@veeteedeamet.ee/msp
CORE_PEER_LOCALMSPID="VtaMSP"
CORE_PEER_ADDRESS=peer1.veeteedeamet.ee:10051
CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/veeteedeamet.ee/peers/peer0.veeteedeamet.ee/tls/ca.crt
peer chaincode install -n mycc -v ${VERSION} -l node -p /opt/gopath/src/github.com/chaincode/node

#peer chaincode instantiate -o orderer.emsa.europa.eu:7050 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/emsa.europa.eu/orderers/orderer.emsa.europa.eu/msp/tlscacerts/tlsca.emsa.europa.eu-cert.pem --channelID mychannel --collections-config /opt/gopath/src/github.com/chaincode/collections_config-vta.json -n mycc -l node -v 1 -c '{"Args":["initLedger"]}' -P 'AND ('\''DmaMSP.peer'\'','\''VtaMSP.peer'\'')'

peer chaincode upgrade -o orderer.emsa.europa.eu:7050 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/emsa.europa.eu/orderers/orderer.emsa.europa.eu/msp/tlscacerts/tlsca.emsa.europa.eu-cert.pem --channelID mychannel --collections-config /opt/gopath/src/github.com/chaincode/collections_config.json -n mycc -l node -v ${VERSION} -P 'AND ('\''DmaMSP.peer'\'','\''VtaMSP.peer'\'')' -c '{"Args":["Init"]}'