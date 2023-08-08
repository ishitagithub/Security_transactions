const crypto=require('crypto');
const secret="ishita";
const Elliptic =require('elliptic').ec;
const ec=new Elliptic('secp256k1');


class Transaction {
  constructor(senderaddress, receiveraddress, amount) {
    this.senderaddress = senderaddress;
    this.receiveraddress = receiveraddress;
    this.amount = amount;
    this.signature = null;
    this.timestamp = Date.now();
  }

  createHash() {
    return crypto.createHmac('sha256', secret)
      .update(this.senderaddress + this.receiveraddress + this.amount + this.LastBlockhash)
      .digest('hex');
  }

  signTransaction(keypair) {
    if (keypair.getPublic('hex') !== this.senderaddress)
      throw new Error('You cannot sign this transaction!!!');
    const hash = this.createHash();
    const sig = keypair.sign(hash, 'base64');
    this.signature = sig.toDER('hex');
  }

  isvalidTransaction() {
    if (this.senderaddress == null)
      return true;
    if (!this.signature)
      return false;
    const keypair = ec.keyFromPublic(this.senderaddress, 'hex');
    return keypair.verify(this.createHash(), this.signature);
  }
}

class Block {
  constructor(id, timestamp, transactions, LastBlockhash) {
    this.id = id;
    this.timestamp = timestamp;
    this.transactions = transactions;
    this.LastBlockhash = LastBlockhash;
    this.change = 0;
    this.hash = this.createHash();
  }

  createHash() {
    return crypto.createHmac('sha256', secret)
      .update(this.change + this.id + this.timestamp + JSON.stringify(this.transactions) + this.LastBlockhash)
      .digest('hex');
  }

  //rewarding minors
  mineTheBlock(difficulty) {
    let hash = "";
    while (hash.substring(0, difficulty) !== "0".repeat(difficulty)) {
      this.change++;
      hash = this.createHash();
    }
    console.log("Mining done.....", hash);
    this.hash = hash;
  }

  isAllTransactionsValid() {
    for (let index = 0; index < this.transactions.length; index++) {
      if (!this.transactions[index].isvalidTransaction())
        return false;
    }
    return true;
  }
}

class Blockchain {
  constructor() {
    this.chain = [this.createGenesisBlock()];
    this.pendingTransactions = [];
    this.miningReward = 100;
    this.difficulty = 2;
  }

  createTransaction(transaction) {
    this.pendingTransactions.push(transaction);
    if (!transaction.isvalidTransaction())
      throw new Error("Your transaction is not valid");
  }

  createGenesisBlock() {
    return new Block(0, Date.now(), {}, "");
  }

  getLastBlockHash() {
    return this.chain[this.chain.length - 1].hash;
  }

  addBlock(index, mineraddress) {
    let block = new Block(index, Date.now(), this.pendingTransactions);
    block.LastBlockhash = this.getLastBlockHash();
    block.mineTheBlock(this.difficulty);
    this.chain.push(block);

    this.pendingTransactions = [new Transaction(null, mineraddress, this.miningReward)];
  }

  getBalance(address) {
    let balance = 0;
    for (let index = 0; index < this.chain.length; index++) {
      const block = this.chain[index];
      for (let index = 0; index < block.transactions.length; index++) {
        const transaction = block.transactions[index];
        if (address === transaction.senderaddress) {
          balance -= transaction.amount;
        }
        if (address === transaction.receiveraddress)
          balance += transaction.amount;
      }
    }
    return balance;
  }

  isValidBlockChain() {
    for (let index = 1; index < this.chain.length; index++) {
      const Block = this.chain[index];
      const newHash = Block.createHash();
      if (!Block.isAllTransactionsValid()) return false;
      if (newHash !== Block.hash) return false;
      if (this.chain[index - 1].hash !== Block.LastBlockhash) return false;
    }
    return true;
  }
}

const keypair = ec.keyFromPrivate('b82443eca4b01c9e193be5f017a972ef5ac5192b4fb0ee95efe1dc8fe3e4b197');
const walletaddress = keypair.getPublic('hex');
let kwkcoin = new Blockchain();

kwkcoin.addBlock(1, walletaddress);

const transaction = new Transaction(walletaddress, 'Ishita', 40);
transaction.signTransaction(keypair);

// Add the transaction to the block
//kwkcoin.chain[1].transactions.push(transaction);
//kwkcoin.chain[1].transactions[0].amount = 10;

console.log(kwkcoin.isValidBlockChain());

/*
kwkcoin.addBlock(new Block(2,Date.now(),{balance:200}));
kwkcoin.addBlock(new Block(3,Date.now(),{balance:300}));

kwkcoin.createTransaction(new Transaction("Ishita","Caitlin",100));
kwkcoin.createTransaction(new Transaction("Caitlin","Ishita",50));
kwkcoin.addBlock(1,"Shivansh");
//kwkcoin.chain[2].data.balance=400;
console.log(kwkcoin);
console.log(kwkcoin.isValidBlockChain());
console.log(kwkcoin.getBalance("Shivansh"));*/
// Verify the entire blockchain for validity and print the result