import { MD5, RC4, AES } from "crypto-js";
import { CryptMethod, CryptRevision, CryptVersion } from "../common/const";

/**
 * Pad or truncate the password string to exactly 32 bytes. 
 * If the password string is more than 32 bytes long, 
 * use only its first 32 bytes; 
 * if it is less than 32 bytes long, pad it by appending 
 * the required number of additional bytes 
 * from the beginning of the following padding string
 */
const PASSWORD_32_PADDING = [
  0x28, 0xBF, 0x4E, 0x5E, 0x4E, 0x75, 0x8A, 0x41, 
  0x64, 0x00, 0x4E, 0x56, 0xFF, 0xFA, 0x01, 0x08,
  0x2E, 0x2E, 0x00, 0xB6, 0xD0, 0x68, 0x3E, 0x80,
  0x2F, 0x0C, 0xA9, 0xFE, 0x64, 0x53, 0x69, 0x7A
] as const;

export interface CryptorOptions {
  filter: string;
  version: CryptVersion;
  revision: CryptRevision;
  permissions: number;

  stringKeyLength?: number;
  streamKeyLength?: number;

  stringMethod?: CryptMethod;
  streamMethod?: CryptMethod;
  
  oPasswordHash: Uint8Array;
  uPasswordHash: Uint8Array;
  
  oEncPasswordHash?: Uint8Array;
  uEncPasswordHash?: Uint8Array;
  perms?: Uint8Array;

  oPassword?: string;
  uPassword?: string;
}

export interface DataCryptor {
  encrypt(data: Uint8Array): Uint8Array;
  decrypt(data: Uint8Array): Uint8Array;
}

class RC4DataCryptor implements DataCryptor {

  constructor() {

  }

  encrypt(data: Uint8Array): Uint8Array {
    return null;
  }

  decrypt(data: Uint8Array): Uint8Array {
    return null;
  }  
}

class AESDataCryptor implements DataCryptor {

  constructor() {

  }

  encrypt(data: Uint8Array): Uint8Array {
    return null;
  }

  decrypt(data: Uint8Array): Uint8Array {
    return null;
  }  
}

class IdentityDataCryptor implements DataCryptor {

  constructor() {

  }

  encrypt(data: Uint8Array): Uint8Array {
    return data;
  }

  decrypt(data: Uint8Array): Uint8Array {
    return data;
  }  
}


export class DataCryptorFactory {  

  static createDataCryptor(options: CryptorOptions): 
  {stringCryptor: DataCryptor; streamCryptor: DataCryptor} {
    const { filter, version, revision, permissions,
      oPasswordHash, uPasswordHash, oPassword, uPassword } = options;

    // const oPasswordPadded = oPassword
    //   ? this.padPassword32(oPassword)
    //   : PASSWORD_PADDING;
    // const uPasswordPadded = uPassword
    //   ? this.padPassword32(uPassword)
    //   : PASSWORD_PADDING;

    if (filter !== "/Standard") {
      throw new Error("Unsupported filter name");
    }

    const keyLength = options.stringKeyLength || 40;
    switch (version) {
      case 1:
        if (keyLength !== 40) {
          throw new Error(`Invalid key length: ${keyLength} (shall be 40)`);
        }
        const rc4_40 = new RC4DataCryptor();
        return {stringCryptor: rc4_40, streamCryptor: rc4_40};
      case 2:
        if (keyLength < 40 || keyLength > 128) {
          throw new Error(`Invalid key length: ${keyLength} (shall be in range from 40 to 128)`);
        }
        const rc4_128 = new RC4DataCryptor();
        return {stringCryptor: rc4_128, streamCryptor: rc4_128};
      case 4:
        
        return null;
      case 5:
        
        return null;
      default:
        throw new Error("Unsupported algorithm version");
    }

    return null;
  }

  protected static padPassword32(password: string): Uint8Array {
    const bytes = new TextEncoder().encode(password);

    const padded = new Uint8Array(32);
    padded.set(bytes.slice(0, 32));

    if (bytes.length < 32) {
      padded.set(PASSWORD_32_PADDING.slice(0, 32 - bytes.length), bytes.length);
    }

    return padded;
  }
}
