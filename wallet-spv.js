const topology = require('fully-connected-topology');
const { argv, exit } = process;
const { EXIT_MESSAGE } = require('./utils/constants.js');

const { me, peers } = extractPeersAndMyPort();
const myIp = toLocalIp(me);
const peerIps = getPeerIps(peers);
let message;

//connect to peers
topology(myIp, peerIps).on('connection', socket => {
    socket.on('data', data => {
        message = data.toString('utf8');
        if (message === EXIT_MESSAGE) {
            console.log('Bye bye');
            exit(0);
        } else {
            console.log(message);
        }
    });
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