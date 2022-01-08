import {bytesToHex, hexToBytes, SignedData, utf8Decode} from "./src/utils.js";
import {generateKey, signData} from "./src/signer.js";

const k = generateKey();
console.log('GENERATE', bytesToHex(k.as_bytes()));

const fullKey = '18074e48cbb40021e07e6f4b0a8371a052abff94fb3bd39f3286efb80eaeca521f54a2a40a9762d845ed85b7307a7137e532cd5ccec6e4512410b6b427912bdc63d6118b03da1dffe657def7466e63f9dadd5c152ad1e55db3b62006f24241b0';

/// sign transaction hash
const sig = await signData({
  keyHex: fullKey,
  data: '72ba5fab66157adecd6883f70eed69cf3808ca4179c4fccd62dc6183270cb3ce'
})

console.log('SIGNATURE', sig)



