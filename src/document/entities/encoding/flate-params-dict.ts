import { dictTypes, flatePredictors, FlatePredictor } from "../../common/const";
import { Parser, ParseResult } from "../../parser";
import { Dict } from "../core/dict";

export class FlateParamsDict extends Dict {
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
  
  static parse(parser: Parser, start: number, end: number): ParseResult<FlateParamsDict> {    
    const dict = new FlateParamsDict();

    let i = start + 2;
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
              dict.Predictor = <FlatePredictor>predictor.value;
              i = predictor.end + 1;
            } else {              
              throw new Error("Can't parse /Colors property value");
            }
            break;
          case "/Colors":
            const colors = parser.parseNumberAt(i, false);
            if (colors) {
              dict.Colors = colors.value;
              i = colors.end + 1;
            } else {              
              throw new Error("Can't parse /Colors property value");
            }
            break;
          case "/BitsPerComponent":
            const bits = parser.parseNumberAt(i, false);
            if (bits) {
              dict.BitsPerComponent = <1 | 2 | 4 | 8 | 16>bits.value;
              i = bits.end + 1;
            } else {              
              throw new Error("Can't parse /BitsPerComponent property value");
            }
            break;
          case "/Columns":
            const columns = parser.parseNumberAt(i, false);
            if (columns) {
              dict.Columns = columns.value;
              i = columns.end + 1;
            } else {              
              throw new Error("Can't parse /Columns property value");
            }
            break;
          default:
            
            // skip to next name
            i = parser.skipToNextName(i, end);
            break;
        }
      } else {
        break;
      }
    };

    return {value: dict, start, end};
  }
}
