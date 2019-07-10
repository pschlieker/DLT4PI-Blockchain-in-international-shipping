var fs = require('fs');

function parsedirectJSON(){
    fs.readFile( __dirname + '/estonia-eez.json', function (err, data) {
        if (err) {
          throw err; 
        }
      
        let borderjson = JSON.parse(data.toString());
        let outerbounds = borderjson.features[0].geometry.coordinates[0];
      
        var output={};
        
        /*output=[];
      
        for(i in outerbounds){
            output = outerbounds[i].concat(output);
      
        }*/
      
        output = outerbounds[0];
      
        var json = JSON.stringify(output);
        fs.writeFile('myjsonfile2.json', json, 'utf8');
      
      
      });
}


//Used to get JSON from XML: https://codebeautify.org/xmltojson
//Used for visualization: http://geojson.io/#map
function parseXMLJSON(){
    fs.readFile( __dirname + '/input.file', function (err, data) {
        if (err) {
          throw err; 
        }
      
        splitted = data.toString().split(" ");
        
        result = "[";

        for(i in splitted){
            if(i%2 == 1){
                let add = "["+splitted[i]+","+splitted[i-1]+"],";
                console.log(i+" "+add);
                result += add;
            }
        }

        result += "]";

        //console.log(result);
        
        //var json = JSON.stringify(outerbounds);
        fs.writeFile('myjsonfile.json', result, 'utf8');
      
      
      });
}

parseXMLJSON();