import { keywordCodes } from "../../codes";
import { dictTypes, flatePredictors, FlatePredictor } from "../../const";
import { CryptInfo } from "../../interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { PdfDict } from "../core/pdf-dict";

export class FlateParamsDict extends PdfDict {
  /**
   * A code that selects the predictor algorithm, if any. 
   * If the value of this entry is 1, the filter shall assume 
   * that the normal algorithm was used to encode the data, without prediction. 
   * If the value is greater than 1, the filter shall assume 
   * that the data was differenced before being encoded, 
   * and Predictor selects the predictor algorithm
   */
  Predictor: FlatePredictor = flatePredictors.NONE;
  /**
   * (May be used only if Predictor is greater than 1) 
   * The number of interleaved color components per sample. 
   * Valid values are 1 to 4 (PDF 1.0+) and 1 or greater (PDF 1.3+)
   */
  Colors = 1;
  /**
   * (May be used only if Predictor is greater than 1) 
   * The number of bits used to represent each colour component in a sample. 
   * Valid values are 1, 2, 4, 8, and (PDF 1.5+) 16
   */
  BitsPerComponent: 1 | 2 | 4 | 8 | 16 = 8;
  /**
   * (May be used only if Predictor is greater than 1) 
   * The number of samples in each row
   */
  Columns = 1;
  
  constructor() {
    super(dictTypes.EMPTY);
  }

  static parse(parseInfo: ParseInfo): ParseResult<FlateParamsDict> {    
    const dict = new FlateParamsDict();
    const parseResult = dict.tryParseProps(parseInfo);

    return parseResult
      ? {value: dict, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray();  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Predictor) {
      bytes.push(...encoder.encode("/Predictor"), ...encoder.encode(" " + this.Predictor));
    }
    if (this.Colors) {
      bytes.push(...encoder.encode("/Colors"), ...encoder.encode(" " + this.Colors));
    }
    if (this.BitsPerComponent) {
      bytes.push(...encoder.encode("/BitsPerComponent"), ...encoder.encode(" " + this.BitsPerComponent));
    }
    if (this.Columns) {
      bytes.push(...encoder.encode("/Columns"), ...encoder.encode(" " + this.Columns));
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
          case "/Predictor":
            const predictor = parser.parseNumberAt(i, false);
            if (predictor) {
              this.Predictor = <FlatePredictor>predictor.value;
              i = predictor.end + 1;
            } else {              
              throw new Error("Can't parse /Colors property value");
            }
            break;
          case "/Colors":
            const colors = parser.parseNumberAt(i, false);
            if (colors) {
              this.Colors = colors.value;
              i = colors.end + 1;
            } else {              
              throw new Error("Can't parse /Colors property value");
            }
            break;
          case "/BitsPerComponent":
            const bits = parser.parseNumberAt(i, false);
            if (bits) {
              this.BitsPerComponent = <1 | 2 | 4 | 8 | 16>bits.value;
              i = bits.end + 1;
            } else {              
              throw new Error("Can't parse /BitsPerComponent property value");
            }
            break;
          case "/Columns":
            const columns = parser.parseNumberAt(i, false);
            if (columns) {
              this.Columns = columns.value;
              i = columns.end + 1;
            } else {              
              throw new Error("Can't parse /Columns property value");
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
