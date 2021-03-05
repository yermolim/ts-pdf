import { codes } from "../../../../codes";
import { annotationTypes, LineEndingType, lineEndingTypes } from "../../../../const";
import { CryptInfo } from "../../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../../data-parser";
import { PolyAnnotation } from "./poly-annotation";
import { RenderToSvgResult } from "../../../../../common";

export class PolylineAnnotation extends PolyAnnotation {  
  /**
   * (Optional; PDF 1.4+) An array of two names specifying the line ending styles 
   * that shall be used in drawing the line. The first and second elements 
   * of the array shall specify the line ending styles for the endpoints defined, 
   * respectively, by the first and second pairs of coordinates, 
   * (x1, y1)and (x2, y2), in the L array
   */
  LE: [startType: LineEndingType, endType: LineEndingType] = [lineEndingTypes.NONE, lineEndingTypes.NONE];

  constructor() {
    super(annotationTypes.POLYLINE);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<PolylineAnnotation> {    
    const text = new PolylineAnnotation();
    const parseResult = text.parseProps(parseInfo);

    return parseResult
      ? {value: text, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }  
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.LE) {
      bytes.push(...encoder.encode("/LE "), codes.L_BRACKET);
      this.LE.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(x)));
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
  protected parseProps(parseInfo: ParseInfo): boolean {
    const superIsParsed = super.parseProps(parseInfo);
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
          case "/LE":
            const lineEndings = parser.parseNameAt(i, true);
            if (lineEndings
                && (<string[]>Object.values(lineEndingTypes)).includes(lineEndings.value[0])
                && (<string[]>Object.values(lineEndingTypes)).includes(lineEndings.value[1])) {
              this.LE = [
                <LineEndingType>lineEndings.value[0],
                <LineEndingType>lineEndings.value[1],
              ];
              i = lineEndings.end + 1;
            } else {              
              throw new Error("Can't parse /LE property value");
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
