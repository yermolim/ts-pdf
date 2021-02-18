import { codes } from "../../codes";
import { AuthEvent, authEvents, CryptMethod, cryptMethods, dictTypes, valueTypes } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { HexString } from "../strings/hex-string";
import { PdfDict } from "../core/pdf-dict";

export class CryptFilterDict extends PdfDict {
  /**
   * (Optional) The method used, if any, by the conforming reader to decrypt data. 
   * The following values shall be supported: 
   * 
   * [None] The application shall not decrypt data but shall direct the input stream 
   * to the security handler for decryption. 
   * 
   * [V2] The application shall ask the security handler for the encryption key and shall implicitly decrypt data
   *  with "Algorithm 1: Encryption of data using the RC4 or AES algorithms", using the RC4 algorithm. 
   * 
   * [AESV2](PDF 1.6+) The application asks the security handler for the encryption key 
   * and implicitly decrypts data with Algorithm 3.1, using the AES-128 algorithm 
   * in Cipher Block Chaining (CBC) with padding mode with a 16-byte block size 
   * and an initialization vector that is randomly generated and placed as the first 16 bytes 
   * in the stream or string. The key size (Length) shall be 128 bits 
   * 
   * [AESV3](PDF 2.0+) The application asks the security handler for the encryption key 
   * and implicitly decrypts data with Algorithm 3.1a, using the AES-256 algorithm 
   * in Cipher Block Chaining (CBC) with padding mode with a 16-byte block size 
   * and an initialization vector that is randomly generated and placed as the first 16 bytes 
   * in the stream or string. The key size (Length) shall be 256 bits
   * 
   * When the value is V2, AESV2, or AESV3, the application may ask once for this encryption key 
   * and cache the key for subsequent use for streams that use the same crypt filter. 
   * Therefore, there shall be a one-to-one relationship between a crypt filter name 
   * and the corresponding encryption key. Only the values listed here shall be supported. 
   * Applications that encounter other values shall report that the file is encrypted with an unsupported algorithm
   */
  CFM: CryptMethod = cryptMethods.NONE;
  /**
   * (Optional) The event to be used to trigger the authorization that is required 
   * to access encryption keys used by this filter. If authorization fails, 
   * the event shall fail. Valid values shall be:
   * 
   * [DocOpen]: Authorization shall be required when a document is opened.
   * [EFOpen]: Authorization shall be required when accessing embedded files.
   * 
   * If this filter is used as the value of StrF or StmF in the encryption dictionary, 
   * the conforming reader shall ignore this key and behave as if the value is DocOpen
   */
  AuthEvent: AuthEvent = authEvents.DOC_OPEN;
  /** 
   * (Optional) The bit length of the encryption key. 
   * It shall be a multiple of 8 in the range of 40 to 256. 
   * Security handlers may define their own use of the Length entry 
   * and should use it to define the bit length of the encryption key. 
   * Standard security handler expresses the length in multiples of 8 (16 means 128) 
   * and public-key security handler expresses it as is (128 means 128)
   * */
  Length = 40;
  /** 
   * (Optional; used only by crypt filters that are referenced from StmF in an encryption dictionary) 
   * Indicates whether the document-level metadata stream shall be encrypted. 
   * Conforming readers shall respect this value when determining whether metadata shall be encrypted. 
   * The value of the EncryptMetadata entry is set by the security handler rather than the conforming reader
  */
  EncryptMetadata = true;
  /** 
   * (Required for public-key security handlers) If the crypt filter is referenced from StmF or StrF 
   * in the encryption dictionary, this entry shall be an array of byte strings, 
   * where each string shall be a binary-encoded PKCS#7 object that shall list recipients 
   * that have been granted equal access rights to the document. The enveloped data 
   * contained in the PKCS#7 object shall include both a 20-byte seed value that 
   * shall be used to compute the encryption key followed by 4 bytes of permissions settings 
   * that shall apply to the recipient list. There shall be only one object 
   * per unique set of access permissions. If a recipient appears in more than one list, 
   * the permissions used shall be those in the first matching list. If the crypt filter 
   * is referenced from a Crypt filter decode parameter dictionary, this entry 
   * shall be a string that shall be a binary-encoded PKCS#7 object shall contain 
   * a list of all recipients who are permitted to access the corresponding encrypted stream. 
   * The enveloped data contained in the PKCS#7 object shall be a 20-byte seed value 
   * that shall be used to create the encryption key that shall be used by the algorithm 
   * in "Algorithm 1: Encryption of data using the RC4 or AES algorithms"
   * */
  Recipients: HexString | HexString[];
  
  constructor() {
    super(dictTypes.CRYPT_FILTER);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<CryptFilterDict> {    
    const cryptFilter = new CryptFilterDict();
    const parseResult = cryptFilter.tryParseProps(parseInfo);

    return parseResult
      ? {value: cryptFilter, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray();  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.CFM) {
      bytes.push(...encoder.encode("/CFM"), ...encoder.encode(this.CFM));
    }
    if (this.AuthEvent) {
      bytes.push(...encoder.encode("/AuthEvent"), ...encoder.encode(this.AuthEvent));
    }
    if (this.Length) {
      bytes.push(...encoder.encode("/Length"), ...encoder.encode(" " + this.Length));
    }
    if (this.EncryptMetadata) {
      bytes.push(...encoder.encode("/EncryptMetadata"), ...encoder.encode(" " + this.EncryptMetadata));
    }
    if (this.Recipients) {
      if (this.Recipients instanceof HexString) {
        bytes.push(...encoder.encode("/Recipients"), ...this.Recipients.toArray());
      } else {        
        bytes.push(codes.L_BRACKET);
        this.Recipients.forEach(x => bytes.push(...x.toArray()));
        bytes.push(codes.R_BRACKET);
      }
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected tryParseProps(parseInfo: ParseInfo): boolean {
    const superIsParsed = super.tryParseProps(parseInfo);
    if (!superIsParsed) {
      return false;
    }

    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    let i = parser.skipToNextName(start, end - 1);
    if (i === -1) {
      // no required props found
      return false;
    }
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/CFM":
            const method = parser.parseNameAt(i, true);
            if (method && (<string[]>Object.values(cryptMethods))
              .includes(method.value)) {
              this.CFM = <CryptMethod>method.value;
              i = method.end + 1;              
            } else {              
              throw new Error("Can't parse /CFM property value");
            }
            break;   
          case "/AuthEvent":
            const authEvent = parser.parseNameAt(i, true);
            if (authEvent && (<string[]>Object.values(authEvents))
              .includes(authEvent.value)) {
              this.AuthEvent = <AuthEvent>authEvent.value;
              i = authEvent.end + 1;              
            } else {              
              throw new Error("Can't parse /AuthEvent property value");
            }
            break;
          case "/Length":
            const length = parser.parseNumberAt(i, false);
            if (length) {
              this.Length = length.value;
              i = length.end + 1;
            } else {              
              throw new Error("Can't parse /Length property value");
            }
            break;
          case "/EncryptMetadata":
            const encrypt = parser.parseBoolAt(i, false);
            if (encrypt) {
              this.EncryptMetadata = encrypt.value;
              i = encrypt.end + 1;
            } else {              
              throw new Error("Can't parse /EncryptMetadata property value");
            }
            break;
          case "/Recipients":            
            const entryType = parser.getValueTypeAt(i);
            if (entryType === valueTypes.STRING_HEX) {  
              const recipient = HexString.parse(parser, i);  
              if (recipient) {
                this.Recipients = recipient.value;
                i = recipient.end + 1;
                break;
              } else {                               
                throw new Error("Can't parse /Recipients property value");
              }
            } else if (entryType === valueTypes.ARRAY) {              
              const recipients = HexString.parseArray(parser, i);
              if (recipients) {
                this.Recipients = recipients.value;
                i = recipients.end + 1;
                break;
              } else {                  
                throw new Error("Can't parse /Recipients property value");
              }
            }
            throw new Error(`Unsupported /Filter property value type: ${entryType}`);
          default:
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };

    return true;
  }
}
