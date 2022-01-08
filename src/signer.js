import * as cardano from '@emurgo/cardano-serialization-lib-nodejs'
import {bytesToHex, hexToBytes} from "./utils.js";

/**
 * @return {cardano.Bip32PrivateKey}
 */
export function generateKey() {
  return cardano.Bip32PrivateKey.generate_ed25519_bip32();
}

/**
 * @param keyHex {string}
 */
export function printKey({keyHex}) {
  const key = cardano.Bip32PrivateKey.from_bytes(hexToBytes(keyHex));

  const paymentKey = key.derive(0).derive(0).to_raw_key();
  const stakeKey = key.derive(2).derive(0).to_raw_key();
  const paymentKeyHash = paymentKey.to_public().hash();
  const stakeKeyHash = stakeKey.to_public().hash();
  const paymentAddr = cardano.BaseAddress.new(
    cardano.NetworkInfo.mainnet().network_id(),
    cardano.StakeCredential.from_keyhash(paymentKeyHash),
    cardano.StakeCredential.from_keyhash(stakeKeyHash)
  )
  const paymentAddrTestnet = cardano.BaseAddress.new(
    cardano.NetworkInfo.testnet().network_id(),
    cardano.StakeCredential.from_keyhash(paymentKeyHash),
    cardano.StakeCredential.from_keyhash(stakeKeyHash)
  )

  console.log({
    'chaincode': bytesToHex(key.chaincode()),
    'secret': bytesToHex(key.to_raw_key()),
    networkId: cardano.NetworkInfo.mainnet().network_id(),
    paymentAddrHex: bytesToHex(paymentAddr.to_address().to_bytes()),
    paymentKey: bytesToHex(paymentKey.as_bytes()),
    paymentPublicKey: bytesToHex(paymentKey.to_public().as_bytes()),
    paymentPublicKeyHash: bytesToHex(paymentKey.to_public().hash().to_bytes()),
    paymentAddrTestnet: paymentAddrTestnet.to_address().to_bech32(),
    paymentAddr: paymentAddr.to_address().to_bech32(),
    stakeKey: bytesToHex(stakeKey.as_bytes()),
    bip32: bytesToHex(key.as_bytes()),
    bech32: key.to_bech32(),
  })
}

/**
 * @param keyHex {string}
 * @param tx {cardano.Transaction}
 * @return {cardano.TransactionWitnessSet}
 */
export function signTx({keyHex, tx}) {
  const key = cardano.Bip32PrivateKey.from_bytes(hexToBytes(keyHex));
  const paymentKey = key.derive(0).derive(0).to_raw_key();

  const txWitnessSet = cardano.TransactionWitnessSet.new();
  const vkeyWitnesses = cardano.Vkeywitnesses.new();
  const txHash = cardano.hash_transaction(tx.body());

  const vkey = cardano.make_vkey_witness(txHash, paymentKey);
  vkeyWitnesses.add(vkey);
  txWitnessSet.set_vkeys(vkeyWitnesses);

  console.log('SIGNATURE', bytesToHex(txWitnessSet.to_bytes()));

  return txWitnessSet;
}

/**
 * @param keyHex {string}
 * @param data {string}
 * @return {string}
 */
export function signData({keyHex, data}) {
  const key = cardano.Bip32PrivateKey.from_bytes(hexToBytes(keyHex));
  const paymentKey = key.derive(0).derive(0).to_raw_key();
  const signature = paymentKey.sign(hexToBytes(data));
  return bytesToHex(signature.to_bytes());
}


/**
 * @param keyHex {string}
 * @param tx {cardano.Transaction}
 * @return {cardano.Vkeywitness}
 */
export function signTxPartial({keyHex, tx}) {
  const key = cardano.Bip32PrivateKey.from_bytes(hexToBytes(keyHex));
  const paymentKey = key.derive(0).derive(0).to_raw_key();


  const txHash = cardano.hash_transaction(tx.body());
  console.log('BODY', bytesToHex(tx.body().to_bytes()))
  console.log('TXHASH', bytesToHex(txHash.to_bytes()))
  console.log('SIGNATURE', bytesToHex(paymentKey.sign(txHash.to_bytes()).to_bytes()));

  const vkey = cardano.make_vkey_witness(txHash, paymentKey);
  console.log('VKEYWITNESS', bytesToHex(vkey.to_bytes()));
  return vkey;
}

/**
 * @param keyHex {string}
 * @return {cardano.PublicKey}
 */
export function getPubkey({keyHex}) {
  const key = cardano.Bip32PrivateKey.from_bytes(hexToBytes(keyHex));
  const paymentKey = key.derive(0).derive(0).to_raw_key();
  return paymentKey.to_public();
}
