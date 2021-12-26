// const {COSESign1, Label} = require("./extra_modules/@emurgo/cardano-message-signing-nodejs");
import {
  Address,
  Ed25519Signature,
  PublicKey,
  BaseAddress,
  StakeCredential,
  RewardAddress
} from '@emurgo/cardano-serialization-lib-nodejs'
import {Buffer} from 'buffer'
import {COSESign1, Label} from "emurgo-message-signing-nodejs";


// Convert a hex string to a byte array
/**
 * @param hex: string
 * @return {Uint8Array}
 */
export function hexToBytes(hex) {
  for (var bytes = [], c = 0; c < hex.length; c += 2)
    bytes.push(parseInt(hex.substr(c, 2), 16));
  return bytes;
}

// Convert a byte array to a hex string
export function bytesToHex(bytes) {
  for (var hex = [], i = 0; i < bytes.length; i++) {
    var current = bytes[i] < 0 ? bytes[i] + 256 : bytes[i];
    hex.push((current >>> 4).toString(16));
    hex.push((current & 0xF).toString(16));
  }
  return hex.join("");
}

export function hexToString(hexx) {
  var hex = hexx.toString();//force conversion
  var str = '';
  for (var i = 0; i < hex.length; i += 2)
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  return str;
}

export function utf8Decode(value){
  return decodeURIComponent(escape(value));
}

export function utf8Encode(value) {
  return unescape(encodeURIComponent(value));
}

function Utf8ArrayToStr(array) {
  var out, i, len, c;
  var char2, char3;

  out = "";
  len = array.length;
  i = 0;
  while(i < len) {
    c = array[i++];
    switch(c >> 4)
    {
      case 0: case 1: case 2: case 3: case 4: case 5: case 6: case 7:
      // 0xxxxxxx
      out += String.fromCharCode(c);
      break;
      case 12: case 13:
      // 110x xxxx   10xx xxxx
      char2 = array[i++];
      out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
      break;
      case 14:
        // 1110 xxxx  10xx xxxx  10xx xxxx
        char2 = array[i++];
        char3 = array[i++];
        out += String.fromCharCode(((c & 0x0F) << 12) |
          ((char2 & 0x3F) << 6) |
          ((char3 & 0x3F) << 0));
        break;
    }
  }

  return out;
}


export class SignedData {
  constructor(signed) {
    const message = COSESign1.from_bytes(Buffer.from(Buffer.from(signed, 'hex'), 'hex'));
    const headermap = message.headers().protected().deserialized_headers();
    this.headers = {
      algorithmId: headermap.algorithm_id().as_int().as_i32(),
      address: Address.from_bytes(headermap.header(Label.new_text('address')).as_bytes()),
      publicKey: PublicKey.from_bytes(headermap.key_id())
    };
    this.payload = message.payload();
    this.signature = Ed25519Signature.from_bytes(message.signature());
		console.log("data")
    this.data = message.signed_data().to_bytes();
		console.log("done")
  }

  verify(address, payload) {
    if (!this.verifyPayload(payload)) {
      // throw new Error('Payload does not match');
      return false;
    }
    if (!this.verifyAddress(address)) {
      // throw new Error('Could not verify because of address mismatch');
      return false
    }
    return this.headers.publicKey.verify(this.data, this.signature);
  };

	getPayloadAsStr() {
    return Utf8ArrayToStr(this.payload)
	}

  verifyPayload(payload) {
    return Utf8ArrayToStr(this.payload) === payload;
  }

  verifyAddress(address) {
    const checkAddress = Address.from_bech32(address);
    if (this.headers.address.to_bech32() !== checkAddress.to_bech32()) {
      console.log('FASLE1');
      return false;
    }
    // check if BaseAddress
    try {
      const baseAddress = BaseAddress.from_address(this.headers.address);
      //reconstruct address
      const paymentKeyHash = this.headers.publicKey.hash();
      const stakeKeyHash = baseAddress.stake_cred().to_keyhash();
      const reconstructedAddress = BaseAddress.new(
        checkAddress.network_id(),
        StakeCredential.from_keyhash(paymentKeyHash),
        StakeCredential.from_keyhash(stakeKeyHash)
      );
      return checkAddress.to_bech32() === reconstructedAddress.to_address().to_bech32();
    } catch (e) {
    }

    try {
      const stakeKeyHash = this.headers.address.hash();
      const reconstructedAddress = RewardAddress.new(
        checkAddress.network_id(),
        StakeCredential.from_keyhash(stakeKeyHash)
      );
      return checkAddress.to_bech32() === reconstructedAddress.to_address().to_bech32();
    } catch (e) {
    }
    return false;
  };
}
