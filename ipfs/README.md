# IPFS
## Architecture
The IPFS Daemon is run within a docker container which exposes the following ports:
* 5001 (API Server / UI)
* 4001 (Swarm Connector)
* 8080 (Gateway)
These can then be interacted with e.g. using the node package ipfs-http-client
 ## Usage
 The node can be started using the script ./start.sh
 The WebUI is then accessible through  http://localhost:5001/webui

 Import the ipfs-module.js to your module:
 `const ipfs = require(PATH_TO_YOUR_MODULE')`

 `ipfs.uploadFile(BUFFER_OF_FILE)`
 `ipfs.retrieveFile(HASH)`