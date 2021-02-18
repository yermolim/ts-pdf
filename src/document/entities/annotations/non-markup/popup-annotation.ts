import { codes } from "../../../codes";
import { annotationTypes } from "../../../const";
import { CryptInfo } from "../../../interfaces";
import { ParseInfo, ParseResult } from "../../../data-parser";
import { ObjectId } from "../../common/object-id";
import { AnnotationDict } from "../annotation-dict";

export class PopupAnnotation extends AnnotationDict {
  /**
   * (Optional; shall be an indirect reference) The parent annotation 
   * with which this pop-up annotation shall be associated
   */
  Parent: ObjectId;
  /**
   * (Optional) A flag specifying whether the pop-up annotation shall initially be displayed open
   */
  Open = false;
  
  constructor() {
    super(annotationTypes.POPUP);
  } 
  
  static parse(parseInfo: ParseInfo): ParseResult<PopupAnnotation> {    
    const page = new PopupAnnotation();
    const parseResult = page.tryParseProps(parseInfo);

    return parseResult
      ? {value: page, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }  
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray();  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Parent) {
      bytes.push(...encoder.encode("/Parent"), codes.WHITESPACE, ...this.Parent.toArray());
    }
    if (this.Open) {
      bytes.push(...encoder.encode("/Open"), ...encoder.encode(" " + this.Open));
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
          case "/Parent":
            const parentId = ObjectId.parseRef(parser, i);
            if (parentId) {
              this.Parent = parentId.value;
              i = parentId.end + 1;
            } else {              
              throw new Error("Can't parse /Parent property value");
            }
            break;
          case "/Open":
            const opened = parser.parseBoolAt(i);
            if (opened) {
              this.Open = opened.value;
              i = opened.end + 1;
            } else {              
              throw new Error("Can't parse /Open property value");
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
