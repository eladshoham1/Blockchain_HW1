const { MerkleTree } = require('merkletreejs');
const crypto = require('crypto');

function sha256(data) {
 return crypto.createHash('sha256').update(data).digest();
}

const leaves = ['a', 'b', 'c'].map(x => sha256(x));

const tree = new MerkleTree(leaves, sha256);
const root = tree.getRoot().toString('hex');
const leaf = sha256('a');
const proof = tree.getProof(leaf);
console.log(tree.verify(proof, leaf, root)); // true

const badLeaves = ['a', 'x', 'c'].map(x => sha256(x));
const badTree = new MerkleTree(badLeaves, sha256);
const badRoot = badTree.getRoot().toString('hex');
const badLeaf = sha256('y');
const badProof = badTree.getProof(badLeaf);
console.log(tree.verify(badProof, badLeaf, badRoot)); // false