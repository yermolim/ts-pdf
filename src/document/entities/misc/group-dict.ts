import { dictTypes, GroupDictType, groupDictTypes } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { PdfDict } from "../core/pdf-dict";

export abstract class GroupDict extends PdfDict {
  /**
   * (Required) The group subtype, which identifies the type of group 
   * whose attributes this dictionary describes and determines the format and meaning 
   * of the dictionary’s remaining entries. The only group subtype defined in PDF 1.4 is Transparency; 
   * Other group subtypes may be added in the future
   */
  S: GroupDictType = "/Transparency";
  
  protected constructor() {
    super(dictTypes.GROUP);
  }  

  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.S) {
      bytes.push(...encoder.encode("/S "), ...encoder.encode(this.S));
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
          case "/S":
            const intent = parser.parseNameAt(i, true);
            if (intent) {
              if ((<string[]>Object.values(groupDictTypes)).includes(intent.value)) {
                this.S = <GroupDictType>intent.value;
                i = intent.end + 1;    
              } else {
                // Unsupported subtype
                return false;
              }      
            } else {              
              throw new Error("Can't parse /S property value");
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

    return true;
  }
}
