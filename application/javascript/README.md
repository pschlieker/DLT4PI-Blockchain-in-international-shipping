# Usage

First run the enroll admin and register user scripts to interact with the fabric network:
`node enrollAndRegister.js`

To reset the enrollment, run this:
`./resetEnrollement.sh`

To interact with the fabric network in your application, import the fabric module as follow:
`const fabric = require('./fabric-module');`

# Functions

## queryShip
`queryShip(ccpPath, username, channelName, imo)`
1. string - `ccpPath`: the path to the connection profile
2. string - `username`: the username of the peer connected
3. string - `channelName`: the channel name used
4. string - `imo`: imo number of the ship
Return `Buffer`

## queryAllShipsByCountry
`queryAllShipsByCountry(ccpPath, username, channelName, country)`
1. string - `ccpPath`: the path to the connection profile
2. string - `username`: the username of the peer connected
3. string - `channelName`: the channel name used
4. string - `country`: the country to be queried
Return `Buffer`

## grantCertAccess
`grantCertAccess(ccpPath, username, chaincodeVersion, channelName, requester, target)`
1. string - `ccpPath`: the path to the connection profile
2. string - `username`: the username of the peer connected
3. string - `chaincodeVersion`: the chaincode version to be specified
4. string - `channelName`: the channel name used
5. string - `requester`: the requesting maritime authority
6. string - `target`: the maritime authority to be granted access to the ship certificates
Return ``

## queryCert
`queryCert(ccpPath, username, channelName, imo)`
1. string - `ccpPath`: the path to the connection profile
2. string - `username`: the username of the peer connected
3. string - `channelName`: the channel name used
4. string - `imo`: imo number of the ship
Return `Buffer`

## createShip
`createShip(ccpPath, username, channelName, imo, name, shipType, flag, homePort, tonnage, owner)`
1. string - `ccpPath`: the path to the connection profile
2. string - `username`: the username of the peer connected
3. string - `channelName`: the channel name used
4. string - `imo`: imo number of the ship
5. string - `name`
6. string - `shipType`
7. string - `flag`
8. string - `homePort`
9. number - `tonnage`
10. string - `owner`
Return ``