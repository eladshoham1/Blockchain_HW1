const {
    Blockchain,
    Transaction
} = require('./blockchain.js');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('50c963fdb1557d9caa85be8e8c8846dc31b1af8fb9d2e9e2cdf13d758a325030')
const myWalletAddress = myKey.getPublic('hex');
const micaChain = new Blockchain();
const tx1 = new Transaction(myWalletAddress, 'address2', 7);
tx1.signTransaction(myKey);
micaChain.addTransaction(tx1);
micaChain.minePendingTransaction(myWalletAddress);

console.log();
console.log('Balance of mica is', micaChain.getBalanceOfAddress(myWalletAddress));

const tx2 = new Transaction(myWalletAddress, 'address1', 2);
tx2.signTransaction(myKey);
micaChain.addTransaction(tx2);
micaChain.minePendingTransaction(myWalletAddress);

console.log();
console.log('Balance of mica is', micaChain.getBalanceOfAddress(myWalletAddress));

console.log();
console.log('Blockchain valid?', micaChain.isChainValid() ? 'yes' : 'no');
JSON.stringify(micaChain, null, 4);