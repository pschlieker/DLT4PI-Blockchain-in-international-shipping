#!/bin/bash

export PATH=${PWD}/../bin:${PWD}:$PATH

CERTIFICATE=$(echo -n \
    '{"certName":"NEW International Oil Prevention certificate", "certNum": "901234", "imo": "9166778", "issueDate":"2030-01-01", "expiryDate":"2031-12-31", "certHash":"IPFS_Hash_to_Cert"}' \
    | base64 | tr -d \\n)


# docker exec cli peer chaincode invoke -o orderer.emsa.europa.eu:7050 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/emsa.europa.eu/orderers/orderer.emsa.europa.eu/msp/tlscacerts/tlsca.emsa.europa.eu-cert.pem -C mychannel -n mycc --peerAddresses peer0.dma.dk:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dma.dk/peers/peer0.dma.dk/tls/ca.crt --peerAddresses peer0.veeteedeamet.ee:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/veeteedeamet.ee/peers/peer0.veeteedeamet.ee/tls/ca.crt \

docker exec cli peer chaincode invoke \
    -o orderer.emsa.europa.eu:7050 \
    --tls true \
    --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/emsa.europa.eu/orderers/orderer.emsa.europa.eu/msp/tlscacerts/tlsca.emsa.europa.eu-cert.pem \
    -C mychannel \
    -n mycc \
    --peerAddresses peer0.dma.dk:7051 \
    --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dma.dk/peers/peer0.dma.dk/tls/ca.crt \
-c '{"Args": ["createPrivateShipCertificateTransient", "Denmark", "9166778"]}' --transient "{\"certificate\":\"$CERTIFICATE\"}"

#    --peerAddresses peer0.veeteedeamet.ee:9051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/veeteedeamet.ee/peers/peer0.veeteedeamet.ee/tls/ca.crt \


#--transient '{"certName":"NEW International Oil Prevention certificate", "certNum": "901234", "imo": "9166778", "issueDate":"2030-01-01", "expiryDate":"2031-12-31", "certHash":"IPFS_Hash_to_Cert"}'


#'{"Args": ["createPrivateShipCertificate", "Denmark", "NEW International Oil Prevention certificate", "901234", "9166778", "2030-01-01", "2031-12-31", "IPFS_Hash_to_Cert"]}'
#'{"Args":["verifyLocation", "91667728", "Denmark"]}'
