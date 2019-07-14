#!/bin/bash

echo
echo " ____    _____      _      ____    _____ "
echo "/ ___|  |_   _|    / \    |  _ \  |_   _|"
echo "\___ \    | |     / _ \   | |_) |   | |  "
echo " ___) |   | |    / ___ \  |  _ <    | |  "
echo "|____/    |_|   /_/   \_\ |_| \_\   |_|  "
echo
echo "Build your first network (BYFN) end-to-end test"
echo
CHANNEL_NAME="$1"
DELAY="$2"
LANGUAGE="$3"
TIMEOUT="$4"
VERBOSE="$5"
COLLECTIONS_PATH="$6"
: ${CHANNEL_NAME:="mychannel"}
: ${DELAY:="3"}
: ${LANGUAGE:="golang"}
: ${TIMEOUT:="10"}
: ${VERBOSE:="false"}
LANGUAGE=`echo "$LANGUAGE" | tr [:upper:] [:lower:]`
COUNTER=1
MAX_RETRY=10

CC_SRC_PATH="github.com/chaincode/chaincode_example02/go/"
if [ "$LANGUAGE" = "node" ]; then
	CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/node/"
fi

if [ "$LANGUAGE" = "java" ]; then
	CC_SRC_PATH="/opt/gopath/src/github.com/chaincode/chaincode_example02/java/"
fi

echo "Channel name : "$CHANNEL_NAME

# import utils
. scripts/utils.sh

createChannel() {
	setGlobals 0 1

  echo "Trying to create Channel '$CHANNEL_NAME'."
	if [ -z "$CORE_PEER_TLS_ENABLED" -o "$CORE_PEER_TLS_ENABLED" = "false" ]; then
                set -x
		peer channel create -o orderer.emsa.europa.eu:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx >&log.txt
		res=$?
                set +x
	else
				set -x
		peer channel create -o orderer.emsa.europa.eu:7050 -c $CHANNEL_NAME -f ./channel-artifacts/channel.tx --tls $CORE_PEER_TLS_ENABLED --cafile $ORDERER_CA >&log.txt
		res=$?
				set +x
	fi
	cat log.txt
	verifyResult $res "Failed to create Channel '$CHANNEL_NAME'"
	echo "===================== Channel '$CHANNEL_NAME' created ===================== "
	echo
}

joinChannel () {
	for org in 1 2; do
	    for peer in 0 1; do
		joinChannelWithRetry $peer $org
		echo "===================== peer${peer}.org${org} joined channel '$CHANNEL_NAME' ===================== "
		sleep $DELAY
		echo
	    done
	done
}

## Create channel
echo "Creating channel..."
createChannel

## Join all the peers to the channel
echo "Having all peers join the channel..."
joinChannel

## Set the anchor peers for each MA in the channel
echo "Updating anchor peers for dma.dk ..."
updateAnchorPeers 0 1
echo "Updating anchor peers for veeteedeamet.ee ..."
updateAnchorPeers 0 2

## Install chaincode on peer0.dma.dk and peer0.veeteedeamet.ee
echo "Installing chaincode on peer0.dma.dk ..."
installChaincode 0 1
echo "Install chaincode on peer0.veeteedeamet.ee ..."
installChaincode 0 2
echo "Installing chaincode on peer1.dma.dk ..."
installChaincode 1 1
echo "Install chaincode on peer1.veeteedeamet.ee ..."
installChaincode 1 2

# Instantiate chaincode on peer0.dma.dk
echo "Instantiating chaincode on peer0.dma.dk ..."
echo "Debug: Collections path: $COLLECTIONS_PATH"
instantiateChaincode 0 1

# Instantiate chaincode on peer0.veeteedeamet.ee
echo "Instantiating chaincode on peer0.veeteedeamet.ee ..."
echo "Debug: Collections path: $COLLECTIONS_PATH"
instantiateChaincode 0 2

# Initialize chaincode on peer0.dma.dk and peer0.veeteedeamet.ee
echo "Sending invoke initLedger transaction on peer0.dma.dk & peer0.veeteedeamet.ee ..."
chaincodeInvokeInitLedger 0 1 0 2

# Query chaincode on peer0.dma.dk
echo "Querying chaincode on peer0.dma.dk ..."
chaincodeQuery 0 1

# Query on chaincode on peer1.org2
echo "Querying chaincode on peer1.veeteedeamet.ee ..."
chaincodeQuery 1 2

# Invoke chaincode on peer0.dma.dk and peer0.veeteedeamet.ee
echo "Sending invoke createPrivateShipCertificate transaction on peer0.dma.dk & peer0.veeteedeamet.ee ..."
chaincodeInvokeCreateCert 0 1 0 2

# Invoke chaincode on peer0.dma.dk and peer0.veeteedeamet.ee
echo "Sending invoke createShip transaction on peer0.dma.dk & peer0.veeteedeamet.ee ..."
chaincodeInvokeCreateShip 0 1 0 2



echo
echo "========= All GOOD, BYFN execution completed =========== "
echo

echo
echo " _____   _   _   ____   "
echo "| ____| | \ | | |  _ \  "
echo "|  _|   |  \| | | | | | "
echo "| |___  | |\  | | |_| | "
echo "|_____| |_| \_| |____/  "
echo

exit 0
