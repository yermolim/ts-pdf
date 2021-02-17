import { codes } from "../../../../codes";
import { AnnotationType } from "../../../../const";
import { DataCryptor } from "../../../../crypto";
import { ParseInfo, ParseResult } from "../../../../parser/data-parser";
import { MarkupAnnotation } from "../markup-annotation";

export abstract class GeometricAnnotation extends MarkupAnnotation {
  /** 
   * (Optional; PDF 1.4+) An array of numbers in the range 0.0 to 1.0 
   * specifying the interior color that shall be used to fill the annotation’s line endings
   */
  IC: number[];
  
  protected constructor(type: AnnotationType) {
    super(type);
  }
  
  toArray(cryptor?: DataCryptor): Uint8Array {
    const superBytes = super.toArray();  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.IC) {
      bytes.push(...encoder.encode("/IC"), codes.L_BRACKET);    
      this.IC.forEach(x => bytes.push( ...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
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
          case "/IC":
            const interiorColor = parser.parseNumberArrayAt(i, true);
            if (interiorColor) {
              this.IC = interiorColor.value;
              i = interiorColor.end + 1;
            } else {              
              throw new Error("Can't parse /IC property value");
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
