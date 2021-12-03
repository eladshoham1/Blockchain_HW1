const topology = require('fully-connected-topology');
const fs = require('fs');
const { argv, exit } = process;
const {
    Blockchain,
    Transaction
} = require('./utils/blockchain.js');
const { FULL_NODES_PEER, MEM_POOL_FILE, MIN_INTERVAL_TIME, MAX_INTERVAL_TIME, EXIT_MESSAGE } = require('./utils/constants.js');
const { Wallet } = require('./utils/wallet.js');

const { me, peers } = extractPeersAndMyPort();
const sockets = {};
const wallets = {};
const myIp = toLocalIp(me);
const peerIps = getPeerIps(peers);
const INTERVAL_TIME = Math.floor(Math.random() * (MAX_INTERVAL_TIME - MIN_INTERVAL_TIME)) + MIN_INTERVAL_TIME;
let blockchain;
let count = 0;
let memPool = [];
let transactionNumber = 0;
let wallet;
let transaction;
let peer;

blockchain = new Blockchain();

fs.readFile(MEM_POOL_FILE, 'utf8', (err, data) => {
    if (err) {
        console.log(err);
        return;
    }
    memPool = JSON.parse(data);
    wallets[me] = new Wallet(memPool[count++]['fromAddress']);
});

if (me === FULL_NODES_PEER) {
    setInterval(() => {
        if (count === 3) {
            peer = transactionNumber % 3 === 0 ? me : extractPortFromIp(peerIps[transactionNumber % 3 - 1]);
            wallet = wallets[peer];
            transaction = new Transaction(wallet.publicKey, memPool[transactionNumber].toAddress, Number(memPool[transactionNumber].amount));
            try {
                transaction.signTransaction(wallet.key);
                blockchain.addTransaction(transaction);
                if (peer !== me) {
                    sockets[peer].write(`${Number(memPool[transactionNumber].amount)} coins has been sent to ${memPool[transactionNumber].toAddress}\n Balance of ${wallet.publicKey} is ${blockchain.getBalanceOfAddress(wallet.publicKey)}`);
                } else {
                    console.log(`${Number(memPool[transactionNumber].amount)} coins has been sent to ${memPool[transactionNumber].toAddress}\n Balance of ${wallet.publicKey} is ${blockchain.getBalanceOfAddress(wallet.publicKey)}`);
                }
            } catch(err) {
                if (peer !== me)
                    sockets[peer].write(err.toString());
                else
                    console.log(err.toString());
            }
            if (transactionNumber >= 3 && transactionNumber % 3 == 0) {
                blockchain.minePendingTransaction(wallets[me].publicKey);
                console.log(`Blockchain valid? ${blockchain.isChainValid() ? 'yes' : 'no'}`);
            }
            transactionNumber++;
            if (transactionNumber === memPool.length) {
                Object.keys(sockets).map(socketPeer => sockets[socketPeer].write(EXIT_MESSAGE));
                let totalCoins = 0;
                Object.keys(wallets).map(wallet => totalCoins += blockchain.getBalanceOfAddress(wallet))
                console.log(`Total coins: ${totalCoins}`);
                console.log(`Total mining coins: ${blockchain.totalMiningCoins}`);
                console.log(`Total burn coins: ${blockchain.totalBurnCoins}`);
                exit(0);
            }
        }
    }, INTERVAL_TIME);
}

//connect to peers
topology(myIp, peerIps).on('connection', (socket, peerIp) => {
    const peerPort = extractPortFromIp(peerIp);
    sockets[peerPort] = socket;
    wallets[peerPort] = new Wallet(memPool[count++]['fromAddress']);
});

//extract ports from process arguments, {me: first_port, peers: rest... }
function extractPeersAndMyPort() {
    return {
        me: argv[2],
        peers: argv.slice(3, argv.length)
    }
}

//'4000' -> 'localhost:4000'
function toLocalIp(port) {
    return `localhost:${port}`;
}

//['4000', '4001'] -> ['localhost:4000', 'localhost:4001']
function getPeerIps(peers) {
    return peers.map(peer => toLocalIp(peer));
}

//'localhost:4000' -> '4000'
function extractPortFromIp(peer) {
    return peer.toString().slice(peer.length - 4, peer.length);
}

//'hello' -> 'myPort:hello'
function formatMessage(message) {
    return `${me}>${message}`;
}

//'4000>hello' -> '4000'
function extractReceiverPeer(message) {
    return message.slice(0, 4);
}

//'4000>hello' -> 'hello'
function extractMessageToSpecificPeer(message) {
    return message.slice(5, message.length);
}
