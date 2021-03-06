const topology = require('fully-connected-topology');
const fs = require('fs');
const { exit } = process;
const { extractPeersAndMyPort, toLocalIp, getPeerIps, extractPortFromIp } = require('./utils/p2p-functions.js');
const { Blockchain, Transaction } = require('./utils/blockchain.js');
const { Wallet } = require('./utils/wallet.js');
const { FIRST_WALLET_SPV,
    SECOND_WALLET_SPV,
    MEM_POOL_FILE,
    MAX_TRANSACTIONS_IN_BLOCK,
    MIN_INTERVAL_TIME, MIN_PEERS,
    MAX_INTERVAL_TIME,
    EXIT_MESSAGE
} = require('./utils/constants.js');

const { me, peers } = extractPeersAndMyPort();
const sockets = {};
const myIp = toLocalIp(me);
const peerIps = getPeerIps(peers);
const blockchain = new Blockchain();
const intervalTime = Math.floor(Math.random() * (MAX_INTERVAL_TIME - MIN_INTERVAL_TIME)) + MIN_INTERVAL_TIME;
const wallets = {};

let memPool = [];
let transactions = [];
let totalWalletsCoins = 0;
let numOftransactions = 0;
let senderPeer;
let recipientPeer;
let amount;
let totalCoins;

fs.readFile(MEM_POOL_FILE, 'utf8', (err, data) => {
    if (err) {
        console.log(err);
        return;
    }
    memPool = JSON.parse(data);
});

wallets[me] = new Wallet();

setInterval(() => {
    if (Object.keys(wallets).length >= MIN_PEERS) {
        for (let i = 0; i < MAX_TRANSACTIONS_IN_BLOCK - 1; i++, numOftransactions++) { // MAX_TRANSACTIONS_IN_BLOCK - 1 because of the transaction that will be add in the mining
            senderPeer = memPool[numOftransactions].fromAddress;
            recipientPeer = memPool[numOftransactions].toAddress;
            amount = Number(memPool[numOftransactions].amount);
    
            try {
                transactions[numOftransactions] = new Transaction(wallets[senderPeer].publicKey, wallets[recipientPeer].publicKey, amount);
                transactions[numOftransactions].signTransaction(wallets[senderPeer].key);
                blockchain.addTransaction(transactions[numOftransactions]);
                sockets[senderPeer].write(`${amount} coins has been sent to ${wallets[recipientPeer].publicKey}`);
                sockets[recipientPeer].write(`${amount} coins were sent to you from ${wallets[senderPeer].publicKey}`);
            } catch (err) {
                sockets[senderPeer].write(err.toString());
            }
        }

        blockchain.minePendingTransaction(wallets[me].publicKey);
        console.log(`Blockchain valid? ${blockchain.isChainValid() ? 'yes' : 'no'}`);
        sockets[FIRST_WALLET_SPV].write(`Balance: ${blockchain.getBalanceOfAddress(wallets[FIRST_WALLET_SPV].publicKey)}`);
        sockets[SECOND_WALLET_SPV].write(`Balance: ${blockchain.getBalanceOfAddress(wallets[SECOND_WALLET_SPV].publicKey)}`);

        if (numOftransactions === memPool.length) {
            Object.keys(sockets).map(socketPeer => sockets[socketPeer].write(EXIT_MESSAGE));
            Object.keys(wallets).map(walletPeer => totalWalletsCoins += blockchain.getBalanceOfAddress(wallets[walletPeer].publicKey));
            totalCoins = blockchain.getTotalMiningAndBurnCoins();
            console.log(`Total coins: ${totalWalletsCoins}`);
            console.log(`Total mining coins: ${totalCoins.miningCoins}`);
            console.log(`Total burn coins: ${totalCoins.burnCoins}`);
            console.log('---------------------------');
            console.log('Bloomfilter search example:');
            console.log('Transaction in bloomfilter?', blockchain.isTransactionExist(transactions[0]));
            console.log('Transaction in bloomfilter?', blockchain.isTransactionExist(new Transaction('123456', '234567', 5)));
            console.log(EXIT_MESSAGE);
            exit(0);
        }
    }
}, intervalTime);

//connect to peers
topology(myIp, peerIps).on('connection', (socket, peerIp) => {
    const peerPort = extractPortFromIp(peerIp);
    sockets[peerPort] = socket;
    
    socket.on('data', data => {
        wallets[peerPort] = new Wallet(JSON.parse(data.toString('utf8')).privateKey);
        socket.write(`Balance: ${blockchain.getBalanceOfAddress(wallets[peerPort].publicKey)}`);
    });
});