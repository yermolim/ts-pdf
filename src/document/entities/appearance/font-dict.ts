import { dictTypes } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { codes } from "../../codes";

export class FontDict extends PdfDict {
  /** 
   * (Required) The type of font
   * */
  Subtype: string;
  /** 
   * (Required) The PostScript name of the font. 
   * For Type 1 fonts, this is usually the value of the FontName entry in the font program. 
   * The Post-Script name of the font can be used to find the font’s definition 
   * in the consumer application or its environment. It is also the name that is used 
   * when printing to a PostScript output device
   * */
  BaseFont: string;
  /** 
   * (Optional) A specification of the font’s character encoding 
   * if different from its built-in encoding. 
   * The value of Encoding is either the name of a predefined encoding 
   * (MacRomanEncoding, MacExpertEncoding, or WinAnsiEncoding) 
   * or an encoding dictionary that specifies differences from 
   * the font’s built-in encoding or from a specified predefined encoding
   * */
  Encoding: string;
  /**
   * (Optional; PDF1.2+) A stream containing a CMap file 
   * that maps character codes to Unicode values
   */
  ToUnicode: ObjectId;

  // TODO: add remaining properties if needed

  constructor() {
    super(dictTypes.FONT);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<FontDict> {    
    const dict = new FontDict();
    const parseResult = dict.tryParseProps(parseInfo);

    return parseResult
      ? {value: dict, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  
    
    if (this.Subtype) {
      bytes.push(...encoder.encode("/Subtype "), ...encoder.encode(" " + this.Subtype));
    }
    if (this.BaseFont) {
      bytes.push(...encoder.encode("/BaseFont "), ...encoder.encode(" " + this.BaseFont));
    }
    if (this.Encoding) {
      bytes.push(...encoder.encode("/Encoding "), ...encoder.encode(" " + this.Encoding));
    }
    if (this.ToUnicode) {
      bytes.push(...encoder.encode("/G "), codes.WHITESPACE, ...this.ToUnicode.toArray(cryptInfo));
    }
    
    //TODO: handle remaining properties if needed

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
          case "/Subtype":
            const subtype = parser.parseNameAt(i, true);
            if (subtype) {
              if (subtype.value === "/Type1" || subtype.value === "/TrueType") {
                this.Subtype = subtype.value;
                i = subtype.end + 1; 
                break;        
              }    
              // font type is not supported // TODO: add more font types support if needed
              return false;   
            }
            throw new Error("Can't parse /Subtype property value");
          
          case "/BaseFont":
          case "/Encoding":
            i = this.parseNameProp(name, parser, i);
            break;
          
          case "/ToUnicode":
            i = this.parseRefProp(name, parser, i);
            break; 

          // TODO: add cases for remaining properties if needed
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
