const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const { INITIAL_WALLET_VALUE } = require('./constants');

class Wallet {
    constructor() {
        this.key = ec.genKeyPair();
        this.publicKey = this.key.getPublic('hex');
        this.privateKey = this.key.getPrivate('hex');
        this.balance = INITIAL_WALLET_VALUE;
    }
}

module.exports.Wallet = Wallet;