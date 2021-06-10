import { StreamType, valueTypes } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { DataParser, ParseInfo, ParseResult } from "../../data-parser";
import { PdfStream } from "../core/pdf-stream";
import { keywordCodes } from "../../codes";
import { HexString } from "../strings/hex-string";
import { hexStringToBytes, parseIntFromBytes } from "../../byte-functions";

interface CmapCodeRange {
  length: number;
  start: Uint8Array;
  end: Uint8Array;
}

export class UnicodeCmapStream extends PdfStream {  

  protected readonly _codeRanges: CmapCodeRange[] = [];
  protected readonly _map = new Map<number, string>();
  
  constructor(type: StreamType = null) {
    super(type);
  }  

  static parse(parseInfo: ParseInfo): ParseResult<UnicodeCmapStream> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new UnicodeCmapStream();
      pdfObject.parseProps(parseInfo);
      return {value: pdfObject, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }

  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);
    return superBytes;
  }

  hexBytesToUtfString(bytes: Uint8Array): string {
    // DEBUG
    // bytes = hexStringToBytes("025E025C026D02790261027502710267025A0279");

    let result = "";
    outer: for (let i = 0; i < bytes.length; i++) {
      // take byte subarrays until found in any range (limit the subarray with 4 bytes)
      for (let j = 1; i + j <= bytes.length && j <= 4; j++) {
        const sub = bytes.subarray(i, i + j);
        if (this.isInsideAnyRange(sub)) {          
          result += this._map.get(parseIntFromBytes(sub)) || "";
          continue outer;
        }
      }
    }

    // DEBUG
    // console.log(result);
    return result;
  }

  protected isInsideAnyRange(bytes: Uint8Array): boolean {
    outer: for (const range of this._codeRanges) {
      // bytes length shall be equal to the range length
      if (bytes.length !== range.length) {
        continue;
      }
      // each of the bytes shall lie between the corresponding bytes of the lower and upper bounds
      for (let i = 0; i < range.length; i++) {
        if (bytes[i] < range.start[i]
          || bytes[i] > range.end[i]) {
          continue outer;
        }
      }
      return true;
    }
    return false;
  }

  protected parseCodeRanges(parser: DataParser) {
    let i = 0;
    const codeRangeStart = parser.findSubarrayIndex(keywordCodes.CMAP_BEGIN_CODE_RANGE, 
      { closedOnly: true })?.end;
    if (!codeRangeStart) {
      // no allowed codes found
      return;
    }
    i = codeRangeStart + 1;
    const codeRangeEnd = parser.findSubarrayIndex(keywordCodes.CMAP_END_CODE_RANGE, 
      { closedOnly: true, minIndex: i })?.start;
    while (i < codeRangeEnd - 1) {
      const rangeStart = HexString.parse(parser, i);
      i = rangeStart.end + 1;
      const rangeEnd = HexString.parse(parser, i);
      i = rangeEnd.end + 1;

      this._codeRanges.push({
        length: rangeStart.value.hex.length,
        start: rangeStart.value.hex,
        end: rangeEnd.value.hex,
      });
    }  
  }
  
  protected parseCharMap(parser: DataParser, decoder: TextDecoder) {
    let i = 0;
    // parse char maps (there can be multiple maps with up to 100 entries in each of them)
    while (true) {
      const charMapStart = parser.findSubarrayIndex(keywordCodes.CMAP_BEGIN_CHAR, 
        { closedOnly: true, minIndex: i })?.end;
      if (!charMapStart) {
        // no char map found
        break;
      }
      i = charMapStart + 1;
      const charMapEnd = parser.findSubarrayIndex(keywordCodes.CMAP_END_CHAR, 
        { closedOnly: true, minIndex: i })?.start;
      while (i < charMapEnd - 1) {
        const hexKey = HexString.parse(parser, i);
        i = hexKey.end + 1;
        const unicodeValue = HexString.parse(parser, i);
        i = unicodeValue.end + 1;        
        this._map.set(parseIntFromBytes(hexKey.value.hex), 
          decoder.decode(unicodeValue.value.hex));
      }   
    } 
  }
  
  protected parseCharRangesMap(parser: DataParser, decoder: TextDecoder) {
    let i = 0;
    // parse char map ranges (there can be multiple ranges with up to 100 entries in each of them)
    while (true) {
      const rangeMapStart = parser.findSubarrayIndex(keywordCodes.CMAP_BEGIN_RANGE, 
        { closedOnly: true, minIndex: i })?.end;
      if (!rangeMapStart) {
        // no char map found
        break;
      }
      i = rangeMapStart + 1;
      const rangeMapEnd = parser.findSubarrayIndex(keywordCodes.CMAP_END_RANGE, 
        { closedOnly: true, minIndex: i })?.start;
      while (i < rangeMapEnd - 1) {
        const keyRangeStart = HexString.parse(parser, i);
        i = keyRangeStart.end + 1;
        const keyRangeEnd = HexString.parse(parser, i);
        i = keyRangeEnd.end + 1;
        
        let key = parseIntFromBytes(keyRangeStart.value.hex);
        const nextValueType = parser.getValueTypeAt(i, true);
        if (nextValueType === valueTypes.ARRAY) {
          // unicode value range is defined as array
          const valueArray = HexString.parseArray(parser, i);
          i = valueArray.end + 1;
          for (const value of valueArray.value) {            
            this._map.set(key++, decoder.decode(value.hex));
          }
        } else {
          // unicode value range is defined by the starting value          
          const startingValue = HexString.parse(parser, i);
          i = startingValue.end + 1;
          let startingUtf = parseIntFromBytes(startingValue.value.hex);
          while (key <= parseIntFromBytes(keyRangeEnd.value.hex)) {
            const hexStringUnpadded = (startingUtf++).toString(16);
            const padding = hexStringUnpadded.length % 2
              ? "0"
              : "";
            const hexString = padding + hexStringUnpadded;
            this._map.set(key++, decoder.decode(hexStringToBytes(hexString)));
          }
        }
      }   
    }
  }  

  protected fillMap() {
    this._codeRanges.length = 0;
    this._map.clear();

    const parser = new DataParser(this.decodedStreamData);
    const decoder = new TextDecoder("utf-16be");
    
    this.parseCodeRanges(parser);
    this.parseCharMap(parser, decoder);
    this.parseCharRangesMap(parser, decoder);

    // DEBUG
    // console.log(this);
    // console.log(this.decodedStreamDataChars);
    // console.log(this._map);
    // console.log(this._codeRanges);
    // console.log(this.hexBytesToUtfString(null));
  }

  /**
   * fill public properties from data using info/parser if available
   */
  protected override parseProps(parseInfo: ParseInfo) {
    super.parseProps(parseInfo);    
    this.fillMap();
  }
}
