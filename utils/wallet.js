const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
//const { INITIAL_WALLET_VALUE } = require('./constants');

class Wallet {
    constructor(privateKey) {
        this.key = ec.keyFromPrivate(privateKey);
        this.privateKey = privateKey;
        this.publicKey = this.key.getPublic('hex');
        //this.balance = INITIAL_WALLET_VALUE;
    }
}

module.exports.Wallet = Wallet;