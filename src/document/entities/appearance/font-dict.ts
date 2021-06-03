import { Quadruple } from "../../../common/types";
import { dictTypes, valueTypes } from "../../const";
import { getBit } from "../../byte-functions";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { codes } from "../../codes";

import { UnicodeCmapStream } from "../streams/unicode-cmap-stream";
import { EncodingDict } from "./encoding-dict";
import { FontDescriptorDict } from "./font-descriptor-dict";

export class FontDict extends PdfDict {
  //#region PDF properties
  /** 
   * (Required) The type of font
   * */
  Subtype: string;
  /** 
   * (Required for Type 0, Type 1, TTF) The PostScript name of the font. 
   * 
   * For Type 1 and TrueType fonts, this is usually the value of the FontName entry in the font program. 
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
   * For Type 1 and TrueType: 
   * (Optional) A specification of the font’s character encoding 
   * if different from its built-in encoding. 
   * The value of Encoding is either the name of a predefined encoding 
   * (MacRomanEncoding, MacExpertEncoding, or WinAnsiEncoding) 
   * or an encoding dictionary that specifies differences from 
   * the font’s built-in encoding or from a specified predefined encoding
   * 
   * For Type 0: 
   * (Required) The name of a predefined CMap, or a stream containing a CMap 
   * that maps character codes to font numbers and CIDs. If the descendant is a Type 2 CIDFont 
   * whose associated TrueType font program is not embedded in the PDF file, 
   * the Encoding entry must be a predefined CMap name
   * */
  Encoding: string | ObjectId;
  /**
   * For Type 1 and TrueType: 
   * (Required except for the standard 14 fonts; shall be an indirect reference) 
   * A font descriptor describing the font’s metrics other than its glyph widths. 
   * For the standard 14 fonts, the entries FirstChar, LastChar, Widths, and FontDescriptor 
   * shall either all be present or all be absent. Ordinarily, these dictionary keys may be absent, 
   * specifying them enables a standard font to be overridden. 
   * Beginning with PDF 1.5, the special treatment given to the standard 14 fonts is deprecated. 
   * Conforming writers should represent all fonts using a complete font descriptor. 
   * For backwards capability, conforming readers shall still provide the special treatment 
   * identified for the standard 14 fonts.
   */
  FontDescriptor: ObjectId;
  /**
   * (Optional; PDF1.2+) A stream containing a CMap file 
   * that maps character codes to Unicode values
   */
  ToUnicode: ObjectId;
  /**
   * For Type 1, Type 3, TrueType:
   * (Required) The first character code defined in the font’s Widths array. 
   * 
   * Old behaviour: required except for the standard 14 fonts.
   * Beginning with PDF 1.5, the special treatment given to the standard 14 fonts is deprecated. 
   * Conforming writers should represent all fonts using a complete font descriptor. 
   * For backwards capability, conforming readers shall still provide the special treatment 
   * identified for the standard 14 fonts. 
   */
  FirstChar: number;
  /**
   * For Type 1, Type 3, TrueType:
   * (Required) The last character code defined in the font’s Widths array. 
   * 
   * Old behaviour: required except for the standard 14 fonts.
   * Beginning with PDF 1.5, the special treatment given to the standard 14 fonts is deprecated. 
   * Conforming writers should represent all fonts using a complete font descriptor. 
   * For backwards capability, conforming readers shall still provide the special treatment 
   * identified for the standard 14 fonts. 
   */
  LastChar: number;
  /**
   * For Type 1 and TrueType:
   * (Required) An array of (LastChar−FirstChar+ 1) widths, each element being the glyph width 
   * for the character code that equals FirstChar plus the array index. 
   * For character codes outside the range FirstChar to LastChar, the value of MissingWidth 
   * from the FontDescriptor entry for this font shall be used. 
   * The glyph widths shall be measured in units in which 1000 units correspond to 1 unit in text space. 
   * These widths shall be consistent with the actual widths given in the font program. 
   * 
   * For Type 3:
   * (Required; should be an indirect reference) 
   * An array of (LastChar−FirstChar+ 1) widths, each element being the glyph width 
   * for the character code that equals FirstChar plus the array index. 
   * For character codes outside the range FirstChar to LastChar, the width shall be 0. 
   * These widths shall be interpreted in glyph space as specified by FontMatrix 
   * (unlike the widths of a Type 1 font, which are in thousandths of a unit of text space). 
   * If FontMatrix specifies a rotation, only the horizontal component of the transformed 
   * width shall be used. That is, the resulting displacement shall be horizontal in text space, 
   * as is the case for all simple fonts. 
   * 
   * Old behaviour: required except for the standard 14 fonts.
   * Beginning with PDF 1.5, the special treatment given to the standard 14 fonts is deprecated. 
   * Conforming writers should represent all fonts using a complete font descriptor. 
   * For backwards capability, conforming readers shall still provide the special treatment 
   * identified for the standard 14 fonts.
   */
  Widths: number[] | ObjectId;
  /** 
   * For Type 3: 
   * (Required) A rectangle expressed in the glyph coordinate system, 
   * specifying the font bounding box. This is the smallest rectangle enclosing 
   * the shape that would result if all of the glyphs of the font were placed 
   * with their origins coincident and then filled. If all four elements 
   * of the rectangle are zero, a conforming reader shall make no assumptions 
   * about glyph sizes based on the font bounding box. If any element is nonzero, 
   * the font bounding box shall be accurate. 
   * If any glyph’s marks fall outside this bounding box, incorrect behavior may result.
   */
  FontBBox: Quadruple;
  /** 
   * For Type 3: 
   * (Required) An array of six numbers specifying the font matrix, 
   * mapping glyph space to text space. 
   * A common practice is to define glyphs in terms 
   * of a 1000-unit glyph coordinate system, 
   * in which case the font matrix is [ 0.001 0 0 0.001 0 0 ].
   */
  FontMatrix: Quadruple;
  /**
   * For Type 3:
   * (Optional but should be used; PDF 1.2) 
   * A list of the named resources, such as fonts and images, 
   * required by the glyph descriptions in this font. 
   * If any glyph descriptions refer to named resources 
   * but this dictionary is absent, the names shall be looked up 
   * in the resource dictionary of the page on which the font is used. 
   */
  Resources: Uint8Array; // don't parse, just keep an unchanged byte array  
  /**
   * For Type 3:
   * (Required) A dictionary in which each key shall be a glyph name and the value 
   * associated with that key shall be a content stream that constructs and paints 
   * the glyph for that character. The stream shall include as its first operator 
   * either d0 or d1, followed by operators describing one or more graphics objects, 
   * which may include path, text, or image objects.
   */
  CharProcs: Uint8Array; // don't parse, just keep an unchanged byte array. TODO: Implement
  /**
   * For Type 0:
   * (Required) A one-element array specifying the CIDFont dictionary 
   * that is the descendant of this Type 0 font
   * 
   * For Type 3:
   * (Required) A dictionary in which each key shall be a glyph name and the value 
   * associated with that key shall be a content stream that constructs and paints 
   * the glyph for that character. The stream shall include as its first operator 
   * either d0 or d1, followed by operators describing one or more graphics objects, 
   * which may include path, text, or image objects.
   */
  DescendantFonts: Uint8Array; // don't parse, just keep an unchanged byte array. TODO: Implement

  // TODO: add remaining properties if needed
  //#endregion
  
  protected _encoding: EncodingDict;
  get encoding(): EncodingDict {
    return this._encoding;
  }

  protected _toUtfCmap: UnicodeCmapStream;
  get toUtfCmap(): UnicodeCmapStream {
    return this._toUtfCmap;
  }
  
  protected _descriptor: FontDescriptorDict;
  get descriptor(): FontDescriptorDict {
    return this._descriptor;
  }
  set descriptor(value: FontDescriptorDict) {
    this._descriptor = value;
    this.FontDescriptor = value.ref
      ? new ObjectId(value.ref.id, value.ref.generation)
      : null;
  }
  get descriptorId(): ObjectId {  
    if (!this.FontDescriptor && this._descriptor?.ref) {
      this.FontDescriptor = new ObjectId(this._descriptor.ref.id, this._descriptor.ref.generation);
    }
    return this.FontDescriptor;
  }

  /** 'true' if the current font has same width for all chars ('font-family: monospace;'), 
   * 'false' otherwise */
  get isMonospace(): boolean {
    if (!this._descriptor) {
      return false;
    }
    const flags = this._descriptor?.Flags;
    return !!getBit(flags, 0);
  }
  /** 'true' if the current font has serifs ('font-family: serif;'), 
   * 'false' otherwise ('font-family: sans-serif;') */
  get isSerif(): boolean {
    if (!this._descriptor) {
      return false;
    }
    const flags = this._descriptor?.Flags;
    return !!getBit(flags, 1);
  }
  /** 'true' if the current font is script-like ('font-family: cursive;'), 
   * 'false' otherwise */
  get isScript(): boolean {
    if (!this._descriptor) {
      return false;
    }
    const flags = this._descriptor?.Flags;
    return !!getBit(flags, 3);
  }
  /** 'true' if the current font is 'italic', 'false' otherwise */
  get isItalic(): boolean {
    if (!this._descriptor) {
      return false;
    }
    const flags = this._descriptor?.Flags;
    return !!getBit(flags, 6);
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
      if (this.Encoding instanceof ObjectId) {
        bytes.push(...encoder.encode("/Encoding "), codes.WHITESPACE, ...this.Encoding.toArray(cryptInfo));
      } else {
        bytes.push(...encoder.encode("/Encoding "), ...encoder.encode(" " + this.Encoding));
      }
    }
    if (this.ToUnicode) {
      bytes.push(...encoder.encode("/G "), codes.WHITESPACE, ...this.ToUnicode.toArray(cryptInfo));
    }
    if (this.FirstChar) {
      bytes.push(...encoder.encode("/FirstChar "), ...encoder.encode(" " + this.FirstChar));
    }
    if (this.LastChar) {
      bytes.push(...encoder.encode("/LastChar "), ...encoder.encode(" " + this.LastChar));
    }
    if (this.Widths) {
      if (this.Widths instanceof ObjectId) {
        bytes.push(...encoder.encode("/Widths "), codes.WHITESPACE, ...this.Widths.toArray(cryptInfo));
      } else {
        bytes.push(...encoder.encode("/Widths "), codes.L_BRACKET);
        this.Widths.forEach(x => bytes.push(...encoder.encode(" " + x)));
        bytes.push(codes.R_BRACKET);
      }
    }

    if (this.descriptorId) {
      bytes.push(...encoder.encode("/FontDescriptor "), codes.WHITESPACE, 
        ...this.descriptorId.toArray(cryptInfo));
    }

    if (this.Resources) {
      bytes.push(...encoder.encode("/Resources "), ...this.Resources);
    }
    if (this.CharProcs) {
      bytes.push(...encoder.encode("/CharProcs "), ...this.CharProcs);
    }

    if (this.FontBBox) {
      bytes.push(...encoder.encode("/FontBBox "), codes.L_BRACKET);
      this.FontBBox.forEach(x => bytes.push(...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
    }
    if (this.FontMatrix) {
      bytes.push(...encoder.encode("/FontMatrix "), codes.L_BRACKET);
      this.FontBBox.forEach(x => bytes.push(...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
    }
    
    //TODO: handle remaining properties if needed

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }

  decodeText(bytes: Uint8Array): string {
    if (this.toUtfCmap) {
      // 'to unicode' mapper found
      return this.toUtfCmap.hexBytesToUtfString(bytes);
    } 

    if (this.encoding?.charMap) { 
      // 'code to character' mappings found
      const charMap = this.encoding.charMap;
      let text = "";
      bytes.forEach(byte => text += charMap.get(byte) ?? " ");
      return text;
    }
      
    // no mappings are found in the resource dictionary.
    // use the default text decoder as a fallback (though it might fail)
    const decoder = bytes[0] === 254 && bytes[1] === 255 // UTF-16 Big Endian
      ? new TextDecoder("utf-16be")
      : new TextDecoder();
    const literal = decoder.decode(bytes);
    return literal || "";
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
            
          case "/FirstChar":
          case "/LastChar":
            i = this.parseNumberProp(name, parser, i, false);
            break; 
            
          case "/FontBBox":
          case "/FontMatrix":
            i = this.parseNumberArrayProp(name, parser, i, true);
            break; 

          case "/Widths":
            const widthPropType = parser.getValueTypeAt(i);
            if (widthPropType === valueTypes.ARRAY) {
              i = this.parseNumberArrayProp(name, parser, i, true);
            } else if (widthPropType === valueTypes.REF) {              
              i = this.parseRefProp(name, parser, i);
            } else {
              throw new Error(`Unsupported '${name}' property value type: '${encodingPropType}'`);
            }
            break;
            
          case "/FontDescriptor":
            i = this.parseRefProp(name, parser, i);
            break; 

          // there is no need to parse font resources and char to stream maps
          // so just save the resource property source bytes
          // the source bytes will be used when converting the dict to bytes
          case "/Resources":  
          case "/CharProcs":  
            const excludedEntryType = parser.getValueTypeAt(i);
            if (excludedEntryType === valueTypes.REF) {              
              const excludedDictId = ObjectId.parseRef(parser, i);
              if (excludedDictId && parseInfo.parseInfoGetter) {
                this[name.slice(1)] = parser.sliceCharCodes(excludedDictId.start, excludedDictId.end);
                i = excludedDictId.end + 1;
                break;
              }              
              throw new Error(`Can't parse ${name} value reference`);
            } else if (excludedEntryType === valueTypes.DICTIONARY) { 
              const excludedDictBounds = parser.getDictBoundsAt(i); 
              if (excludedDictBounds) {
                this[name.slice(1)] = parser.sliceCharCodes(excludedDictBounds.start, excludedDictBounds.end);
                i = excludedDictBounds.end + 1;
                break;
              }
              throw new Error(`Can't parse ${name} dictionary bounds`); 
            }
            throw new Error(`Unsupported ${name} property value type: ${excludedEntryType}`);   

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

    if (this.Encoding && this.Encoding instanceof ObjectId) {
      const encodingParseInfo = parseInfo.parseInfoGetter(this.Encoding.id);
      const encodingDict = EncodingDict.parse(encodingParseInfo);
      this._encoding = encodingDict?.value;
    }

    if (this.ToUnicode) {      
      const toUtfParseInfo = parseInfo.parseInfoGetter(this.ToUnicode.id);
      const cmap = UnicodeCmapStream.parse(toUtfParseInfo);
      this._toUtfCmap = cmap?.value;
    }
    
    if (this.FontDescriptor) {      
      const descriptorParseInfo = parseInfo.parseInfoGetter(this.FontDescriptor.id);
      const descriptor = FontDescriptorDict.parse(descriptorParseInfo);
      this._descriptor = descriptor?.value;
    }

    if (this.Subtype !== "/Type1" 
      && this.Subtype !== "/Type3"
      && this.Subtype !== "/TrueType"
      && !(this.Subtype === "/Type0" && this._toUtfCmap)) {
      // TODO: add more supported types
      // Type1, Type3, TTF, Type0 with defined 'to Unicode' CMap are supported
      throw new Error(`Font type is not supported: ${this.Subtype}`);
    }
    
    if (this.Subtype === "/Type3" 
      && (!this.FontBBox 
        || !this.FontMatrix 
        || !this.Encoding
        || !this.FirstChar
        || !this.LastChar
        || !this.Widths
        || !this.CharProcs)) {
      throw new Error("Not all required properties parsed");
    }
  }
}
