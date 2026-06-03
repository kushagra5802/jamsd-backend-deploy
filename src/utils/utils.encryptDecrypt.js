const CryptoJS = require("crypto-js");

class EncryptDecrypt {

    constructor() {
        this.cipher;
    }


    // ENCRYPT
    static crypt(text) {

        let cipher = CryptoJS.AES.encrypt(text, process.env.SECRET_KEY);
        cipher = cipher.toString();
        return cipher;
    }

    // DECRYPT
    static decrypt(text) {
        let decipher = CryptoJS.AES.decrypt(text, process.env.SECRET_KEY);
        decipher = decipher.toString(CryptoJS.enc.Utf8);
        return decipher;
    }

    // console.log('hide: ',crypt("500xsec0033"));
    // console.log('show: ',decrypt());

}

module.exports = EncryptDecrypt;
