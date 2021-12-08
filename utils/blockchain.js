const SHA256 = require("crypto-js/sha256");
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');
const { MerkleTree } = require('merkletreejs');
const { PartitionedBloomFilter } = require('bloom-filters');
const { BLOOM_FILTER_SIZE,
    HASH_FUNCTIONS,
    LOAD_FACTOR,
    DIFFICULTY,
    MINING_REWARD,
    INITIAL_WALLET_VALUE,
    TRANSACTION_REWARD
} = require('./constants');

class Transaction {
    constructor(fromAddress, toAddress, amount) {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
        this.transactionReward = 0;
        this.burnCoins = 0;
    }

    calculateHash() {
        return SHA256(this.fromAddress + this.toAddress + this.amount + this.timestamp).toString();
    }

    setTransactionReward(transactionReward) {
        this.transactionReward = transactionReward;
    }

    setBurnCoins(burnCoins) {
        this.burnCoins = burnCoins;
    }

    getTotalPayment() {
        return this.amount + this.transactionReward + this.burnCoins;
    }

    signTransaction(signingKey) {
        if (signingKey.getPublic('hex') !== this.fromAddress)
            throw new Error('You cannot sign transaction for other wallets');

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid() {
        if (this.fromAddress === null) 
            return true;

        if (!this.signature || this.signature.length === 0)
            throw new Error('No signature in this transaction');

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

class Block {
    constructor(timestamp, transactions, previousHash = '') {
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.hash = this.calculateHash();
        this.nonce = 0;
        this.setMerkleTree();
        this.setBloomFilter();
    }
    
    setMerkleTree() {
        this.merkleTree = new MerkleTree(this.transactions.map(transaction => SHA256(transaction)), SHA256);
        this.merkleRoot = this.merkleTree.getRoot().toString('hex');
    }
    
    setBloomFilter() {
        this.bloomfilter = new PartitionedBloomFilter(BLOOM_FILTER_SIZE, HASH_FUNCTIONS, LOAD_FACTOR);
        for (const trans of this.transactions)
            this.bloomfilter.add(trans.calculateHash());
    }

    calculateHash() {
        return SHA256(this.previousHash + this.timestamp + this.merkleRoot + this.nonce).toString();
    }

    mineBlock(difficulty) {
        while (this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0')) {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined", this.hash);
    }

    isTransactionInMerkleTree(transaction) {
        return this.bloomfilter.has(transaction.calculateHash());
    }

    proofOfWork(transaction) {
        if (!this.isTransactionInMerkleTree(transaction))
            return false;

        const leaf = SHA256(transaction);
        const proof = this.merkleTree.getProof(leaf);
        return this.merkleTree.verify(proof, leaf, this.merkleRoot);
    }

    hasValidTransactions() {
        for (const transaction of this.transactions) {
            if (!transaction.isValid() || !this.proofOfWork(transaction))
                return false;
        }

        return true;
    }
}

class Blockchain {
    constructor() {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = DIFFICULTY;
        this.pendingTransactions = [];
        this.miningReward = MINING_REWARD;
    }

    createGenesisBlock() {
        return new Block(Date.now(), [], '0');
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransaction(miningRewardAddress) {
        let minerReward = 0;
        this.pendingTransactions.map(trans => minerReward += trans.transactionReward);
        const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward + minerReward);
        this.pendingTransactions.push(rewardTx);
        let block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
        block.mineBlock(this.difficulty);
        console.log('block succefully mined');
        this.chain.push(block);
        this.pendingTransactions = [];
    }

    getBalanceOfAddress(address) {
        let balance = INITIAL_WALLET_VALUE;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                if (trans.fromAddress === address)
                    balance -= trans.getTotalPayment();

                if (trans.toAddress === address)
                    balance += trans.amount;
            }
        }

        return balance;
    }

    getTotalMiningAndBurnCoins() {
        let miningCoins = 0, burnCoins = 0;

        for (const block of this.chain) {
            for (const trans of block.transactions) {
                miningCoins += trans.amount;
                burnCoins += trans.burnCoins;
            }
        }

        return { miningCoins, burnCoins };
    }

    getBalanceOfAddressIncludePending(address) {
        let balance = this.getBalanceOfAddress(address);

        this.pendingTransactions.map(trans => {
            if (trans.fromAddress === address)
                balance -= trans.getTotalPayment();

            if (trans.toAddress === address)
                balance += trans.amount;
        });

        return balance;
    }

    addTransaction(transaction) {
        if (!transaction.fromAddress || !transaction.toAddress)
            throw new Error('Transaction must include from and to address');

        if (!transaction.isValid())
            throw new Error('Cannot add invalid transaction to chain');

        transaction.setBurnCoins(this.chain.length);
        transaction.setTransactionReward(TRANSACTION_REWARD);
        const newBalance = this.getBalanceOfAddressIncludePending(transaction.fromAddress) - transaction.getTotalPayment();
        if (newBalance < 0)
            throw new Error(`${newBalance} coins are missing to complete this transaction`);

        this.pendingTransactions.push(transaction);
    }

    isTransactionExist(transaction) {
        for (const block of this.chain) {
            if (block.isTransactionInMerkleTree(transaction))
                return true;
        }

        return false;
    }

    isChainValid() {
        for (let i = 1; i < this.chain.length; i++) {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if (!currentBlock.hasValidTransactions())
                return false;

            if (currentBlock.hash !== currentBlock.calculateHash())
                return false;

            if (currentBlock.previousHash !== previousBlock.hash)
                return false;
        }
        return true;
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Block = Block;
module.exports.Transaction = Transaction;