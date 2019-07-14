
const ipfsClient  = require('ipfs-http-client');
const fs = require('fs');
const crypto = require('./crypto.js');

module.exports = {
    async uploadFile(filePath) {
        try {
            let ipfs = ipfsClient('localhost', '5001', {protocol: 'http'});
            // Creating buffer for ipfs function to add file to the system
            let fileBuffer = Buffer.from(fs.readFileSync(filePath));
            // Create new random password / key
            let key = crypto.generateKey();
            
            // Encrypt the File Buffer
            let encryptedbuffer = crypto.encryptBuffer(filebuffer,key);
            console.log(`The file was encrypted using the password ${key}`);

            // Upload the file to IPFS
            ipfs.files.add(encryptedbuffer, function (err, file) {
                if (err) { throw new Error(err); }
                fileHash = file[0].hash;
                console.log(`The file was uploaded successfullly and has the hash ${fileHash}`);
                return fileHash;
            });
        } catch (err) {
            throw new Error(`Failed to upload file to IPFS: ${err}`);
        }
    },

    async retrieveFile(hash, password) {
        try {
            let ipfs = ipfsClient('localhost', '5001', {protocol: 'http'});
            // Retrieve file
            ipfs.files.get(hash, function (err, files) {
                if (err) { throw new Error(err); }
                files.forEach((file) => {
                    // Decrypt file
                    let encryptedContent = file.content.toString('utf8');
                    let content = crypto.decryptBuffer(encryptedContent, password);

                    console.log(content.toString('utf8'));
                    return content;
                })
            });
        } catch (err) {
            throw new Error(`Failed to download file: ${error}`);
        }
    }
}
