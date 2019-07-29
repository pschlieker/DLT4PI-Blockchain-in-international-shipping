# Oracle Service
In order to be able to easily demonstrate the functionality of the prototype, the position API will be mocked. This way, the ship can easly be "moved". 

## API Format
The mocked API follows the structure of https://aprs.fi/page/api Hence it would be easy to use real world data.
The examples were retrieved using: https://api.aprs.fi/api/get?name=276848000&what=loc&apikey=keyxyz&format=json
Please register an account under https://aprs.fi to get the API key in order to retrieve real-time data.

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
* Move ship into range of MA: ./moveShip.sh in imo
* Move ship out of range of MA: ./moveShip.sh out imo  
If no IMO is provided 9762687 is used

## API Usage
The docker-compose brings up a simple Apache PHP Container, which provides the API under http://oracle/{IMO_number}

## Usage with in Chaincode
* Install module request: `npm install request`
* Import Request in chaincode file: `const request = require('request');`
* Retrieve position from API: 
```
request('http://oracle/{IMO_number}', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        let shipLat = body.entries[0].lat;
        let shipLng = body.entries[0].lng;
    });
```
* Example see exampleChaincode.js