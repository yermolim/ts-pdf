import { CryptInfo } from "../../encryption/interfaces";
import { borderEffects, BorderEffect } from "../../spec-constants";
import { ParseInfo, ParseResult } from "../../data-parser";
import { PdfDict } from "../core/pdf-dict";

export class BorderEffectDict extends PdfDict {
  /**(Optional) A name representing the border effect to apply */
  S: BorderEffect = borderEffects.NONE;
  /**(Optional; valid only if the value of S is C) 
   * A number describing the intensity of the effect, in the range 0 to 2 */
  L = 0;
  
  constructor() {
    super(null);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<BorderEffectDict> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new BorderEffectDict();
      pdfObject.parseProps(parseInfo);
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

    if (this.S) {
      bytes.push(...encoder.encode("/S "), ...encoder.encode(this.S));
    }
    if (this.L) {
      bytes.push(...encoder.encode("/L "), ...encoder.encode(" " + this.L));
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
  protected override parseProps(parseInfo: ParseInfo) {
    super.parseProps(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    let i = parser.skipToNextName(start, end - 1);
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/S":
            const style = parser.parseNameAt(i, true);
            if (style && (<string[]>Object.values(borderEffects)).includes(style.value)) {
              this.S = <BorderEffect>style.value;
              i = style.end + 1;              
            } else {              
              throw new Error("Can't parse /S property value");
            }
            break;  
          
          case "/L":
            i = this.parseNumberProp(name, parser, i, true);
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
  }
}
