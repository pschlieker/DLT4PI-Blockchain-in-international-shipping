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
            "name": "SHANGHAI EXPRESS",
            "mmsi": "218427000",
            "type": "a",
            "time": 1562512931,
            "lasttime": 1562512931,
            "lat": "53.869795",
            "lng": "9.274025",
            "course": "296.1",
            "speed": 21.1128,
            "srccall": "DJBF2",
            "dstcall": "ais",
            "comment": "DEHAM - BEANR (ETA Jul08 10:30)",
            "imo": "501368",
            "vesselclass": "79",
            "navstat": "0",
            "heading": "295",
            "length": "366",
            "width": "48",
            "draught": "12.4",
            "ref_front": "141",
            "ref_left": "29",
            "path": "DO5CO"
        }
    ]
}`
## Moving the ship
The script ./moveShip.sh can be used as follows
* Move ship into range of MA: ./moveShip.sh in
* Move ship out of range of MA: ./moveShip.sh out 
## API Usage
The docker-compose brings up a simple Apache PHP Container, which provides the API under http://localhost:9001/ship1
## Usage with in Chaincode
* Install module request: `npm install request`
* Import Request in chaincode file: `const request = require('request');`
* Retrieve position from API: 
```
request('http://192.168.179.58:9001/ship1', { json: true }, (err, res, body) => {
        if (err) { return console.log(err); }
        let shipLat = body.entries[0].lat;
        let shipLng = body.entries[0].lng;
    });
```
* Because the API lives within another container currently the API ist accessed via the external IP. Should be changed once they are in the same docker network
* Example see exampleChaincode.js