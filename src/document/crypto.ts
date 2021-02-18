import Crypto from "crypto-es";
import { bytesToInt32Array } from "./byte-functions";

export const AES_INIT_VALUE = new Uint8Array([
  0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41, 
  0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
]);

export function toWordArray(data: Uint8Array): Crypto.lib.WordArray {
  return Crypto.lib.WordArray.create(Array.from(bytesToInt32Array(data)));
}

export function md5(data: Uint8Array | Crypto.lib.WordArray): Crypto.lib.WordArray {
  if (data instanceof Uint8Array) {
    data = toWordArray(data);
  }    
  // if (data instanceof Uint8Array) {
  //   data = Crypto.lib.WordArray.create(data);
  // }
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
  // if (data instanceof Uint8Array) {
  //   data = Crypto.lib.WordArray.create(data);
  // }
  // if (key instanceof Uint8Array) {
  //   key = Crypto.lib.WordArray.create(key);
  // }
  const result = Crypto.RC4.encrypt(data, key).ciphertext;
  return result;
}

export function aes(data: Uint8Array | Crypto.lib.WordArray, 
  key: Uint8Array | Crypto.lib.WordArray, iv: Uint8Array): Crypto.lib.WordArray {
  if (data instanceof Uint8Array) {
    data = toWordArray(data);
  }
  if (key instanceof Uint8Array) {
    key = toWordArray(key);
  }    
  // if (data instanceof Uint8Array) {
  //   data = Crypto.lib.WordArray.create(data);
  // }
  // if (key instanceof Uint8Array) {
  //   key = Crypto.lib.WordArray.create(key);
  // }
  const ivWordArray = Crypto.lib.WordArray.create(bytesToInt32Array(iv));
  const result = Crypto.AES.encrypt(data, key, { 
    mode: Crypto.mode.CBC, 
    iv: ivWordArray, 
    padding: Crypto.pad.Pkcs7,
  }).ciphertext;
  return result;
}
