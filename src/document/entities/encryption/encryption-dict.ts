import { dictTypes } from "../../common/const";
import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { LiteralString } from "../common/literal-string";
import { PdfDict } from "../core/pdf-dict";
import { CryptMapDict } from "./crypt-map-dict";

export class EncryptionDict extends PdfDict {
  /**
   * (Required) The name of the preferred security handler for this document. 
   * It shall be the name of the security handler that was used 
   * to encrypt the document. If SubFilter is not present, 
   * only this security handler shall be used when opening the document. 
   * If it is present, a conforming reader can use any security handler 
   * that implements the format specified by SubFilter
   */
  Filter = "/Standard";
  /**
   * (Optional; PDF 1.3+) A name that completely specifies the format and 
   * interpretation of the contents of the encryption dictionary. 
   * It allows security handlers other than the one specified by Filter 
   * to decrypt the document. If this entry is absent, other security 
   * handlers shall not decrypt the document
   */
  SubFilter: string;
  /** 
   * (Optional) A code specifying the algorithm to be used in encrypting 
   * and decrypting the document: 
   * 
   * - 0 An algorithm that is undocumented. This value shall not be used 
   * - 1 "Algorithm 1: Encryption of data using the RC4 or AES algorithms" 
   * with an encryption key length of 40 bits 
   * - 2 (PDF 1.4+) "Algorithm 1: Encryption of data using the RC4 or AES algorithms"
   * but permitting encryption key lengths greater than 40 bits 
   * - 3 (PDF 1.4+)An unpublished algorithm that permits encryption key lengths 
   * ranging from 40 to 128 bits. This value shall not appear in a conforming PDF file
   * - 4 (PDF 1.5) The security handler defines the use of encryption 
   * and decryption in the document, using the rules specified by the CF, StmF, and StrF entries. 
   * 
   * The default value if this entry is omitted shall be 0, 
   * but when present should be a value of 1 or greater
  */
  V: 0 | 1 | 2 | 3 | 4 = 0;
  /** 
   * (Optional; PDF 1.4+; only if V is 2 or 3) The length of the encryption key, 
   * in bits. The value shall be a multiple of 8, in the range 40 to 128
   * */
  Length = 40;
  /** 
   * (Optional; meaningful only when the value of V is 4; PDF 1.5+) 
   * A dictionary whose keys shall be crypt filter names and 
   * whose values shall be the corresponding crypt filter dictionaries. 
   * Every crypt filter used in the document shall have an entry in this dictionary, 
   * except for the standard crypt filter names
   * */
  CF: CryptMapDict;
  /** 
   * (Optional; meaningful only when the value of V is 4; PDF 1.5+) 
   * The name of the crypt filter that shall be used by default 
   * when decrypting streams. The name shall be a key in the CF dictionary 
   * or a standard crypt filter name. All streams in the document, 
   * except for cross-reference streams or streams that have a Crypt entry 
   * in their Filterarray, shall be decrypted by the security handler, 
   * using this crypt filter
   * */
  StmF = "/Identity";
  /** 
   * (Optional; meaningful only when the value of V is 4; PDF 1.5+) 
   * The name of the crypt filter that shall be used when decrypting all strings 
   * in the document. The name shall be a key in the CF dictionary 
   * or a standard crypt filter name
   * */
  StrF = "/Identity";
  /** 
   * (Optional; meaningful only when the value of V is 4; PDF 1.6+) 
   * The name of the crypt filter that shall be used when encrypting 
   * embedded file streams that do not have their own crypt filter specifier; 
   * it shall correspond to a key in the CF dictionary 
   * or a standard crypt filter name
   * */
  EFF: string;
  
  /** 
   * (Required if /Filter/Standard) A number specifying which revision 
   * of the standard security handler shall be used to interpret this dictionary:
   * 
   * [2] if the document is encrypted with a V value less than 2 
   * and does not have any of the access permissions set to 0 (by means of the P entry, below) 
   * that are designated “Security handlers of revision 3 or greater” 
   * [3] if the document is encrypted with a V value of 2 or 3, 
   * or has any “Security handlers of revision 3 or greater” access permissions set to 0
   * [4] if the document is encrypted with a V value of 4
   * */
  R: 2 | 3 | 4;
  /** 
   * (Required if /Filter/Standard) A 32-byte string, 
   * based on both the owner and user passwords, that shall be used in computing 
   * the encryption key and in determining whether a valid owner password was entered
   * */
  O: LiteralString;
  /** 
   * (Required if /Filter/Standard) A 32-byte string, based on the user password, 
   * that shall be used in determining whether to prompt the user for a password and, 
   * if so, whether a valid user or owner password was entered
   * */
  U: LiteralString;
  /** 
   * (Required if /Filter/Standard) A set of flags specifying which operations 
   * shall be permitted when the document is opened with user access
   * */
  P: number;
  /** 
   * (Optional; meaningful only when the value of V is 4; PDF 1.5+) 
   * Indicates whether the document-level metadata stream shall be encrypted. 
   * Conforming products should respect this value
   * */
  EncryptMetadata = true;
  
  constructor() {
    super(dictTypes.EMPTY);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<EncryptionDict> {    
    const encryption = new EncryptionDict();
    const parseResult = encryption.tryParseProps(parseInfo);

    return parseResult
      ? {value: encryption, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  toArray(): Uint8Array {
    const superBytes = super.toArray();  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Filter) {
      bytes.push(...encoder.encode("/Filter"), ...encoder.encode(this.Filter));
    }
    if (this.SubFilter) {
      bytes.push(...encoder.encode("/SubFilter"), ...encoder.encode(this.SubFilter));
    }
    if (this.V) {
      bytes.push(...encoder.encode("/V"), ...encoder.encode(" " + this.V));
    }
    if (this.Length) {
      bytes.push(...encoder.encode("/Length"), ...encoder.encode(" " + this.Length));
    }
    if (this.CF) {
      bytes.push(...encoder.encode("/CF"), ...this.CF.toArray());
    }
    if (this.StmF) {
      bytes.push(...encoder.encode("/StmF"), ...encoder.encode(this.StmF));
    }
    if (this.StrF) {
      bytes.push(...encoder.encode("/StrF"), ...encoder.encode(this.StrF));
    }
    if (this.EFF) {
      bytes.push(...encoder.encode("/EFF"), ...encoder.encode(this.EFF));
    }
    if (this.R) {
      bytes.push(...encoder.encode("/R"), ...encoder.encode(" " + this.R));
    }
    if (this.O) {
      bytes.push(...encoder.encode("/O"), ...this.O.toArray());
    }
    if (this.U) {
      bytes.push(...encoder.encode("/U"), ...this.U.toArray());
    }
    if (this.P) {
      bytes.push(...encoder.encode("/P"), ...encoder.encode(" " + this.P));
    }
    if (this.EncryptMetadata) {
      bytes.push(...encoder.encode("/EncryptMetadata"), ...encoder.encode(" " + this.EncryptMetadata));
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
          case "/Filter":
            const filter = parser.parseNameAt(i, true);
            if (filter) {
              this.Filter = filter.value;
              i = filter.end + 1;              
            } else {              
              throw new Error("Can't parse /Filter property value");
            }
            break; 
          case "/SubFilter":
            const subFilter = parser.parseNameAt(i, true);
            if (subFilter) {
              this.SubFilter = subFilter.value;
              i = subFilter.end + 1;              
            } else {              
              throw new Error("Can't parse /SubFilter property value");
            }
            break; 
          case "/V":
            const algorithm = parser.parseNumberAt(i, false);
            if (algorithm && ([0, 1, 2, 3, 4].includes(algorithm.value))) {
              this.V = <0 | 1 | 2 | 3 | 4>algorithm.value;
              i = algorithm.end + 1;              
            } else {              
              throw new Error("Can't parse /V property value");
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
          case "/CF":
            const dictBounds = parser.getDictBoundsAt(i);
            if (bounds) {
              const cryptMap = CryptMapDict.parse({parser, bounds: dictBounds});
              if (cryptMap) {
                this.CF = cryptMap.value;
                i = cryptMap.end + 1;
              }
            } else {              
              throw new Error("Can't parse /CF property value");
            }
            break;
          case "/StmF":
            const streamFilter = parser.parseNameAt(i, true);
            if (streamFilter) {
              this.StmF = streamFilter.value;
              i = streamFilter.end + 1;              
            } else {              
              throw new Error("Can't parse /StmF property value");
            }
            break; 
          case "/StrF":
            const stringFilter = parser.parseNameAt(i, true);
            if (stringFilter) {
              this.StrF = stringFilter.value;
              i = stringFilter.end + 1;              
            } else {              
              throw new Error("Can't parse /StrF property value");
            }
            break; 
          case "/EFF":
            const embeddedFilter = parser.parseNameAt(i, true);
            if (embeddedFilter) {
              this.EFF = embeddedFilter.value;
              i = embeddedFilter.end + 1;              
            } else {              
              throw new Error("Can't parse /EFF property value");
            }
            break;
          case "/R":
            const revision = parser.parseNumberAt(i, false);
            if (revision && ([2, 3, 4].includes(revision.value))) {
              this.R = <2 | 3 | 4>revision.value;
              i = revision.end + 1;              
            } else {              
              throw new Error("Can't parse /R property value");
            }
            break;
          case "/O":
            const ownerPassword = LiteralString.parse(parser, i);
            if (ownerPassword) {
              this.O = ownerPassword.value;
              i = ownerPassword.end + 1;              
            } else {              
              throw new Error("Can't parse /O property value");
            }
            break;
          case "/U":
            const userPassword = LiteralString.parse(parser, i);
            if (userPassword) {
              this.U = userPassword.value;
              i = userPassword.end + 1;              
            } else {              
              throw new Error("Can't parse /U property value");
            }
            break;
          case "/P":
            const flags = parser.parseNumberAt(i, false);
            if (flags) {
              this.P = flags.value;
              i = flags.end + 1;
            } else {              
              throw new Error("Can't parse /P property value");
            }
            break;
          case "/EncryptMetadata":
            const encryptMetadata = parser.parseBoolAt(i);
            if (encryptMetadata) {
              this.EncryptMetadata = encryptMetadata.value;
              i = encryptMetadata.end + 1;
            } else {              
              throw new Error("Can't parse /EncryptMetadata property value");
            }
            break;
          default:
            
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
        
    if (!this.Filter) {
      // not all required properties parsed
      return false;
    }

    if (this.Filter === "/Standard" 
      && (!this.R || !this.O || !this.U || isNaN(this.P))) {
      // not all required properties parsed
      return false;
    }

    return true;
  }
}
