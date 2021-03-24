/* eslint-disable no-bitwise */
// import * as CryptoJs from "crypto-es";
import * as CryptoJs from "crypto-js";
import { bytesToInt32Array, hexStringToBytes, int32ArrayToBytes } from "./byte-functions";

export function toWordArray(data: Uint8Array): CryptoJs.lib.WordArray {
  return CryptoJs.lib.WordArray.create(Array.from(bytesToInt32Array(data)));
  // return CryptoJs.lib.WordArray.create(data);
}

export function wordArrayToBytes(wordArray: CryptoJs.lib.WordArray): Uint8Array {
  return int32ArrayToBytes(wordArray.words).slice(0, wordArray.sigBytes);
}

export function md5(data: Uint8Array | CryptoJs.lib.WordArray): CryptoJs.lib.WordArray {
  if (data instanceof Uint8Array) {
    data = toWordArray(data);
  }    
  const result = CryptoJs.MD5(data);
  return result;
}

export function rc4(data: Uint8Array | CryptoJs.lib.WordArray, 
  key: Uint8Array | CryptoJs.lib.WordArray): CryptoJs.lib.WordArray {
  if (data instanceof Uint8Array) {
    data = toWordArray(data);
  }
  if (key instanceof Uint8Array) {
    key = toWordArray(key);
  }   
  const result = CryptoJs.RC4.encrypt(data, key).ciphertext;
  return result;
}

export function aes(data: Uint8Array | CryptoJs.lib.WordArray, 
  key: Uint8Array | CryptoJs.lib.WordArray, decrypt = false): CryptoJs.lib.WordArray {
  if (data instanceof Uint8Array) {
    data = toWordArray(data);
  }
  if (key instanceof Uint8Array) {
    key = toWordArray(key);
  }    

  if (decrypt) {
    const ivWordArray = CryptoJs.lib.WordArray.create(data.words.slice(0, 4));

    // const result = Crypto.AES.decrypt(data.toString(Crypto.enc.Base64), key, {
    //   mode: Crypto.mode.CBC, 
    //   iv: ivWordArray, 
    //   padding: Crypto.pad.Pkcs7,
    // });

    const d = CryptoJs.algo.AES.createDecryptor(key, {
      mode: CryptoJs.mode.CBC, 
      iv: ivWordArray, 
      padding: CryptoJs.pad.Pkcs7,
    });
    const result = d.finalize(data);

    return result;
  } else {
    const ivWordArray = CryptoJs.lib.WordArray.random(16);

    // const result = Crypto.AES.encrypt(data, key, {
    //   mode: Crypto.mode.CBC, 
    //   iv: ivWordArray, 
    //   padding: Crypto.pad.Pkcs7,
    // }).ciphertext;

    const e = CryptoJs.algo.AES.createEncryptor(key, {
      mode: CryptoJs.mode.CBC, 
      iv: ivWordArray, 
      padding: CryptoJs.pad.Pkcs7,
    });
    const result = e.finalize(data);

    return result;
  }
}
