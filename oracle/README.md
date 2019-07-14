# Oracle Service
In order to be able to easily demonstrate the functionality of the prototype, the position API will be mocked. This way, the ship can easly be "moved". 
## API Format
The mocked API follows the structure of https://aprs.fi/page/api Hence it would be easy to use real world data. The examples were retrieved using: https://api.aprs.fi/api/get?name=311003200&what=loc&apikey=128413.pwWuYRfPnnU3K4L&format=json

`{
    "command": "get",
    "result": "ok",
    "what": "loc",
    "found": 1,
    "entries": [
        {
            "class": "i",
            "name": "AOTEA MAERSK",
            "mmsi": "219791000",
            "type": "a",
            "time": "1558495346",
            "lasttime": "1558495346",
            "lat": "53.869795",
            "lng": "9.274025",
            "course": "335",
            "speed": "34",
            "srccall": "OYJS2",
            "dstcall": "ais",
            "comment": "NZUFX TWKAO (ETA Jun02 00:00)",
            "imo": "9166778",
            "vesselclass": "71",
            "navstat": "0",
            "heading": "330",
            "length": "347",
            "width": "43",
            "draught": "13.6",
            "ref_front": "245",
            "ref_left": "21",
            "path": "ZL3RUM"
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