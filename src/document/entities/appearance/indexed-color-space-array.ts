import { codes } from "../../encoding/char-codes";
import { CryptInfo, IEncodable } from "../../common-interfaces";
import { ColorSpace, colorSpaces, valueTypes } from "../../spec-constants";
import { ParseInfo, ParseResult } from "../../data-parser";
import { ObjectId } from "../core/object-id";
import { TextStream } from "../streams/text-stream";
import { HexString } from "../strings/hex-string";

export class IndexedColorSpaceArray implements IEncodable {
  readonly baseColorSpace: ColorSpace;
  readonly highestValue: number;
  readonly lookupArray: Uint8Array;
  readonly componentsNumber: number;

  constructor(baseColorSpace: string, 
    highestValue: number, lookupArray: Uint8Array) {

    switch (baseColorSpace) {
      case colorSpaces.GRAYSCALE:            
        this.componentsNumber = 1;
        break;
      case colorSpaces.RGB:  
        this.componentsNumber = 3;
        break;
      case colorSpaces.CMYK:        
        this.componentsNumber = 4;
        break;
      default:
        // TODO: add support for more base color spaces
        throw new Error(`Unsupported base color space for indexed color space: ${baseColorSpace}`);
    }
    this.baseColorSpace = baseColorSpace;  

    if (lookupArray.length !== this.componentsNumber * (highestValue + 1)) {
      throw new Error(`Invalid lookup array length: ${lookupArray.length}`);

    }
    this.highestValue = highestValue;
    this.lookupArray = lookupArray;

    // DEBUG
    // console.log(this);
  }

  static parse(parseInfo: ParseInfo, skipEmpty = true): ParseResult<IndexedColorSpaceArray> {  
    const {parser, bounds, cryptInfo} = parseInfo;

    let i: number;
    if (skipEmpty) {
      i = parser.findNonSpaceIndex(true, bounds.start);
    }
    const start = i;
    if (i < 0 || i > parser.maxIndex 
      || parser.getCharCode(i) !== codes.L_BRACKET) {
      console.log("Color space array start not found");
      return null;
    }    
    i++;
    
    const type = parser.parseNameAt(i);
    if (!type || type.value !== "/Indexed") {
      // not an indexed color space
      console.log("Array is not representing an indexed color space");
      return null;
    }    
    i = type.end + 1;

    const base = parser.parseNameAt(i);
    if (!base) {
      console.log("Can't parse base color space name of the indexed color space");
      return null;
    }
    i = base.end + 2;

    const highestValue = parser.parseNumberAt(i);
    if (!highestValue || isNaN(highestValue.value)) {
      console.log("Can't parse the highest value of the indexed color space");
      return null;
    }
    i = highestValue.end + 1;

    let lookupArray: Uint8Array;
    const lookupEntryType = parser.getValueTypeAt(i);
    if (lookupEntryType === valueTypes.REF) {  
      try {
        const lookupId = ObjectId.parseRef(parser, i); 
        const lookupParseInfo = parseInfo.parseInfoGetter(lookupId.value.id);
        const lookupStream = TextStream.parse(lookupParseInfo);
        lookupArray = lookupStream.value.decodedStreamData;
        i = lookupId.end + 1;
      } catch (e) {
        throw new Error(`Can't parse indexed color array lookup ref: ${e.message}`);
      }
    } else if (lookupEntryType === valueTypes.STRING_HEX) {      
      const lookupHex = HexString.parse(parser, i, cryptInfo);  
      if (lookupHex) {
        lookupArray = lookupHex.value.hex;
        i = lookupHex.end + 1;
      } else {
        throw new Error("Can't parse indexed color array lookup hex string");
      }
    }

    try {
      const colorSpace = new IndexedColorSpaceArray(base.value, highestValue.value, lookupArray);
      return {
        value: colorSpace,
        start,
        end: i - 1,
      };
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }

  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const encoder = new TextEncoder();
    const bytes: number[] = [];
    bytes.push(
      codes.L_BRACKET, 
      ...encoder.encode("/Indexed "),
      ...encoder.encode(this.baseColorSpace + " "),
      ...encoder.encode(this.highestValue + " "),
      ...HexString.fromHexBytes(this.lookupArray).toArray(cryptInfo),
      codes.R_BRACKET,
    );
    return new Uint8Array(bytes);
  }

  getColor(index: number): [r: number, g: number, b: number] {
    switch (this.baseColorSpace) {
      case colorSpaces.GRAYSCALE:    
        const gray = this.lookupArray[index];        
        return [gray, gray, gray];
      case colorSpaces.RGB:      
        return [
          this.lookupArray[index * 3], 
          this.lookupArray[index * 3 + 1], 
          this.lookupArray[index * 3 + 2],
        ];
      case colorSpaces.CMYK:  
        const c = this.lookupArray[index * 4] / 255;
        const m = this.lookupArray[index * 4 + 1] / 255;   
        const y = this.lookupArray[index * 4 + 2] / 255;   
        const k = this.lookupArray[index * 4 + 3] / 255;      
        return [
          255 * (1 - c) * (1 - k),
          255 * (1 - m) * (1 - k),
          255 * (1 - y) * (1 - k),  
        ];
    }
  }
}
