import { dictTypes, valueTypes } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { codes } from "../../codes";

import { UnicodeCmapStream } from "../streams/unicode-cmap-stream";

export class FontDict extends PdfDict {
  //#region PDF properties
  /** 
   * (Required) The type of font
   * */
  Subtype: string;
  /** 
   * (Required) The PostScript name of the font. 
   * 
   * For Type 1 fonts, this is usually the value of the FontName entry in the font program. 
   * The Post-Script name of the font can be used to find the font’s definition 
   * in the consumer application or its environment. It is also the name that is used 
   * when printing to a PostScript output device.
   * 
   * Fore Type 0 fonts, this is an arbitrary name, 
   * since there is no font program associated directly with a Type 0 font dictionary. 
   * The conventions described here ensure maximum compatibility with existing Acrobat products.
   * If the descendant is a Type 0 CIDFont, 
   * this name should be the concatenation of the CIDFont’s BaseFont name, a hyphen, 
   * and the CMap name given in the Encoding entry (or the CMapName entry in the CMap). 
   * If the descendant is a Type 2 CIDFont, this name should be the same as the CIDFont’s BaseFontname. 
   * */
  BaseFont: string;
  /** 
   * For Type 0 and TrueType: 
   * (Optional) A specification of the font’s character encoding 
   * if different from its built-in encoding. 
   * The value of Encoding is either the name of a predefined encoding 
   * (MacRomanEncoding, MacExpertEncoding, or WinAnsiEncoding) 
   * or an encoding dictionary that specifies differences from 
   * the font’s built-in encoding or from a specified predefined encoding
   * 
   * For Type 1: 
   * (Required) The name of a predefined CMap, or a stream containing a CMap 
   * that maps character codes to font numbers and CIDs. If the descendant is a Type 2 CIDFont 
   * whose associated TrueType font program is not embedded in the PDF file, 
   * the Encoding entry must be a predefined CMap name
   * */
  Encoding: string | ObjectId;
  /**
   * (Optional; PDF1.2+) A stream containing a CMap file 
   * that maps character codes to Unicode values
   */
  ToUnicode: ObjectId;

  // TODO: add remaining properties if needed
  //#endregion

  private _toUtfCmap: UnicodeCmapStream;
  get toUtfCmap(): UnicodeCmapStream {
    return this._toUtfCmap;
  }

  constructor() {
    super(dictTypes.FONT);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<FontDict> {    
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new FontDict();
      pdfObject.parseProps(parseInfo);
      return {value: pdfObject, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
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
  protected parseProps(parseInfo: ParseInfo) {
    super.parseProps(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    // DEBUG
    // console.log(parser.sliceChars(start, end));  
    
    let i = parser.skipToNextName(start, end - 1);
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
              this.Subtype = subtype.value;
              i = subtype.end + 1; 
              break;        
            }
            throw new Error("Can't parse /Subtype property value");       
          case "/BaseFont":
            i = this.parseNameProp(name, parser, i);
            break;          
          case "/Encoding":
            const encodingPropType = parser.getValueTypeAt(i);
            if (encodingPropType === valueTypes.NAME) {
              i = this.parseNameProp(name, parser, i);
            } else if (encodingPropType === valueTypes.REF) {              
              i = this.parseRefProp(name, parser, i);
            } else {
              throw new Error(`Unsupported '${name}' property value type: '${encodingPropType}'`);
            }
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

    if (this.ToUnicode) {      
      const toUtfParseInfo = parseInfo.parseInfoGetter(this.ToUnicode.id);
      const cmap = UnicodeCmapStream.parse(toUtfParseInfo);
      this._toUtfCmap = cmap?.value;
    }

    if (this.Subtype !== "/Type1" 
      && this.Subtype !== "/TrueType"
      && !(this.Subtype === "/Type0" && this._toUtfCmap)) {
      // TODO: add more supported types
      // Type1, TTF, Type0 with simple 'to Unicode' CMap are supported
      throw new Error(`Font type is not supported: ${this.Subtype}`);
    }
  }
}
