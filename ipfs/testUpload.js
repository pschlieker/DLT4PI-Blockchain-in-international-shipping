const ipfs = require('./ipfs-module');
const fs = require('fs');

// Creating buffer for ipfs function to add file to the system
let fileBuffer = Buffer.from(fs.readFileSync("../ToopShipping/src/assets/pdf/IMO_Declaration_Form.pdf"));
// let fileBuffer = Buffer.from(fs.readFileSync("testfile"));


ipfs.uploadFile(fileBuffer).then((hashkey,err) => {
    console.log(`Return Value of upload: ${hashkey}`);
    console.log(`Error Value of upload: ${err}`)

    ipfs.retrieveFile(hashkey).then((filecontent,errr) => {
        if(filecontent.length > 500){
            console.log(`Return Value of download: Size ${filecontent.length}`);
        }else{
            console.log(`Return Value of download: ${filecontent}`);
        }
        console.log(`Error Value of download: ${errr}`);
    });   
});

