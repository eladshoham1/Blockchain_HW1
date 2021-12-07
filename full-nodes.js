const topology = require('fully-connected-topology');
const fs = require('fs');
const { exit } = process;
const { extractPeersAndMyPort, toLocalIp, getPeerIps, extractPortFromIp } = require('./utils/p2p-functions.js');
const { Blockchain, Transaction } = require('./utils/blockchain.js');
const { Wallet } = require('./utils/wallet.js');
const { FIRST_WALLET_SPV, SECOND_WALLET_SPV, MEM_POOL_FILE, MAX_TRANSACTIONS_IN_BLOCK, MIN_INTERVAL_TIME, MAX_INTERVAL_TIME, EXIT_MESSAGE } = require('./utils/constants.js');

const { me, peers } = extractPeersAndMyPort();
const sockets = {};
const myIp = toLocalIp(me);
const peerIps = getPeerIps(peers);
const blockchain = new Blockchain();
const INTERVAL_TIME = Math.floor(Math.random() * (MAX_INTERVAL_TIME - MIN_INTERVAL_TIME)) + MIN_INTERVAL_TIME;
const wallets = {};
const wallet = new Wallet();
let memPool = [];
let transaction;
let totalCoins = 0;
let numOftransactions = 0;
let senderPeer;
let recipientPeer;
let amount;

fs.readFile(MEM_POOL_FILE, 'utf8', (err, data) => {
    if (err) {
        console.log(err);
        return;
    }
    memPool = JSON.parse(data);
});

setInterval(() => {
    if (Object.keys(wallets).length >= 2) {
        senderPeer = memPool[numOftransactions].fromAddress;
        recipientPeer = memPool[numOftransactions].toAddress;
        amount = Number(memPool[numOftransactions].amount);
        transaction = new Transaction(wallets[senderPeer].publicKey, wallets[recipientPeer].publicKey, amount);
        try {
            transaction.signTransaction(wallets[senderPeer].key);
            blockchain.addTransaction(transaction);
            sockets[senderPeer].write(`${amount} coins has been sent to ${wallets[recipientPeer].publicKey}`);
            sockets[recipientPeer].write(`${amount} coins were sent to you from ${wallets[senderPeer].publicKey}`);
        } catch (err) {
            sockets[senderPeer].write(err.toString());
        }

        if ((numOftransactions + 1) % (MAX_TRANSACTIONS_IN_BLOCK - 1) === 0) { // MAX_TRANSACTIONS_IN_BLOCK - 1 because of the transaction that will be add in the mining
            blockchain.minePendingTransaction(wallet.publicKey);
            console.log(`Blockchain valid? ${blockchain.isChainValid() ? 'yes' : 'no'}`);
            sockets[FIRST_WALLET_SPV].write(`Balance: ${blockchain.getBalanceOfAddress(wallets[FIRST_WALLET_SPV].publicKey)}`);
            sockets[SECOND_WALLET_SPV].write(`Balance: ${blockchain.getBalanceOfAddress(wallets[SECOND_WALLET_SPV].publicKey)}`);
        }

        numOftransactions++;
        if (numOftransactions === memPool.length) {
            Object.keys(sockets).map(socketPeer => sockets[socketPeer].write(EXIT_MESSAGE));
            Object.keys(wallets).map(walletPeer => totalCoins += blockchain.getBalanceOfAddress(wallets[walletPeer].publicKey));
            totalCoins += blockchain.getBalanceOfAddress(wallet.publicKey);
            console.log(`Total coins: ${totalCoins}`);
            console.log(`Total mining coins: ${blockchain.totalMiningCoins}`);
            console.log(`Total burn coins: ${blockchain.totalBurnCoins}`);
            console.log(`Bye bye`);
            exit(0);
        }
    }
}, INTERVAL_TIME);

//connect to peers
topology(myIp, peerIps).on('connection', (socket, peerIp) => {
    const peerPort = extractPortFromIp(peerIp);
    sockets[peerPort] = socket;
    
    socket.on('data', data => {
        wallets[peerPort] = new Wallet(JSON.parse(data.toString('utf8')).privateKey);
        socket.write(`Balance: ${blockchain.getBalanceOfAddress(wallets[peerPort].publicKey)}`);
    });
});