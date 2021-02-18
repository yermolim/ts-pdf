/* eslint-disable no-bitwise */
import Crypto from "crypto-es";
import { bytesToInt32Array, hexStringToBytes, int32ArrayToBytes } from "./byte-functions";

export function toWordArray(data: Uint8Array): Crypto.lib.WordArray {
  // return Crypto.lib.WordArray.create(Array.from(bytesToInt32Array(data)));
  return Crypto.lib.WordArray.create(data);
}

export function wordArrayToBytes(wordArray: Crypto.lib.WordArray): Uint8Array {
  return int32ArrayToBytes(wordArray.words).slice(0, wordArray.sigBytes);
}

export function md5(data: Uint8Array | Crypto.lib.WordArray): Crypto.lib.WordArray {
  if (data instanceof Uint8Array) {
    data = toWordArray(data);
  }    
  const result = Crypto.MD5(data);
  return result;
}

export function rc4(data: Uint8Array | Crypto.lib.WordArray, 
  key: Uint8Array | Crypto.lib.WordArray): Crypto.lib.WordArray {
  if (data instanceof Uint8Array) {
    data = toWordArray(data);
  }
  if (key instanceof Uint8Array) {
    key = toWordArray(key);
  }   
  const result = Crypto.RC4.encrypt(data, key).ciphertext;
  return result;
}

export function aes(data: Uint8Array | Crypto.lib.WordArray, 
  key: Uint8Array | Crypto.lib.WordArray, decrypt = false): Crypto.lib.WordArray {
  if (data instanceof Uint8Array) {
    data = toWordArray(data);
  }
  if (key instanceof Uint8Array) {
    key = toWordArray(key);
  }    

  if (decrypt) {
    const ivWordArray = Crypto.lib.WordArray.create(data.words.slice(0, 4));

    // const result = Crypto.AES.decrypt(data.toString(Crypto.enc.Base64), key, {
    //   mode: Crypto.mode.CBC, 
    //   iv: ivWordArray, 
    //   padding: Crypto.pad.Pkcs7,
    // });

    const d = Crypto.algo.AES.createDecryptor(key, {
      mode: Crypto.mode.CBC, 
      iv: ivWordArray, 
      padding: Crypto.pad.Pkcs7,
    });
    const result = d.finalize(data);

    return result;
  } else {
    const ivWordArray = Crypto.lib.WordArray.random(16);

    // const result = Crypto.AES.encrypt(data, key, {
    //   mode: Crypto.mode.CBC, 
    //   iv: ivWordArray, 
    //   padding: Crypto.pad.Pkcs7,
    // }).ciphertext;

    const e = Crypto.algo.AES.createEncryptor(key, {
      mode: Crypto.mode.CBC, 
      iv: ivWordArray, 
      padding: Crypto.pad.Pkcs7,
    });
    const result = e.finalize(data);

    return result;
  }
}
