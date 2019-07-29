# Usage

First run the enroll admin and register user scripts to interact with the fabric network:
```bash
node enrollAndRegisterDma.js
node enrollAndRegisterVta.js
```

To reset the enrollment (after a previous build of the network), run:
`./resetEnrollement.sh`

To interact with the fabric network in your application, import the fabric module as follow:
`const fabric = require('./fabric-module');`

# Functions

## createPrivateShipCertificate
`createPrivateShipCertificate(ccpPath, username, channelName, maritimeauthority,  country, certName, certNum, imo, issueDate, expiryDate, certHash)`
Return ``

## createSharedShipCertificate
`createSharedShipCertificate(ccpPath, username, channelName, maritimeauthority, country, certName, certNum, imo, issueDate, expiryDate, certHash)`
Return ``

## createShip
`createShip(ccpPath, username, channelName, maritimeauthority, imo, name, shipType, flag, homePort, tonnage, owner)`
Return ``

## queryAllShips
`queryAllShips(ccpPath, username, channelName, maritimeauthority)`
Return `Buffer of a JSON array of objects`

## queryAllShipsByCountry
`queryAllShipsByCountry(ccpPath, username, channelName, maritimeauthority, country)`
Return `Buffer of a JSON array of objects`

## queryCert
`queryCert(ccpPath, username, channelName, maritimeauthority, country, imo)`
Return `Buffer of a JSON object`

## queryPrivateCert
`queryPrivateCert(ccpPath, username, channelName, maritimeauthority, imo)`
Return `Buffer of a JSON object`

## querySharedCert
`querySharedCert(ccpPath, username, channelName, maritimeauthority, imo)`
Return `Buffer of a JSON object`

## queryShip
`queryShip(ccpPath, username, channelName, maritimeauthority, country, imo)`
Return `Buffer of a JSON`

## shareShipCertificate
`shareShipCertificate(ccpPath, username, channelName, maritimeauthority, providingCountry, requestingCountry, imo)`
Return ``

## verifyLocation
`verifyLocation(ccpPath, username, channelName, maritimeauthority, country, imo)`
Return `Buffer of a true boolean` if ship is within the borders of the requesting country
Return `Buffer of a false boolean` if ship is outside of the borders of the requesting country