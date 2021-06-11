/* eslint-disable no-bitwise */
import CryptoES from "crypto-es";
// import * as CryptoJs from "crypto-js";
import { bytesToInt32Array, hexStringToBytes, int32ArrayToBytes } from "./byte";

export function bytesToWordArray(data: Uint8Array): CryptoES.lib.WordArray {
  // return CryptoES.lib.WordArray.create(Array.from(bytesToInt32Array(data)));
  return CryptoES.lib.WordArray.create(data);
}

export function wordArrayToBytes(wordArray: CryptoES.lib.WordArray): Uint8Array {
  return int32ArrayToBytes(wordArray.words).slice(0, wordArray.sigBytes);
}

export function md5(data: Uint8Array | CryptoES.lib.WordArray): CryptoES.lib.WordArray {
  if (data instanceof Uint8Array) {
    data = bytesToWordArray(data);
  }    
  const result = CryptoES.MD5(data);
  return result;
}

export function rc4(data: Uint8Array | CryptoES.lib.WordArray, 
  key: Uint8Array | CryptoES.lib.WordArray): CryptoES.lib.WordArray {
  if (data instanceof Uint8Array) {
    data = bytesToWordArray(data);
  }
  if (key instanceof Uint8Array) {
    key = bytesToWordArray(key);
  }   
  const result = CryptoES.RC4.encrypt(data, key).ciphertext;
  return result;
}

export function aes(data: Uint8Array | CryptoES.lib.WordArray, 
  key: Uint8Array | CryptoES.lib.WordArray, decrypt = false): CryptoES.lib.WordArray {
  if (data instanceof Uint8Array) {
    data = bytesToWordArray(data);
  }
  if (key instanceof Uint8Array) {
    key = bytesToWordArray(key);
  }    

  if (decrypt) {
    const ivWordArray = CryptoES.lib.WordArray.create(data.words.slice(0, 4));

    // const result = Crypto.AES.decrypt(data.toString(Crypto.enc.Base64), key, {
    //   mode: Crypto.mode.CBC, 
    //   iv: ivWordArray, 
    //   padding: Crypto.pad.Pkcs7,
    // });

    const d = CryptoES.algo.AES.createDecryptor(key, {
      mode: CryptoES.mode.CBC, 
      iv: ivWordArray, 
      padding: CryptoES.pad.Pkcs7,
    });
    const result = d.finalize(data);

    return result;
  } else {
    const ivWordArray = CryptoES.lib.WordArray.random(16);

    // const result = Crypto.AES.encrypt(data, key, {
    //   mode: Crypto.mode.CBC, 
    //   iv: ivWordArray, 
    //   padding: Crypto.pad.Pkcs7,
    // }).ciphertext;

    const e = CryptoES.algo.AES.createEncryptor(key, {
      mode: CryptoES.mode.CBC, 
      iv: ivWordArray, 
      padding: CryptoES.pad.Pkcs7,
    });
    const result = e.finalize(data);

    return result;
  }
}
