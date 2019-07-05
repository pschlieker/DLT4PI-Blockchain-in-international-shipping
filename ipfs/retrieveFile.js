
const ipfsAPI = require('ipfs-api');
const readline = require('readline');
const fs = require('fs');

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
            console.log(`The file "${CID}" will be downloaded from IPFS.`);
            rl.close();

            ipfs.files.get(CID, function (err, files) {
                files.forEach((file) => {
                  console.log(file.path)
                  console.log(file.content.toString('utf8'))
                })
            })
        });         
        
    } catch (error) {
        console.error(`Failed to download file: ${error}`);
        process.exit(1);
    }
}
    
main();
    
