import { dictTypes, valueTypes } from "../../spec-constants";
import { ParserResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";
import { PdfDict } from "../core/pdf-dict";
import { ObjectId } from "../core/object-id";
import { HexString } from "../strings/hex-string";
import { CryptInfo } from "../../encryption/interfaces";
import { LiteralString } from "../strings/literal-string";

export class TrailerDict extends PdfDict {
  /**
   * (Required; shall not be an indirect reference) 
   * The total number of entries in the file’s cross-reference table, 
   * as defined by the combination of the original section and all update sections. 
   * Equivalently, this value shall be 1 greater than the highest object number 
   * defined in the file. Any object in a cross-reference section 
   * whose number is greater than this value shall be ignored and
   * defined to be missing by a conforming reader
   */
  Size: number;
  /**
   * (Present only if the file has more than one cross-reference section; 
   * shall be an indirect reference) The byte offset in the decoded stream 
   * from the beginning of the file to the beginning 
   * of the previous cross-reference section
   */
  Prev: number;
  /**
   * (Required; shall be an indirect reference) The catalog dictionary 
   * for the PDF document contained in the file
   */
  Root: ObjectId;
  /**
   * (Required if document is encrypted; PDF 1.1+) 
   * The document’s encryption dictionary
   */
  Encrypt: ObjectId; // | EncryptionDict; // not sure if encryption dictionary can be direct object
  /**
   * (Optional; shall be an indirect reference) 
   * The document’s information dictionary
   */
  Info: ObjectId;
  /**
   * (Required if an Encrypt entry is present; optional otherwise; PDF 1.1+) 
   * An array of two byte-strings constituting a file identifier for the file. 
   * If there is an Encrypt entry this array and the two byte-strings 
   * shall be direct objects and shall be unencrypted
   */
  ID: [HexString, HexString];
  
  constructor() {
    super(dictTypes.EMPTY);
  }
  
  static async parseAsync(parseInfo: ParserInfo): Promise<ParserResult<TrailerDict>> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new TrailerDict();
      await pdfObject.parsePropsAsync(parseInfo);
      return {value: pdfObject, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }

  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Size) {
      bytes.push(...encoder.encode("/Size "), ...encoder.encode(" " + this.Size));
    }
    if (this.Prev) {
      bytes.push(...encoder.encode("/Prev "), ...encoder.encode(" " + this.Prev));
    }
    if (this.Root) {
      bytes.push(...encoder.encode("/Root "), ...this.Root.toArray(cryptInfo));
    }
    if (this.Encrypt) {
      bytes.push(...encoder.encode("/Encrypt "), ...this.Encrypt.toArray(cryptInfo));
    }
    if (this.Info) {
      bytes.push(...encoder.encode("/Info "), ...this.Info.toArray(cryptInfo));
    }
    if (this.ID) {
      bytes.push(...encoder.encode("/ID "), ...this.encodeSerializableArray(this.ID, cryptInfo));
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  protected override async parsePropsAsync(parseInfo: ParserInfo) {
    await super.parsePropsAsync(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    let i = await parser.skipToNextNameAsync(start, end - 1);
    let name: string;
    let parseResult: ParserResult<string>;
    while (true) {
      parseResult = await parser.parseNameAtAsync(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/Size":
          case "/Prev":
            i = await this.parseNumberPropAsync(name, parser, i, false);
            break;

          case "/Root":
          case "/Info":
            i = await this.parseRefPropAsync(name, parser, i);
            break;

          case "/Encrypt":
            const entryType = await parser.getValueTypeAtAsync(i);
            if (entryType === valueTypes.REF) {              
              const encryptId = await ObjectId.parseRefAsync(parser, i);
              if (encryptId) {
                this.Encrypt = encryptId.value;
                i = encryptId.end + 1;
                break;
              } 
              else {              
                throw new Error("Can't parse /Encrypt property value");
              }
            // } else if (entryType === valueTypes.DICTIONARY) {  
            //   const encryptBounds = parser.getDictBoundsAt(i);
            //   if (encryptBounds) {         
            //     const encrypt = EncryptionDict.parse({parser, bounds: encryptBounds});
            //     if (encrypt) {
            //       this.Encrypt = encrypt.value;
            //       i = encryptBounds.end + 1;
            //       break;
            //     }
            //   }               
            //   throw new Error("Can't parse /Encrypt property value");
            }
            throw new Error(`Unsupported /Encrypt property value type: ${entryType}`);

          case "/ID":
            const hexIds = await HexString.parseArrayAsync(parser, i);
            if (hexIds && hexIds.value[0] && hexIds.value[1]) {
              this.ID = [
                hexIds.value[0], 
                hexIds.value[1],
              ];
              i = hexIds.end + 1;
              break;
            } 
            const literalIds = await LiteralString.parseArrayAsync(parser, i);
            if (literalIds && literalIds.value[0] && literalIds.value[1]) {
              this.ID = [
                HexString.fromHexBytes(literalIds.value[0].bytes), 
                HexString.fromHexBytes(literalIds.value[1].bytes),
              ];
              i = literalIds.end + 1;
              break;
            } 
            throw new Error("Can't parse /ID property value");
            
          default:
            // skip to next name
            i = await parser.skipToNextNameAsync(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
    
    if (!this.Size || !this.Root || (this.Encrypt && !this.ID)) {
      throw new Error("Not all required properties parsed");
    }
  }
}
