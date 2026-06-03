const crypto = require("crypto-js")

//generating access token using username as parameter
class AncryptAndDecrypt {

    static encrypt(text) {
      
        const encrypted = crypto.AES.encrypt(text, process.env.SECRET_KEY).toString();
        return encrypted;

    }

    static decrypt(encryptedText) {

        // Decrypting the data
        const decrypted = crypto.AES.decrypt(encryptedText, process.env.SECRET_KEY).toString(crypto.enc.Utf8)
        return decrypted;
    }
}

module.exports = AncryptAndDecrypt;