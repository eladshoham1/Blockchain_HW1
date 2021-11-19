const topology = require('fully-connected-topology')
const { stdin, exit, argv } = process;

const { me, peers } = extractPeersAndMyPort();
const sockets = {};
const myIp = toLocalIp(me);
const peerIps = getPeerIps(peers);

console.log('---------------------');
console.log('Welcome to p2p blockchain!');
console.log('me - ', me);
console.log('peers - ', peers);
console.log('connecting to peers...');

//connect to peers
topology(myIp, peerIps).on('connection', (socket, peerIp) => {
    const peerPort = extractPortFromIp(peerIp);
    console.log('connected to peer - ', peerPort);

    sockets[peerPort] = socket;
    stdin.on('data', data => { //on user input
        const message = data.toString().trim();
        if (message === 'exit') { //on exit
            console.log('Bye bye');
            exit(0);
        }

        const receiverPeer = extractReceiverPeer(message);
        if (sockets[receiverPeer]) { //message to specific peer
            if (peerPort === receiverPeer) //write only once
                sockets[receiverPeer].write(formatMessage(extractMessageToSpecificPeer(message)));
        } else //broadcast message to everyone
            socket.write(formatMessage(message));
    })

    //print data when received
    socket.on('data', data => console.log(data.toString('utf8')));
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

//'hello' -> 'myPort:hello'
function formatMessage(message) {
    return `${me}>${message}`;
}

//'localhost:4000' -> '4000'
function extractPortFromIp(peer) {
    return peer.toString().slice(peer.length - 4, peer.length);
}

//'4000>hello' -> '4000'
function extractReceiverPeer(message) {
    return message.slice(0, 4);
}

//'4000>hello' -> 'hello'
function extractMessageToSpecificPeer(message) {
    return message.slice(5, message.length);
}