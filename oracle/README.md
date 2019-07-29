# Oracle Service
In order to be able to easily demonstrate the functionality of the prototype, the position API will be mocked. This way, the ship can easly be "moved". 
## API Format
The mocked API follows the structure of https://aprs.fi/page/api Hence it would be easy to use real world data.
The examples were retrieved using: https://api.aprs.fi/api/get?name=276848000&what=loc&apikey=129319.2zJZqAc8PI9Ru7&format=json

`{
  "command": "get",
  "result": "ok",
  "what": "loc",
  "found": 1,
  "entries": [
    {
      "class": "i",
      "name": "TIIU",
      "mmsi": "276824000",
      "type": "a",
      "time": 1564392067,
      "lasttime": 1564392067,
      "lat": 58.88395,
      "lng": 23.17621666666667,
      "course": 251.6999969482422,
      "speed": 19.63120070648193,
      "srccall": "ESKK",
      "dstcall": "ais",
      "comment": "HELTERMAA-ROHUKULA (ETA Jun13 20:20)",
      "imo": "762687",
      "vesselclass": "60",
      "navstat": "0",
      "heading": "251",
      "length": "114",
      "width": "18",
      "draught": "4.0",
      "ref_front": "57",
      "ref_left": "9",
      "path": "es8tjm"
    }
  ]
}`
## Moving the ship
The script ./moveShip.sh can be used as follows
* Move ship into range of MA: ./moveShip.sh in
* Move ship out of range of MA: ./moveShip.sh out 
## API Usage
The docker-compose brings up a simple Apache PHP Container, which provides the API under http://localhost:9001/{IMO_number}
## Usage with in Chaincode
* Install module request: `npm install request`
* Import Request in chaincode file: `const request = require('request');`
* Retrieve position from API: 
```
request('http://192.168.179.58:9001/{IMO_number}', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        let shipLat = body.entries[0].lat;
        let shipLng = body.entries[0].lng;
    });
```
* Because the API lives within another container currently the API ist accessed via the external IP. Should be changed once they are in the same docker network
* Example see exampleChaincode.js