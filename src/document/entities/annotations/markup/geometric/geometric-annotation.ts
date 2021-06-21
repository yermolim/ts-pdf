import { Double, Quadruple } from "../../../../../common/types";
import { AnnotationDto } from "../../../../../common/annotation";
import { codes } from "../../../../encoding/char-codes";
import { AnnotationType } from "../../../../spec-constants";

import { CryptInfo } from "../../../../encryption/interfaces";
import { ParseResult } from "../../../../data-parse/data-parser";
import { ParserInfo } from "../../../../data-parse/parser-info";
import { MarkupAnnotation } from "../markup-annotation";

export interface GeometricAnnotationDto extends AnnotationDto {
  color: Quadruple;
  strokeWidth: number;
  strokeDashGap?: Double;
}

export abstract class GeometricAnnotation extends MarkupAnnotation {
  /** 
   * (Optional; PDF 1.4+) An array of numbers in the range 0.0 to 1.0 
   * specifying the interior color that shall be used to fill the annotation’s line endings
   */
  IC: number[];  
  
  protected constructor(type: AnnotationType) {
    super(type);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.IC) {
      bytes.push(...encoder.encode("/IC "), codes.L_BRACKET);    
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
  protected override parseProps(parseInfo: ParserInfo) {
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
          case "/IC":
            i = this.parseNumberArrayProp(name, parser, i, true);
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
