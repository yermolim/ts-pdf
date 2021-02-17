import { codes } from "../../../../codes";
import { AnnotationType } from "../../../../const";
import { CryptInfo } from "../../../../interfaces";
import { ParseInfo, ParseResult } from "../../../../parser/data-parser";
import { MarkupAnnotation } from "../markup-annotation";

export abstract class TextMarkupAnnotation extends MarkupAnnotation {
  /** 
   * (Required) An array of 8×n numbers specifying the coordinates of n quadrilaterals 
   * in default user space. Each quadrilateral shall encompasses a word 
   * or group of contiguous words in the text underlying the annotation
   */
  QuadPoints: number[];
  
  protected constructor(type: AnnotationType) {
    super(type);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray();  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.QuadPoints) {
      bytes.push(...encoder.encode("/QuadPoints"), codes.L_BRACKET);
      this.QuadPoints.forEach(x => bytes.push(...encoder.encode(" " + x)));
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
          case "/QuadPoints":
            const quadPoints = parser.parseNumberArrayAt(i, true);
            if (quadPoints) {
              this.QuadPoints = quadPoints.value;
              i = quadPoints.end + 1;
            } else {              
              throw new Error("Can't parse /QuadPoints property value");
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
        
    if (!this.QuadPoints) {
      // not all required properties parsed
      return false;
    }

    return true;
  }
}
