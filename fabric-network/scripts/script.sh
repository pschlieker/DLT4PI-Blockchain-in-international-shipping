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
PRIVATE_COLLECTIONS_DIR="$6"
COLLECTIONS_PATH_SHARED="$7"
SKIP_QUERIES="$8"
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

echo "Finished installing chaincode."

# Instantiate chaincode on peer0.dma.dk
echo "Instantiating chaincode on peer0.dma.dk ..."
echo "Debug: Private Collections dir: $PRIVATE_COLLECTIONS_DIR"
echo "Debug: Shared Collections path: $COLLECTIONS_PATH_SHARED"
instantiateChaincode 0 2

# Initialize chaincode on peer0.dma.dk and peer0.veeteedeamet.ee
echo "Sending invoke initLedger transaction on peer0.dma.dk & peer0.veeteedeamet.ee ..."
chaincodeInvokeInitLedger 0 1 0 2
chaincodeInvokeInitLedgerPrivateDma 0 1
chaincodeInvokeInitLedgerPrivateVta 0 2


if [ "$SKIP_QUERIES" != "true" ]; then

  echo '==================START: Query transactions=================='

  # ==================Query Ship Certificates Private Part==================

  # Query Denmark ship certificate on peer0.dma.dk
  # Expected: Denmark MA could access Denmark ship certificates
  echo "Querying Denmark certificates on peer0.dma.dk ..."
  chaincodeQueryDenmarkShipCertPrivate 0 1

  # Query Estonia ship certificate on peer1.veeteedeamet.ee
  # Expected: Estonia MA could access Estonia ship certificates
  echo "Querying Estonia certificates on peer1.veeteedeamet.ee ..."
  chaincodeQueryEstoniaShipCertPrivate 1 2

  # Query Denmark ship certificate on peer1.veeteedeamet.ee
  # Expected: Estonia MA could NOT access Denmark ship certificates
   echo "Querying Denmark certificates on peer1.veeteedeamet.ee ..."
   chaincodeQueryDenmarkShipCertPrivate 1 2

  # Query Estonia ship certificate on peer0.dma.dk
  # Expected: Denmark MA could NOT access Estonia ship certificates
   echo "Querying Denmark certificates on peer0.dma.dk ..."
   chaincodeQueryEstoniaShipCertPrivate 0 1

  exit 0

  # ==================Query Ship Part==================

  # Query Denmark ship on peer0.dma.dk
  # Expected: Denmark MA could access Denmark ship
  echo "Querying Denmark ship on peer0.dma.dk ..."
  chaincodeQueryDenmarkShip 0 1

  # Query Estonia ship on peer0.dma.dk
  # Expected: Denmark MA could access Estonia ship
  echo "Querying Estonia ship on peer1.veeteedeamet.ee ..."
  chaincodeQueryEstoniaShip 1 1

  # Query Denmark ship on peer0.veeteedeamet.ee
  # Expected: Estonia MA could access Denmark ship
  echo "Querying Denmark ship on peer0.dma.dk ..."
  chaincodeQueryDenmarkShip 0 2

  # Query Estonia ship on peer1.veeteedeamet.ee
  # Expected: Estonia MA could access Estonia ship
  echo "Querying Estonia ship on peer1.veeteedeamet.ee ..."
  chaincodeQueryEstoniaShip 1 2

  echo '==================END: Query transactions=================='

  echo '==================START: Invoke transactions=================='

  # Invoke createPrivateShipCertificate on peer0.dma.dk
  echo "Sending invoke createPrivateShipCertificate transaction on peer0.dma.dk ..."
  chaincodeInvokeCreateDenmarkCert 0 1

  # Invoke createPrivateShipCertificate on peer0.veeteedeamet.ee
  echo "Sending invoke createPrivateShipCertificate transaction on peer0.veeteedeamet.ee ..."
  chaincodeInvokeCreateEstoniaCert 0 2

  # Invoke createShip on peer0.dma.dk and peer0.veeteedeamet.ee
  echo "Sending invoke createShip transaction on peer0.dma.dk & peer0.veeteedeamet.ee ..."
  chaincodeInvokeCreateShip 0 1 0 2

  echo '==================END: Invoke transactions=================='

  echo '==================START: Query transactions=================='

  # Query Denmark ship certificate on peer0.dma.dk
  # Expected: Denmark MA could access Denmark ship certificates
  echo "Querying Denmark certificates on peer0.dma.dk ..."
  chaincodeQueryDenmarkShipCert 0 1

  # Query Estonia ship certificate on peer1.veeteedeamet.ee
  # Expected: Estonia MA could access Estonia ship certificates
  echo "Querying Estonia certificates on peer1.veeteedeamet.ee ..."
  chaincodeQueryEstoniaShipCert 1 2

  # Query all Denmark ships on peer1.veeteedeamet.ee
  echo "Querying all Denmark ships on peer1.veeteedeamet.ee ..."
  chaincodeQueryAllDenmarkShip 1 2

  # Query all Estonia ships on peer0.dma.dk
  echo "Querying all Estonia ships on peer0.dma.dk ..."
  chaincodeQueryAllEstoniaShip 0 1

  echo '==================END: Query transactions=================='

  # Invoke verifyLocation on peer0.dma.dk and peer0.veeteedeamet.ee
  echo "Sending invoke verifyLocation transaction on peer0.dma.dk & peer0.veeteedeamet.ee ..."
  chaincodeInvokeVerifyLocation 0 1 0 2
fi

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
