var crypto = require('crypto');
var algorithm = 'aes-256-cbc';

module.exports = {
    generateKey: function(){
        return crypto.randomBytes(16).toString('hex');
    },
    
    encryptBuffer: function (buffer, password){
        var cipher = crypto.createCipher(algorithm,password)
        var crypted = Buffer.concat([cipher.update(buffer),cipher.final()]);
        return crypted;
    },
       
    decryptBuffer: function (buffer, password){
        var decipher = crypto.createDecipher(algorithm,password)
        var dec = Buffer.concat([decipher.update(buffer) , decipher.final()]);
        return dec;
    },

    // Currently not needed since we only use buffers
    encrypt: function(text, password){
        var cipher = crypto.createCipher(algorithm,password)
        var crypted = cipher.update(text,'utf8','hex')
        crypted += cipher.final('hex');
        return crypted;
    },
       
    // Currently not needed since we only use buffers
    decrypt: function(text, password){
        var decipher = crypto.createDecipher(algorithm,password)
        var dec = decipher.update(text,'hex','utf8')
        dec += decipher.final('utf8');
        return dec;
      }
};
