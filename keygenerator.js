const Elliptic =require('elliptic').ec;
const ec=new Elliptic('secp256k1');
const keypair=ec.genKeyPair();
console.log("Public key",keypair.getPublic('hex'));
console.log("Private key",keypair.getPrivate('hex'));