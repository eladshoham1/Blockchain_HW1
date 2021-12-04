const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

class Wallet {
    constructor(privateKey = '') {
        if (privateKey === '')
            this.key = ec.genKeyPair();
        else
            this.key = ec.keyFromPrivate(privateKey);
        this.privateKey = this.key.getPrivate('hex');
        this.publicKey = this.key.getPublic('hex');
    }
}

module.exports.Wallet = Wallet;