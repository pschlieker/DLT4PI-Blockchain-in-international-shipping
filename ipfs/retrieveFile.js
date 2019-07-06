
const ipfsAPI = require('ipfs-api');
const readline = require('readline');
const fs = require('fs');
const crypto = require('./crypto.js');

let CID;
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

async function main() {
    try {
        //Connect to ipfs daemon API server
        var ipfs = ipfsAPI('localhost', '5001', {protocol: 'http'});

        //Prompt for filename
        rl.question('Please enter the hash of the file to be downloaded: ', (answer) => {
            CID = answer;
            
            //Prompt for password
            rl.question('Please enter the password of the file to be downloaded: ', (password) => {
                console.log(`The file "${CID}" will be downloaded from IPFS.`);
                rl.close();

                //Retrieve file
                ipfs.files.get(CID, function (err, files) {
                    files.forEach((file) => {
                    
                    //Decrypt file
                    let content = crypto.decryptBuffer(file.content, password);

                    //Output result
                    console.log(content.toString('utf8'))
                    })
                });
            });
        });         
        
    } catch (error) {
        console.error(`Failed to download file: ${error}`);
        process.exit(1);
    }
}
    
main();
    
