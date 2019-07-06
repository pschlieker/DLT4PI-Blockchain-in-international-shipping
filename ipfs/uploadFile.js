
const ipfsAPI = require('ipfs-api');
const readline = require('readline');
const fs = require('fs');
const crypto = require('./crypto.js');

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

            //Create new random password / key
            let key = crypto.generateKey();

            //Encrypt Buffer
            let encryptedbuffer = crypto.encryptBuffer(filebuffer,key);
            console.log(`The file was encrypted using the password ${key}`);

            //Upload the file
            ipfs.files.add(encryptedbuffer, function (err, file) {
                if (err) {
                console.log(err);
                }
                console.log(`The file was uploaded successfullly and has the hash ${file[0].hash}`);
            });
            
        }); 

        
        
    } catch (error) {
        console.error(`Failed to upload new file: ${error}`);
        process.exit(1);
    }
}
    
main();
    
