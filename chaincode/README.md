# Install and instantiate the chaincode

## Required packages
- A fabric network running with version 1.4
`npm install geolocation-utils`
`npm install request`
`npm install fabric-shim`

## After the network is built in the fabric-network folder
- Enter the cli container
`sudo docker exec -i -t cli /bin/bash`

- Install the chaincode to every peer on the network

- View the log inside peer
`docker logs [container_id]`
