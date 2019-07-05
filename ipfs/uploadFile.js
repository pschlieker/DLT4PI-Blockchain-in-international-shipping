
const ipfsAPI = require('ipfs-api');
const readline = require('readline');
const fs = require('fs');

let path;
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    try {
        //Connect to ipfs daemon API server
        var ipfs = ipfsAPI('localhost', '5001', {protocol: 'http'});

        //Prompt for filename
        rl.question('Please enter the path to the file to be uploaded: ', (answer) => {
            path = answer;
            console.log(`The file "${path}" will be uploaed to IPFS.`);
            rl.close();

            //Reading file from computer
            let file = fs.readFileSync(path);
            //Creating buffer for ipfs function to add file to the system
            let filebuffer = new Buffer(file);

            //Upload the file
            ipfs.files.add(filebuffer, function (err, file) {
                if (err) {
                console.log(err);
                }
                console.log(`The file was uploaded successfullly and has the hash ${file[0].hash}.`);
                //console.log(file);
            });
        }); 

        
        
    } catch (error) {
        console.error(`Failed to upload new file]: ${error}`);
        process.exit(1);
    }
}
    
main();
    
