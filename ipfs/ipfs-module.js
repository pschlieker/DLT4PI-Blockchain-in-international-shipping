
const ipfsClient  = require('ipfs-http-client');
const crypto = require('./crypto.js');

module.exports = {
    /**
     * Encrypts a file using the passed key and uploads it to IPFS
     * The return value is the hash to the file on IPFS and the 
     * key separated by ;
     * @param {buffer} fileBuffer - Buffer containing the file
     * @returns {string} hash;key
     */
    async uploadFile(fileBuffer) {
        try {
            let ipfs = ipfsClient('localhost', '5001', {protocol: 'http'});
      
            // Create new random password / key
            let key = crypto.generateKey();
            
            // Encrypt the File Buffer
            let encryptedbuffer = crypto.encryptBuffer(fileBuffer,key);

            // Upload the file to IPFS
            let results = await ipfs.add(encryptedbuffer);
            fileHash = results[0].hash;
            console.log(`The file was encrypted with the key ${key} and uploaded successfully with the hash ${fileHash}`);
            return fileHash+";"+key;
        } catch (err) {
            throw new Error(`Failed to upload file to IPFS: ${err}`);
        }
    },

    /**
     * Downloads the file by hash from IPFS and decrypts it
     * The return value is the content of the file as buffer
     * @param {string} hashkey - Hash and Key of the file to be downloaded, 
     * separated by ; 
     * @returns {buffer} buffer containing the decrypted file
     */
    async retrieveFile(hashkey) {
        try {
            let ipfs = ipfsClient('localhost', '5001', {protocol: 'http'});
            
            //Separate key from hash
            var [hash, key] = hashkey.split(";");

            // Retrieve file
            let files = await ipfs.get(hash);
            let content = crypto.decryptBuffer(files[0].content, key);
           
            console.log("The file was retrieved and decrypted successfully");
            return content;
        } catch (err) {
            throw new Error(`Failed to download file: ${err}`);
        }
    }
}
