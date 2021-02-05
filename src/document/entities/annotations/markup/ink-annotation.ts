import { annotationTypes } from "../../../common/const";
import { ParseInfo, ParseResult } from "../../../parser/data-parser";
import { MarkupAnnotation } from "./markup-annotation";

export class InkAnnotation extends MarkupAnnotation {
  /**
   * (Required) An array of n arrays, each representing a stroked path. 
   * Each array shall be a series of alternating horizontal and vertical coordinates 
   * in default user space, specifying points along the path. 
   * When drawn, the points shall be connected by straight lines or curves 
   * in an implementation-dependent way
   */
  InkList: number[][];
  
  constructor() {
    super(annotationTypes.INK);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<InkAnnotation> {    
    const trailer = new InkAnnotation();
    const parseResult = trailer.tryParseProps(parseInfo);

    return parseResult
      ? {value: trailer, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
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
          case "/InkList":
            const isArray = parser.getValueTypeAt(i);
            if (isArray) {
              const inkList: number[][] = [];
              let inkSubList: ParseResult<number[]>;
              let inkArrayPos = i++;
              while (true) {
                inkSubList = parser.parseNumberArrayAt(inkArrayPos);
                if (!inkSubList) {
                  break;
                }
                inkList.push(inkSubList.value);
                inkArrayPos = inkSubList.end + 1;
              }
              this.InkList = inkList;
              break;
            }
            throw new Error("Can't parse /InkList property value");
          default:
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
    
    if (!this.InkList?.length) {
      // not all required properties parsed
      return false;
    }

    return true;
  }
}
