import { annotationTypes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../data-parser";
import { MarkupAnnotation } from "./markup-annotation";
import { RenderToSvgResult } from "../../../../common";

export const stampTypes = {
  DRAFT: "/Draft",
  NOT_APPROVED: "/NotApproved",
  APPROVED: "/Approved",
  AS_IS: "/AsIs",
  FOR_COMMENT: "/ForComment",
  EXPERIMENTAL: "/Experimental",
  FINAL: "/Final",
  SOLD: "/Sold",
  EXPIRED: "/Expired",
  PUBLIC: "/ForPublicRelease",
  NOT_PUBLIC: "/NotForPublicRelease",
  DEPARTMENTAL: "/Departmental",
  CONFIDENTIAL: "/Confidential",
  SECRET: "/TopSecret",
} as const;
export type StampType = typeof stampTypes[keyof typeof stampTypes];

export class StampAnnotation extends MarkupAnnotation {
  /**
   * (Optional) The name of an icon that shall be used in displaying the annotation
   */
  Name: StampType | string = stampTypes.DRAFT;
  
  constructor() {
    super(annotationTypes.STAMP);
  }  

  static parse(parseInfo: ParseInfo): ParseResult<StampAnnotation> {    
    const stamp = new StampAnnotation();
    const parseResult = stamp.parseProps(parseInfo);

    return parseResult
      ? {value: stamp, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }  
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Name) {
      bytes.push(...encoder.encode("/Name "), ...encoder.encode(this.Name));
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

    parser.sliceChars(start, end);
    
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
          case "/Name":
            i = this.parseNameProp(name, parser, i);
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
    
    if (!this.Name) {
      // not all required properties parsed
      return false;
    }

    return true;
  }
}
