const topology = require('fully-connected-topology');
const { exit } = process;
const { extractPeersAndMyPort, toLocalIp, getPeerIps, extractPortFromIp } = require('./utils/p2p-functions.js');
const { Wallet } = require('./utils/wallet.js');
const { ERROR_MESSAGE, EXIT_MESSAGE, FULL_NODES_PEER } = require('./utils/constants.js');

const { me, peers } = extractPeersAndMyPort();
const myIp = toLocalIp(me);
const peerIps = getPeerIps(peers);
const wallet = new Wallet();
let message;

console.log('My wallet details:');
console.log('Private Key:', wallet.privateKey);
console.log('Public Key:', wallet.publicKey);

//connect to peers
topology(myIp, peerIps).on('connection', (socket, peerIp) => {
    const peerPort = extractPortFromIp(peerIp);

    if (peerPort === FULL_NODES_PEER)
        socket.write(JSON.stringify(wallet));

    socket.on('data', data => {
        message = data.toString('utf8');
        if (message.toString().includes(ERROR_MESSAGE)) {
            console.log('\x1b[41m%s\x1b[0m', extractErrorFromMessage(message));
        } else {
            console.log(message);
            if (message === EXIT_MESSAGE)
                exit(0);
        }
    });
});

function extractErrorFromMessage(message) {
    return message.toString().slice(ERROR_MESSAGE.length);
}