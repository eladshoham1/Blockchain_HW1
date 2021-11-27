const MerkleTree = require('merkletreejs');
const crypto = require('crypto'); 

function sha256(data) {
    // returns Buffer
    return crypto.createHash('sha256').update(data).digest();
}

const leaves = ['a', 'b', 'c'].map(x => sha256(x)); 
const tree = new MerkleTree(leaves, sha256);
const proof = tree.getProof(leaves[2], 2);

/*
const root = tree.getRoot()
const proof = tree.getProof(leaves[2])
const verified = tree.verify(proof, leaves[2], root)

*/