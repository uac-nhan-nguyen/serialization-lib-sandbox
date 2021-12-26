import * as cardano from "@emurgo/cardano-serialization-lib-nodejs";
import {bytesToHex, hexToBytes, SignedData, utf8Decode} from "./src/utils.js";
import {Transaction} from "@emurgo/cardano-serialization-lib-nodejs";
import {deconstructTx} from "./sandbox-deconstruct.js";


function printUtxos(value) {
  for (let i = 0; i < value.length; i++) {
    const utxo = cardano.TransactionUnspentOutput.from_bytes(hexToBytes(value[i]));

    console.log(i)
    console.log('ADDR', utxo.output().address().to_bech32('addr'));
    console.log('UTXO', bytesToHex(utxo.input().transaction_id().to_bytes()));
    console.log('INDEX', utxo.input().index());
    console.log(utxo.output().amount().coin().to_str());
    console.log()

  }
}


export function buildTx({inputs, outputs, fee, auxData}) {

  const txInputs = cardano.TransactionInputs.new();
  for (let i = 0; i < inputs.length; i++) {
    txInputs.add(
      cardano.TransactionInput.new(
        cardano.TransactionHash.from_bytes(hexToBytes(inputs[i].transactionId)),
        inputs[i].index
      )
    );
  }

  const txOutputs = cardano.TransactionOutputs.new();

  for (let i = 0; i < outputs.length; i++) {
    txOutputs.add(
      cardano.TransactionOutput.new(
        cardano.Address.from_bech32(outputs[i].address),
        cardano.Value.new(cardano.BigNum.from_str(outputs[i].amount)),
      ))
  }

  const body = cardano.TransactionBody.new(
    txInputs,
    txOutputs,
    cardano.BigNum.from_str(fee.toString()),
  );

  if (auxData) {
    body.set_auxiliary_data_hash(cardano.hash_auxiliary_data(auxData));
  }

  const tx = cardano.Transaction.new(
    body,
    cardano.TransactionWitnessSet.new(),
    auxData,
  )
  return tx;
}

/**
 *
 * @param tx : Transaction
 * @param signature: string
 * @param aux_data: AuxiliaryData
 */
function buildSignTx(tx, signature, aux_data) {
  const txVkeyWitnesses = cardano.TransactionWitnessSet.from_bytes(hexToBytes(signature));
  // tx.witness_set().set_vkeys(txVkeyWitnesses.vkeys());
  return cardano.Transaction.new(tx.body(), txVkeyWitnesses, aux_data);
}

/// print utxos to set up test
/// use JSON.stringify(await cardano.getUtxos())
const utxos =["8282582012fc6573bb6b912be43d551915c9e1452d52c4794d208513c70da6451b0a4061008258390087b0f19de5536210b8b99f4dce72713fbe8e6047aa2ef022233cb1d66b7ec3e0a041f1e0fe051c5daff9fcd54dd98307ed3702796f5d7da51a05f5e100","8282582096f795fd9480529acf5ea39028ebe26226ba6662614d757392d813471e06d46d008258390087b0f19de5536210b8b99f4dce72713fbe8e6047aa2ef022233cb1d66b7ec3e0a041f1e0fe051c5daff9fcd54dd98307ed3702796f5d7da51a3b9aca00"]
printUtxos(utxos)

const aux_data = cardano.AuxiliaryData.new();
const generalMetadata = cardano.GeneralTransactionMetadata.new();
generalMetadata.insert(cardano.BigNum.from_str('0'), cardano.encode_json_str_to_metadatum('{"website": "https://NFTJam.io"}'))
generalMetadata.insert(cardano.BigNum.from_str('1'), cardano.TransactionMetadatum.new_text('https://NFTJam.io'))
generalMetadata.insert(cardano.BigNum.from_str('3'), cardano.TransactionMetadatum.new_int(cardano.Int.new(cardano.BigNum.from_str('123456789'))))
aux_data.set_metadata(generalMetadata);
const auxBytes = aux_data.to_bytes();

/// take one of the value from available utxo
const from = 100000000;
const to = 3000000;
const fee = 173745;

const tx = buildTx({
  inputs: [
    {
      transactionId: '12fc6573bb6b912be43d551915c9e1452d52c4794d208513c70da6451b0a4061',
      index: 0,
    }
  ],
  outputs: [
    {
      // address: 'addr1qxrmpuvau4fkyy9chx05mnnjwylmarnqg74zaupzyv7tr4nt0mp7pgzp78s0upgutkhlnlx4fhvcxpldxup8jm6a0kjs4j9936',
      address: 'addr_test1qzrmpuvau4fkyy9chx05mnnjwylmarnqg74zaupzyv7tr4nt0mp7pgzp78s0upgutkhlnlx4fhvcxpldxup8jm6a0kjskyc9a9',
      amount: (from - fee - to).toString(), // STRING
    },
    {
      // address: 'addr1q9ws0edc558s2ryg87qr29azjdcn7g3ahyqnwkymh7ggxlz2dj7jzphy5rpnfekgeflvpc2rtk07rgznq7w2ugz9r0pqf3fg4f',
      address: 'addr_test1qpws0edc558s2ryg87qr29azjdcn7g3ahyqnwkymh7ggxlz2dj7jzphy5rpnfekgeflvpc2rtk07rgznq7w2ugz9r0pq285gek',
      amount: to.toString(), // STRING
    },
  ],
  fee: fee.toString(),
  auxData: aux_data,
});

/// for nami to sign
console.log(`await cardano.signTx('${bytesToHex(tx.to_bytes())}')`);


const signature = 'a100818258202c06c53809e08c4f69b11cb6acafda8b92b20b1c3d031b6b3ca4a664724c9aad5840778db81f0aae18f3c1a06bec9d9313eeb21836df778388f68d384d9e34dfc68269a07cb510f969fb0ac83e1a642fccb3ff5ae906b87385af525b48dd6e3a9604'

const tx2 = buildSignTx(tx, signature, cardano.AuxiliaryData.from_bytes(auxBytes));

/// submitransaction with nami
console.log(`await cardano.submitTx('${bytesToHex(tx2.to_bytes())}')`)


