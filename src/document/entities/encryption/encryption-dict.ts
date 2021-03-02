import { codes } from "../../codes";
import { CryptRevision, cryptRevisions, CryptVersion, cryptVersions, 
  dictTypes, valueTypes } from "../../const";
import { CryptInfo, CryptOptions } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { HexString } from "../strings/hex-string";
import { LiteralString } from "../strings/literal-string";
import { PdfDict } from "../core/pdf-dict";
import { CryptFilterDict } from "./crypt-filter-dict";
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
   * - 1 RC4 with an encryption key length of 40 bits 
   * - 2 (PDF 1.4+) Same as 1 but permitting encryption key lengths greater than 40 bits 
   * - 3 (PDF 1.4+) An unpublished algorithm that permits encryption key lengths 
   * ranging from 40 to 128 bits. This value shall not appear in a conforming PDF file
   * - 4 (PDF 1.5+) The security handler defines the use of AES encryption (128-bit key)
   * and decryption in the document, using the rules specified by the CF, StmF, and StrF entries. 
   * - 5 (PDF 1.7+) The security handler defines the use of AES encryption (256-bit key) 
   * and decryption in the document, using the rules specified by the CF, StmF, and StrF entries. 
   * 
   * The default value if this entry is omitted shall be 0, 
   * but when present should be a value of 1 or greater
  */
  V: CryptVersion;
  /** 
   * (Optional; PDF 1.4+; only if V is 2 or 3) The length of the encryption key, 
   * in bits. The value shall be a multiple of 8, in the range 40 to 256
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
   * (Optional; meaningful only when the value of V is 4 or 5; PDF 1.5+) 
   * The name of the crypt filter that shall be used by default 
   * when decrypting streams. The name shall be a key in the CF dictionary 
   * or a standard crypt filter name. All streams in the document, 
   * except for cross-reference streams or streams that have a Crypt entry 
   * in their Filterarray, shall be decrypted by the security handler, 
   * using this crypt filter
   * */
  StmF = "/Identity";
  /** 
   * (Optional; meaningful only when the value of V is 4 or 5; PDF 1.5+) 
   * The name of the crypt filter that shall be used when decrypting all strings 
   * in the document. The name shall be a key in the CF dictionary 
   * or a standard crypt filter name
   * */
  StrF = "/Identity";
  /** 
   * (Optional; meaningful only when the value of V is 4 or 5; PDF 1.6+) 
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
   * [5] if the document is encrypted with a V value of 5
   * [6] if the document is encrypted with a V value of 5
   * */
  R: CryptRevision;
  /** 
   * (Required if /Filter/Standard) A 32-byte string (127-byte string if V = 5), 
   * based on both the owner and user passwords, that shall be used in computing 
   * the encryption key and in determining whether a valid owner password was entered
   * */
  O: LiteralString;
  /** 
   * (Required if /Filter/Standard) A 32-byte string (127-byte string if V = 5), 
   * based on the user password,that shall be used in determining whether 
   * to prompt the user for a password and,if so,
   * whether a valid user or owner password was entered
   * */
  U: LiteralString;
  /** 
   * (Required if R is 5 or 6) A 32-byte string based on the user password, 
   * that is used in computing the encryption key
   * */
  OE: LiteralString;
  /** 
   * (Required if R is 5 or 6) A 32-byte string based on the owner and the user password, 
   * that is used in computing the encryption key
   * */
  UE: LiteralString;
  /** 
   * (Required if /Filter/Standard) A set of flags specifying which operations 
   * shall be permitted when the document is opened with user access
   * */
  P: number;
  /** 
   * (Required if R is 5) A16-byte string, encrypted with the file encryption key, 
   * that contains an encrypted copy of the permission flags
   * */
  Perms: LiteralString;
  /** 
   * (Optional; meaningful only when the value of V is 4 or 5; PDF 1.5+) 
   * Indicates whether the document-level metadata stream shall be encrypted. 
   * Conforming products should respect this value
   * */
  EncryptMetadata = true;
  /** 
   * (Required when SubFilter is adbe.pkcs7.s3 or adbe.pkcs7.s4; PDF 1.3+) 
   * An array of byte-strings, where each string is a PKCS#7 object 
   * listing recipients who have been granted equal access rights to the document. 
   * The data contained in the PKCS#7 object shall include both a cryptographic key 
   * that shall be used to decrypt the encrypted data and the access permissions 
   * that apply to the recipient list. There shall be only one PKCS#7 object 
   * per unique set of access permissions; if a recipient appears in more 
   * than one list, the permissions used shall be those in the first matching list. 
   * When SubFilter is adbe.pkcs7.s5, recipient lists shall be specified 
   * in the crypt filter dictionary
   * */
  Recipients: HexString | HexString[];

  stringFilter: CryptFilterDict;
  streamFilter: CryptFilterDict;
  
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
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
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
      bytes.push(...encoder.encode("/CF"), ...this.CF.toArray(cryptInfo));
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
      bytes.push(...encoder.encode("/O"), ...this.O.toArray(cryptInfo));
    }
    if (this.U) {
      bytes.push(...encoder.encode("/U"), ...this.U.toArray(cryptInfo));
    }
    if (this.OE) {
      bytes.push(...encoder.encode("/OE"), ...this.OE.toArray(cryptInfo));
    }
    if (this.UE) {
      bytes.push(...encoder.encode("/UE"), ...this.UE.toArray(cryptInfo));
    }
    if (this.P) {
      bytes.push(...encoder.encode("/P"), ...encoder.encode(" " + this.P));
    }
    if (this.Perms) {
      bytes.push(...encoder.encode("/Perms"), ...this.Perms.toArray(cryptInfo));
    }
    if (this.U) {
      bytes.push(...encoder.encode("/U"), ...this.U.toArray(cryptInfo));
    }
    if (this.EncryptMetadata) {
      bytes.push(...encoder.encode("/EncryptMetadata"), ...encoder.encode(" " + this.EncryptMetadata));
    }
    if (this.Recipients) {
      if (this.Recipients instanceof HexString) {
        bytes.push(...encoder.encode("/Recipients"), ...this.Recipients.toArray(cryptInfo));
      } else {        
        bytes.push(codes.L_BRACKET);
        this.Recipients.forEach(x => bytes.push(...x.toArray(cryptInfo)));
        bytes.push(codes.R_BRACKET);
      }
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }

  toCryptOptions(): CryptOptions {
    if (!this.V) {
      return null;
    }

    return <CryptOptions> {
      filter: this.Filter,
      version: this.V,
      revision: this.R,
      permissions: this.P,
      keyLength: this.Length,
      encryptMetadata: this.EncryptMetadata,
    
      stringKeyLength: this.stringFilter?.Length,
      streamKeyLength: this.streamFilter?.Length,
    
      stringMethod: this.stringFilter?.CFM,
      streamMethod: this.streamFilter?.CFM,
      
      oPasswordHash: this.O?.bytes,
      uPasswordHash: this.U?.bytes,
      
      oEncPasswordHash: this.OE?.bytes,
      uEncPasswordHash: this.UE?.bytes,
      perms: this.Perms?.bytes,
    };
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
          case "/SubFilter":
          case "/StmF":
          case "/StrF":
          case "/EFF":
            i = this.parseNameProp(name, parser, i);
            break; 

          case "/V":
            const algorithm = parser.parseNumberAt(i, false);
            if (algorithm && (<number[]>Object.values(cryptVersions))
              .includes(algorithm.value)) {
              this.V = <CryptVersion>algorithm.value;
              i = algorithm.end + 1;              
            } else {              
              throw new Error("Can't parse /V property value");
            }
            break;
          case "/R":
            const revision = parser.parseNumberAt(i, false);
            if (revision && (<number[]>Object.values(cryptRevisions))
              .includes(revision.value)) {
              this.R = <CryptRevision>revision.value;
              i = revision.end + 1;              
            } else {              
              throw new Error("Can't parse /R property value");
            }
            break;

          case "/Length":
          case "/P":
            i = this.parseNumberProp(name, parser, i, false);
            break; 

          case "/O":
          case "/U":
          case "/OE":
          case "/UE":
          case "/Perms":
            i = this.parseLiteralProp(name, parser, i, parseInfo.cryptInfo);
            break;
  
          case "/EncryptMetadata":
            i = this.parseBoolProp(name, parser, i);
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

          case "/Recipients":            
            const entryType = parser.getValueTypeAt(i);
            if (entryType === valueTypes.STRING_HEX) {  
              const recipient = HexString.parse(parser, i, parseInfo.cryptInfo);  
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
        
    if (!this.Filter) {
      // not all required properties parsed
      return false;
    }    

    if (this.Filter === "/Standard" 
        && (
          !this.R 
          || !this.O 
          || !this.U 
          || isNaN(this.P)
          || (this.V === 5 && (this.R < 5 || !this.OE || !this.UE || !this.Perms))
        )) {
      // not all required properties parsed
      return false;
    }    
    
    if ((this.SubFilter === "adbe.pkcs7.s3" || this.SubFilter === "adbe.pkcs7.s4")
      && ! this.Recipients) {
      // not all required properties parsed
      return false;
    }

    if (this.StrF !== "/Identity") {
      this.stringFilter = this.CF?.getProp(this.StrF);
    }
    if (this.StmF !== "/Identity") {
      this.streamFilter = this.CF?.getProp(this.StmF);
    }

    return true;
  }
}
