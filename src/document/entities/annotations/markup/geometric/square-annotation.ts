import { Rect } from "../../../../../common";
import { codes } from "../../../../codes";
import { annotationTypes } from "../../../../const";
import { CryptInfo } from "../../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../../data-parser";
import { GeometricAnnotation } from "./geometric-annotation";

export class SquareAnnotation extends GeometricAnnotation {
  /**
   * (Optional; PDF 1.5+) A set of four numbers that shall describe the numerical differences 
   * between two rectangles: the Rect entry of the annotation and the actual boundaries 
   * of the underlying square or circle. Such a difference may occur in situations 
   * where a border effect (described by BE) causes the size of the Rect to increase 
   * beyond that of the square or circle
   */
  RD: Rect;
    
  constructor() {
    super(annotationTypes.SQUARE);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<SquareAnnotation> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new SquareAnnotation();
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

    if (this.RD) {
      bytes.push(
        ...encoder.encode("/RD "), codes.L_BRACKET, 
        ...encoder.encode(this.RD[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.RD[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.RD[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.RD[3] + ""), codes.R_BRACKET,
      );
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
  protected parseProps(parseInfo: ParseInfo) {
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
          case "/RD":
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
