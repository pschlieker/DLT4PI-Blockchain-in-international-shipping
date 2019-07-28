#!/usr/bin/env bash
#
# Copyright IBM Corp All Rights Reserved
#
# SPDX-License-Identifier: Apache-2.0
#

# This is a collection of bash functions used by different scripts

ORDERER_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/emsa.europa.eu/orderers/orderer.emsa.europa.eu/msp/tlscacerts/tlsca.emsa.europa.eu-cert.pem
PEER0_ORG1_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dma.dk/peers/peer0.dma.dk/tls/ca.crt
PEER0_ORG2_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/veeteedeamet.ee/peers/peer0.veeteedeamet.ee/tls/ca.crt
PEER0_ORG3_CA=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/sjofartsverket.se/peers/peer0.sjofartsverket.se/tls/ca.crt

# verify the result of the end-to-end test
verifyResult() {
  if [ $1 -ne 0 ]; then
    echo "!!!!!!!!!!!!!!! "$2" !!!!!!!!!!!!!!!!"
    echo "========= ERROR !!! FAILED to execute End-2-End Scenario ==========="
    echo
    exit 1
  fi
}

# Set OrdererOrg.Admin globals
setOrdererGlobals() {
  CORE_PEER_LOCALMSPID="OrdererMSP"
  CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/emsa.europa.eu/orderers/orderer.emsa.europa.eu/msp/tlscacerts/tlsca.emsa.europa.eu-cert.pem
  CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/emsa.europa.eu/users/Admin@emsa.europa.eu/msp
}

setGlobals() {
  PEER=$1
  ORG=$2
  if [ $ORG -eq 1 ]; then
    CORE_PEER_LOCALMSPID="DmaMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG1_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dma.dk/users/Admin@dma.dk/msp
    CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dma.dk/peers/peer0.dma.dk/tls/server.crt
    CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/dma.dk/peers/peer0.dma.dk/tls/server.key
    if [ $PEER -eq 0 ]; then
      CORE_PEER_ADDRESS=peer0.dma.dk:7051
    else
      CORE_PEER_ADDRESS=peer1.dma.dk:8051
    fi
  elif [ $ORG -eq 2 ]; then
    CORE_PEER_LOCALMSPID="VtaMSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG2_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/veeteedeamet.ee/users/Admin@veeteedeamet.ee/msp
    CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/veeteedeamet.ee/peers/peer0.veeteedeamet.ee/tls/server.crt
    CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/veeteedeamet.ee/peers/peer0.veeteedeamet.ee/tls/server.key
    if [ $PEER -eq 0 ]; then
      CORE_PEER_ADDRESS=peer0.veeteedeamet.ee:9051
    else
      CORE_PEER_ADDRESS=peer1.veeteedeamet.ee:10051
    fi

  elif [ $ORG -eq 3 ]; then
    CORE_PEER_LOCALMSPID="Org3MSP"
    CORE_PEER_TLS_ROOTCERT_FILE=$PEER0_ORG3_CA
    CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/sjofartsverket.se/users/Admin@sjofartsverket.se/msp
    # TODO check if other globals are needed (see above)
    if [ $PEER -eq 0 ]; then
      CORE_PEER_ADDRESS=peer0.sjofartsverket.se:11051
    else
      CORE_PEER_ADDRESS=peer1.sjofartsverket.se:12051
    fi
  else

    echo "================== ERROR !!! ORG Unknown =================="
  fi

  if [ "$VERBOSE" == "true" ]; then
    env | grep CORE
  fi
}

updateAnchorPeers() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG

  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer channel update -o orderer.emsa.europa.eu:7050 -c $CHANNEL_NAME -f ./channel-artifacts/${CORE_PEER_LOCALMSPID}anchors.tx >&log.txt
    res=$?
    set +x
  else
    set -x
    peer channel update -o orderer.emsa.europa.eu:7050 -c $CHANNEL_NAME -f ./channel-artifacts/${CORE_PEER_LOCALMSPID}anchors.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Anchor peer update failed"
  echo "===================== Anchor peers updated for org '$CORE_PEER_LOCALMSPID' on channel '$CHANNEL_NAME' ===================== "
  sleep $DELAY
  echo
}

## Sometimes Join takes time hence RETRY at least 5 times
joinChannelWithRetry() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG

  set -x
  peer channel join -b $CHANNEL_NAME.block >&log.txt
  res=$?
  set +x
  cat log.txt
  if [ $res -ne 0 -a $COUNTER -lt $MAX_RETRY ]; then
    COUNTER=$(expr $COUNTER + 1)
    echo "peer${PEER}.org${ORG} failed to join the channel, Retry after $DELAY seconds"
    sleep $DELAY
    joinChannelWithRetry $PEER $ORG
  else
    COUNTER=1
  fi
  verifyResult $res "After $MAX_RETRY attempts, peer${PEER}.org${ORG} has failed to join channel '$CHANNEL_NAME' "
}

installChaincode() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG
  VERSION=${3:-1.0}
  set -x
  peer chaincode install -n generalData -v ${VERSION} -l ${LANGUAGE} -p ${CC_SRC_PATH}generalData/ >&log.txt
  peer chaincode install -n sharePrivateData -v ${VERSION} -l ${LANGUAGE} -p ${CC_SRC_PATH}sharePrivateData/ >&log.txt

  #Only install the chaincode on the peers running it
  if [ $ORG == "1" ]; then
    peer chaincode install -n privateDataDma -v ${VERSION} -l ${LANGUAGE} -p ${CC_SRC_PATH}privateData/ >&log.txt
  fi

  if [ $ORG == "2" ]; then
    peer chaincode install -n privateDataVta -v ${VERSION} -l ${LANGUAGE} -p ${CC_SRC_PATH}privateData/ >&log.txt
  fi
  
  res=$?
  set +x
  cat log.txt
  verifyResult $res "Chaincode installation on peer${PEER}.org${ORG} has failed"
  echo "===================== Chaincode is installed on peer${PEER}.org${ORG} ===================== "
  echo
}

instantiateChaincode() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG
  VERSION=${3:-1.0}

  # while 'peer chaincode' command can get the orderer endpoint from the peer
  # (if join was successful), let's supply it directly as we know it using
  # the "-o" option
  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer chaincode instantiate -o orderer.emsa.europa.eu:7050 -C $CHANNEL_NAME -n generalData      -l ${LANGUAGE} -v ${VERSION} -c '{"Args":["initLedger"]}' -P "AND ('DmaMSP.peer','VtaMSP.peer')"                                                   >&log.txt
    #peer chaincode instantiate -o orderer.emsa.europa.eu:7050 -C $CHANNEL_NAME -n sharePrivateData -l ${LANGUAGE} -v ${VERSION} -c '{"Args":[]}'             -P "OR ('DmaMSP.peer','VtaMSP.peer')"  --collections-config ${COLLECTIONS_PATH_SHARED}   >&log.txt
    
    #peer chaincode instantiate -o orderer.emsa.europa.eu:7050 -C $CHANNEL_NAME -n privateDataVta   -l ${LANGUAGE} -v ${VERSION} -c '{"Args":[]}'             -P "AND ('VtaMSP.peer')"               --collections-config ${PRIVATE_COLLECTIONS_DIR}collections_config-vta.json >&log.txt

    # instantiate dma-only code
    ORG=1
    setGlobals $PEER $ORG
    #peer chaincode instantiate -o orderer.emsa.chaincodeInvokeInitLedger.eu:7050 -C $CHANNEL_NAME -n privateDataDma   -l ${LANGUAGE} -v ${VERSION} -c '{"Args":[]}'             -P "AND ('DmaMSP.peer')"               --collections-config ${PRIVATE_COLLECTIONS_DIR}collections_config-dma.json >&log.txt

    res=$?
    set +x
  else
    set -x
    peer chaincode instantiate -o orderer.emsa.europa.eu:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -v ${VERSION} -C $CHANNEL_NAME -n generalData      -l ${LANGUAGE} -v 1.0 -c '{"Args":[""]}' -P "AND ('DmaMSP.peer','VtaMSP.peer')"                                                 >&log.txt
    peer chaincode instantiate -o orderer.emsa.europa.eu:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -v ${VERSION} -C $CHANNEL_NAME -n sharePrivateData -l ${LANGUAGE} -v 1.0 -c '{"Args":[""]}'             -P "OR ('DmaMSP.peer','VtaMSP.peer')"  --collections-config ${COLLECTIONS_PATH_SHARED} >&log.txt

    if [ $ORG == "1" ]; then
      peer chaincode instantiate -o orderer.emsa.europa.eu:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -v ${VERSION} -C $CHANNEL_NAME -n privateDataDma   -l ${LANGUAGE} -v 1.0 -c '{"Args":[""]}'             -P "AND ('DmaMSP.peer')"               --collections-config ${PRIVATE_COLLECTIONS_DIR}collections_config-dma.json >&log.txt
    fi

    if [ $ORG == "2" ]; then
    peer chaincode instantiate -o orderer.emsa.europa.eu:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -v ${VERSION} -C $CHANNEL_NAME -n privateDataVta   -l ${LANGUAGE} -v 1.0 -c '{"Args":[""]}'             -P "AND ('VtaMSP.peer')"               --collections-config ${PRIVATE_COLLECTIONS_DIR}collections_config-vta.json >&log.txt
    fi

    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Chaincode instantiation on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' failed"
  echo "===================== Chaincode is instantiated on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' ===================== "
  echo
}

upgradeChaincode() {
  # TODO edit this to upgrade all the chaincodes
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG

  set -x
  peer chaincode upgrade -o orderer.emsa.europa.eu:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n generalData -v 2.0 -c '{"Args":[]}' -P "AND ('DmaMSP.peer','VtaMSP.peer')"
  res=$?
  set +x
  cat log.txt
  verifyResult $res "Chaincode upgrade on peer${PEER}.org${ORG} has failed"
  echo "===================== Chaincode is upgraded on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' ===================== "
  echo
}

# fetchChannelConfig <channel_id> <output_json>
# Writes the current channel config for a given channel to a JSON file
fetchChannelConfig() {
  CHANNEL=$1
  OUTPUT=$2

  setOrdererGlobals

  echo "Fetching the most recent configuration block for the channel"
  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer channel fetch config config_block.pb -o orderer.emsa.europa.eu:7050 -c $CHANNEL --cafile $ORDERER_CA
    set +x
  else
    set -x
    peer channel fetch config config_block.pb -o orderer.emsa.europa.eu:7050 -c $CHANNEL --tls --cafile $ORDERER_CA
    set +x
  fi

  echo "Decoding config block to JSON and isolating config to ${OUTPUT}"
  set -x
  configtxlator proto_decode --input config_block.pb --type common.Block | jq .data.data[0].payload.data.config >"${OUTPUT}"
  set +x
}

# signConfigtxAsPeerOrg <org> <configtx.pb>
# Set the peerOrg admin of an org and signing the config update
signConfigtxAsPeerOrg() {
  PEERORG=$1
  TX=$2
  setGlobals 0 $PEERORG
  set -x
  peer channel signconfigtx -f "${TX}"
  set +x
}

# createConfigUpdate <channel_id> <original_config.json> <modified_config.json> <output.pb>
# Takes an original and modified config, and produces the config update tx
# which transitions between the two
createConfigUpdate() {
  CHANNEL=$1
  ORIGINAL=$2
  MODIFIED=$3
  OUTPUT=$4

  set -x
  configtxlator proto_encode --input "${ORIGINAL}" --type common.Config >original_config.pb
  configtxlator proto_encode --input "${MODIFIED}" --type common.Config >modified_config.pb
  configtxlator compute_update --channel_id "${CHANNEL}" --original original_config.pb --updated modified_config.pb >config_update.pb
  configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate >config_update.json
  echo '{"payload":{"header":{"channel_header":{"channel_id":"'$CHANNEL'", "type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' | jq . >config_update_in_envelope.json
  configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope >"${OUTPUT}"
  set +x
}

# parsePeerConnectionParameters $@
# Helper function that takes the parameters from a chaincode operation
# (e.g. invoke, query, instantiate) and checks for an even number of
# peers and associated org, then sets $PEER_CONN_PARMS and $PEERS
parsePeerConnectionParameters() {
  # check for uneven number of peer and org parameters
  if [ $(($# % 2)) -ne 0 ]; then
    exit 1
  fi

  PEER_CONN_PARMS=""
  PEERS=""
  while [ "$#" -gt 0 ]; do
    setGlobals $1 $2
    PEER="peer$1.org$2"
    PEERS="$PEERS $PEER"
    PEER_CONN_PARMS="$PEER_CONN_PARMS --peerAddresses $CORE_PEER_ADDRESS"
    if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "true" ]; then
      TLSINFO=$(eval echo "--tlsRootCertFiles \$PEER$1_ORG$2_CA")
      PEER_CONN_PARMS="$PEER_CONN_PARMS $TLSINFO"
    fi
    # shift by two to get the next pair of peer/org parameters
    shift
    shift
  done
  # remove leading space for output
  PEERS="$(echo -e "$PEERS" | sed -e 's/^[[:space:]]*//')"
}

# chaincodeQueryEstoniaShipCert <peer> <org> ...
chaincodeCreateEstoniaShipCertPrivate() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG
  echo "===================== Querying on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME'... ===================== "
  local rc=1
  local starttime=$(date +%s)

  # continue to poll
  # we either get a successful response, or reach TIMEOUT
  while
    test "$(($(date +%s) - starttime))" -lt "$TIMEOUT" -a $rc -ne 0
  do
    sleep $DELAY
    echo "Attempting to createPrivateShipCertificate peer${PEER}.org${ORG} ...$(($(date +%s) - starttime)) secs"
    set -x
    peer chaincode invoke -C $CHANNEL_NAME -n privateDataVta -c '{"Args":["readPrivateShipCertificate", "Estonia", "9148843"]}' >&log.txt
    res=$?
    set +x
  done
  echo
  cat log.txt
  echo "===================== Query finished on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' ===================== "
}

# chaincodeQueryDenmarkShipCert <peer> <org> ...
chaincodeQueryDenmarkShipCertPrivate() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG
  echo "===================== Querying on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME'... ===================== "
  local rc=1
  local starttime=$(date +%s)

  # continue to poll
  # we either get a successful response, or reach TIMEOUT
  while
    test "$(($(date +%s) - starttime))" -lt "$TIMEOUT" -a $rc -ne 0
  do
    sleep $DELAY
    echo "Attempting to readPrivateShipCertificate peer${PEER}.org${ORG} ...$(($(date +%s) - starttime)) secs"
    set -x
    peer chaincode query -C $CHANNEL_NAME -n privateDataDma -c '{"Args":["readPrivateShipCertificate", "Denmark", "9274848"]}' >&log.txt
    res=$?
    set +x
  done
  echo
  cat log.txt
  echo "===================== Query finished on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' ===================== "
}

# chaincodeQueryEstoniaShipCert <peer> <org> ...
chaincodeQueryEstoniaShipCertPrivate() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG
  echo "===================== Querying on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME'... ===================== "
  local rc=1
  local starttime=$(date +%s)

  # continue to poll
  # we either get a successful response, or reach TIMEOUT
  while
    test "$(($(date +%s) - starttime))" -lt "$TIMEOUT" -a $rc -ne 0
  do
    sleep $DELAY
    echo "Attempting to readPrivateShipCertificate peer${PEER}.org${ORG} ...$(($(date +%s) - starttime)) secs"
    set -x
    peer chaincode query -C $CHANNEL_NAME -n privateDataVta -c '{"Args":["readPrivateShipCertificate", "Estonia", "9148843"]}' >&log.txt
    res=$?
    set +x
  done
  echo
  cat log.txt
  echo "===================== Query finished on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' ===================== "
}

# chaincodeQueryDenmarkShip <peer> <org> ...
chaincodeQueryDenmarkShip() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG
  echo "===================== Querying on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME'... ===================== "
  local rc=1
  local starttime=$(date +%s)

  # continue to poll
  # we either get a successful response, or reach TIMEOUT
  while
    test "$(($(date +%s) - starttime))" -lt "$TIMEOUT" -a $rc -ne 0
  do
    sleep $DELAY
    echo "Attempting to queryShip peer${PEER}.org${ORG} ...$(($(date +%s) - starttime)) secs"
    set -x
    peer chaincode query -C $CHANNEL_NAME -n generalData -c '{"Args":["queryShip", "Denmark", "9166778"]}' >&log.txt
    res=$?
    set +x
  done
  echo
  cat log.txt
  echo "===================== Query finished on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' ===================== "
}

# chaincodeQueryEstoniaShip <peer> <org> ...
chaincodeQueryEstoniaShip() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG
  echo "===================== Querying on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME'... ===================== "
  local rc=1
  local starttime=$(date +%s)

  # continue to poll
  # we either get a successful response, or reach TIMEOUT
  while
    test "$(($(date +%s) - starttime))" -lt "$TIMEOUT" -a $rc -ne 0
  do
    sleep $DELAY
    echo "Attempting to queryShip peer${PEER}.org${ORG} ...$(($(date +%s) - starttime)) secs"
    set -x
    peer chaincode query -C $CHANNEL_NAME -n generalData -c '{"Args":["queryShip", "Estonia", "9762687"]}' >&log.txt
    res=$?
    set +x
  done
  echo
  cat log.txt
  echo "===================== Query finished on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' ===================== "
}

# chaincodeQueryAllDenmarkShip <peer> <org> ...
chaincodeQueryAllDenmarkShip() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG
  echo "===================== Querying on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME'... ===================== "
  local rc=1
  local starttime=$(date +%s)

  # continue to poll
  # we either get a successful response, or reach TIMEOUT
  while
    test "$(($(date +%s) - starttime))" -lt "$TIMEOUT" -a $rc -ne 0
  do
    sleep $DELAY
    echo "Attempting to queryShip peer${PEER}.org${ORG} ...$(($(date +%s) - starttime)) secs"
    set -x
    peer chaincode query -C $CHANNEL_NAME -n generalData -c '{"Args":["queryAllShipsByCountry", "Denmark"]}' >&log.txt
    res=$?
    set +x
  done
  echo
  cat log.txt
  echo "===================== Query finished on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' ===================== "
}

# chaincodeQueryAllEstoniaShip <peer> <org> ...
chaincodeQueryAllEstoniaShip() {
  PEER=$1
  ORG=$2
  setGlobals $PEER $ORG
  echo "===================== Querying on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME'... ===================== "
  local rc=1
  local starttime=$(date +%s)

  # continue to poll
  # we either get a successful response, or reach TIMEOUT
  while
    test "$(($(date +%s) - starttime))" -lt "$TIMEOUT" -a $rc -ne 0
  do
    sleep $DELAY
    echo "Attempting to queryShip peer${PEER}.org${ORG} ...$(($(date +%s) - starttime)) secs"
    set -x
    peer chaincode query -C $CHANNEL_NAME -n generalData -c '{"Args":["queryAllShipsByCountry", "Estonia"]}' >&log.txt
    res=$?
    set +x
  done
  echo
  cat log.txt
  echo "===================== Query finished on peer${PEER}.org${ORG} on channel '$CHANNEL_NAME' ===================== "
}

# chaincodeInvokeInitLedger <peer> <org> ...
# Accepts as many peer/org pairs as desired and requests endorsement from each
chaincodeInvokeInitLedger() {
  parsePeerConnectionParameters $@
  res=$?
  verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

  # while 'peer chaincode' command can get the orderer endpoint from the
  # peer (if join was successful), let's supply it directly as we know
  # it using the "-o" option
  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer chaincode invoke -o orderer.emsa.europa.eu:7050 -C $CHANNEL_NAME -n generalData $PEER_CONN_PARMS -c '{"Args":["initLedger"]}' >&log.txt
    res=$?
    set +x
  else
    set -x
    peer chaincode invoke -o orderer.emsa.europa.eu:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n generalData $PEER_CONN_PARMS -c '{"Args":["initLedger"]}' >&log.txt   
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Invoke execution on $PEERS failed "
  echo "===================== Invoke transaction chaincodeInvokeInitLedger successful on $PEERS on channel '$CHANNEL_NAME' ===================== "
  echo
}

# chaincodeInvokeInitLedgerPrivateDma <peer> <org> ...
# Accepts as many peer/org pairs as desired and requests endorsement from each
chaincodeInvokeInitLedgerPrivateDma() {
  parsePeerConnectionParameters $@
  res=$?
  verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

  # while 'peer chaincode' command can get the orderer endpoint from the
  # peer (if join was successful), let's supply it directly as we know
  # it using the "-o" option
  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer chaincode invoke -o orderer.emsa.europa.eu:7050 -C $CHANNEL_NAME -n privateDataDma $PEER_CONN_PARMS -c '{"Args":["initPrivateDataForDma"]}' >&log.txt
    res=$?
    set +x
  else
    set -x
    peer chaincode invoke -o orderer.emsa.europa.eu:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n privateDataDma $PEER_CONN_PARMS -c '{"Args":["initPrivateDataForDma"]}' >&log.txt   
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Invoke execution on $PEERS failed "
  echo "===================== Invoke transaction initPrivateDataForDma successful on $PEERS on channel '$CHANNEL_NAME' ===================== "
  echo
}

# chaincodeInvokeInitLedgerPrivateVta <peer> <org> ...
# Accepts as many peer/org pairs as desired and requests endorsement from each
chaincodeInvokeInitLedgerPrivateVta() {
  parsePeerConnectionParameters $@
  res=$?
  verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

  # while 'peer chaincode' command can get the orderer endpoint from the
  # peer (if join was successful), let's supply it directly as we know
  # it using the "-o" option
  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer chaincode invoke -o orderer.emsa.europa.eu:7050 -C $CHANNEL_NAME -n privateDataVta $PEER_CONN_PARMS -c '{"Args":["initPrivateDataForVta"]}' >&log.txt
    res=$?
    set +x
  else
    set -x
    peer chaincode invoke -o orderer.emsa.europa.eu:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n privateDataVta $PEER_CONN_PARMS -c '{"Args":["initPrivateDataForVta"]}' >&log.txt   
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Invoke execution on $PEERS failed "
  echo "===================== Invoke transaction initPrivateDataForVta successful on $PEERS on channel '$CHANNEL_NAME' ===================== "
  echo
}

# chaincodeInvokeCreateDenmarkCert <peer> <org> ...
# Accepts as many peer/org pairs as desired and requests endorsement from each
chaincodeInvokeCreateDenmarkCert() {
  parsePeerConnectionParameters $@
  res=$?
  verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

  # while 'peer chaincode' command can get the orderer endpoint from the
  # peer (if join was successful), let's supply it directly as we know
  # it using the "-o" option
  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer chaincode invoke -o orderer.emsa.europa.eu:7050 -C $CHANNEL_NAME -n sharePrivateData $PEER_CONN_PARMS -c '{"Args":["createPrivateShipCertificate", "Denmark", "International Oil Prevention certificate", "901234", "9166778", "2030-01-01", "2031-12-31", "IPFS_Hash_to_Cert"]}' >&log.txt
    res=$?
    set +x
  else
    set -x
    peer chaincode invoke -o orderer.emsa.europa.eu:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n sharePrivateData $PEER_CONN_PARMS -c '{"Args":["createPrivateShipCertificate", "Denmark", "International Oil Prevention certificate", "901234", "9166778", "2030-01-01", "2031-12-31", "IPFS_Hash_to_Cert"]}' >&log.txt
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Invoke execution on $PEERS failed "
  echo "===================== Invoke transaction chaincodeInvokeCreateCert successful on $PEERS on channel '$CHANNEL_NAME' ===================== "
  echo
}

# chaincodeInvokeCreateEstoniaCert <peer> <org> ...
# Accepts as many peer/org pairs as desired and requests endorsement from each
chaincodeInvokeCreateEstoniaCert() {
  parsePeerConnectionParameters $@
  res=$?
  verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

  # while 'peer chaincode' command can get the orderer endpoint from the
  # peer (if join was successful), let's supply it directly as we know
  # it using the "-o" option
  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer chaincode invoke -o orderer.emsa.europa.eu:7050 -C $CHANNEL_NAME -n sharePrivateData $PEER_CONN_PARMS -c '{"Args":["createPrivateShipCertificate", "Estonia", "International Oil Prevention certificate", "901234", "9762687", "2040-01-01", "2041-12-31", "IPFS_Hash_to_Cert"]}' >&log.txt
    res=$?
    set +x
  else
    set -x
    peer chaincode invoke -o orderer.emsa.europa.eu:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n sharePrivateData $PEER_CONN_PARMS -c '{"Args":["createPrivateShipCertificate", "Estonia", "International Oil Prevention certificate", "901234", "9762687", "2040-01-01", "2041-12-31", "IPFS_Hash_to_Cert"]}' >&log.txt
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Invoke execution on $PEERS failed "
  echo "===================== Invoke transaction chaincodeInvokeCreateCert successful on $PEERS on channel '$CHANNEL_NAME' ===================== "
  echo
}

# chaincodeInvokeCreateShip <peer> <org> ...
# Accepts as many peer/org pairs as desired and requests endorsement from each
chaincodeInvokeCreateShip() {
  parsePeerConnectionParameters $@
  res=$?
  verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

  # while 'peer chaincode' command can get the orderer endpoint from the
  # peer (if join was successful), let's supply it directly as we know
  # it using the "-o" option
  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer chaincode invoke -o orderer.emsa.europa.eu:7050 -C $CHANNEL_NAME -n generalData $PEER_CONN_PARMS -c '{"Args":["createShip", "001122", "APPLE", "Container Ship", "Denmark", "Port of Copenhagen", "1234", "Alice"]}' >&log.txt
    res=$?
    set +x
  else
    set -x
    peer chaincode invoke -o orderer.emsa.europa.eu:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n generalData $PEER_CONN_PARMS -c '{"Args":["createShip", "001122", "APPLE", "Container Ship", "Denmark", "Port of Copenhagen", "1234", "Alice"]}' >&log.txt
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Invoke execution on $PEERS failed "
  echo "===================== Invoke transaction chaincodeInvokeCreateShip successful on $PEERS on channel '$CHANNEL_NAME' ===================== "
  echo
}

# chaincodeInvokeVerifyLocation <peer> <org> ...
# Accepts as many peer/org pairs as desired and requests endorsement from each
chaincodeInvokeVerifyLocation() {
  parsePeerConnectionParameters $@
  res=$?
  verifyResult $res "Invoke transaction failed on channel '$CHANNEL_NAME' due to uneven number of peer and org parameters "

  # while 'peer chaincode' command can get the orderer endpoint from the
  # peer (if join was successful), let's supply it directly as we know
  # it using the "-o" option
  if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
    set -x
    peer chaincode invoke -o orderer.emsa.europa.eu:7050 -C $CHANNEL_NAME -n generalData $PEER_CONN_PARMS -c '{"Args":["verifyLocation", "9166778", "Denmark"]}' >&log.txt
    res=$?
    set +x
  else
    set -x
    peer chaincode invoke -o orderer.emsa.europa.eu:7050 --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA -C $CHANNEL_NAME -n generalData $PEER_CONN_PARMS -c '{"Args":["verifyLocation", "9166778", "Denmark"]}' >&log.txt
    res=$?
    set +x
  fi
  cat log.txt
  verifyResult $res "Invoke execution on $PEERS failed "
  echo "===================== Invoke transaction chaincodeInvokeCreateShip successful on $PEERS on channel '$CHANNEL_NAME' ===================== "
  echo
}
