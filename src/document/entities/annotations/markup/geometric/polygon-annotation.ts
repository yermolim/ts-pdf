import { annotationTypes } from "../../../../const";
import { CryptInfo } from "../../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../../data-parser";
import { PolyAnnotation } from "./poly-annotation";
import { RenderToSvgResult } from "../../../../../common";

export class PolygonAnnotation extends PolyAnnotation {
    
  constructor() {
    super(annotationTypes.POLYGON);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<PolygonAnnotation> {    
    const text = new PolygonAnnotation();
    const parseResult = text.tryParseProps(parseInfo);

    return parseResult
      ? {value: text, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }  
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    return superBytes;
  }  
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected tryParseProps(parseInfo: ParseInfo): boolean {
    const superIsParsed = super.tryParseProps(parseInfo);
    if (!superIsParsed) {
      return false;
    }

    return true;
  }
}
