const topology = require('fully-connected-topology');
const { argv } = process;
const fs = require('fs');
const { Transaction, Blockchain } = require('./utils/blockchain.js');
const { Wallet } = require('./utils/wallet.js');
const { MEM_POOL_FILE } = require('./utils/constants');

const { me, peers } = extractPeersAndMyPort();
//const sockets = {};
const address = {};
const myIp = toLocalIp(me);
const peerIps = getPeerIps(peers);

let wallet;
let transaction;

//connect to peers
topology(myIp, peerIps).on('connection', (socket, peerIp) => {
    const peerPort = extractPortFromIp(peerIp);

    wallet = new Wallet();
    address[peerPort] = wallet.publicKey;
    console.log(peerPort, address[peerPort]);
    transaction = new Transaction(wallet.publicKey, address[peerPort], 7);
    transaction.signTransaction(wallet.key);
    /*blockchain.addTransaction(transaction);
    blockchain.minePendingTransaction(wallet.publicKey);
    console.log(`Balance of ${peerPort} is ${blockchain.getBalanceOfAddress(wallet.publicKey)}`);
    console.log(`Blockchain valid? ${blockchain.isChainValid() ? 'yes' : 'no'}`);*/

    /*const receiverPeer = extractReceiverPeer(message);
    if (sockets[receiverPeer]) { //message to specific peer
        if (peerPort === receiverPeer) //write only once
            sockets[receiverPeer]
            sockets[receiverPeer].write(formatMessage(extractMessageToSpecificPeer(message)));
    } else //broadcast message to everyone
        socket.write(formatMessage(message));*/

    /*coin.addTransaction(transaction);
    coin.minePendingTransaction(wallet.publicKey);
    console.log(`Balance of ${peerPort} is ${coin.getBalanceOfAddress(wallet.publicKey)}`);
    console.log(`Blockchain valid? ${coin.isChainValid() ? 'yes' : 'no'}`);*/
    //transactions.push(tx1);
    /*stdin.on('data', data => {

    });*/
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
