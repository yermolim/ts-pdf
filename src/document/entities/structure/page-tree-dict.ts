import { dictTypes, Rect } from "../../common/const";
import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { ObjectId } from "../common/object-id";
import { PdfDict } from "../core/pdf-dict";

export class PageTreeDict extends PdfDict {
  /**
   * (Required except in root node; prohibited in the root node; 
   * shall be an indirect reference) The page tree node that is the immediate parent of this one
   */
  Parent: ObjectId;
  /**
   * (Required) An array of indirect references to the immediate children of this node. 
   * The children shall only be page objects or other page tree nodes
   */
  Kids: ObjectId[];
  /**
   * (Required) The number of leaf nodes (page objects) 
   * that are descendants of this node within the page tree
   */
  Count: number;

  /**
   * (Optional; inheritable) A rectangle , expressed in default user space units, 
   * that shall define the boundaries of the physical medium 
   * on which the page shall be displayed or printed
   */
  MediaBox: Rect;
  /**
   * (Optional; inheritable) The number of degrees by which the page shall be rotated 
   * clockwise when displayed or printed. The value shall be a multiple of 90
   */
  Rotate: 0 | 90 | 180 | 270 = 0;
  
  constructor() {
    super(dictTypes.PAGE_TREE);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<PageTreeDict> {    
    const pageTree = new PageTreeDict();
    const parseResult = pageTree.tryParseProps(parseInfo);

    return parseResult
      ? {value: pageTree, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  toArray(): Uint8Array {
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
          case "/Parent":
            const parentId = ObjectId.parseRef(parser, i);
            if (parentId) {
              this.Parent = parentId.value;
              i = parentId.end + 1;
            } else {              
              throw new Error("Can't parse /Parent property value");
            }
            break;
          case "/Kids":
            const kidIds = ObjectId.parseRefArray(parser, i);
            if (kidIds) {
              this.Kids = kidIds.value;
              i = kidIds.end + 1;
            } else {              
              throw new Error("Can't parse /Kids property value");
            }
            break;
          case "/Count":
            const count = parser.parseNumberAt(i, false);
            if (count) {
              this.Count = count.value;
              i = count.end + 1;
            } else {              
              throw new Error("Can't parse /Count property value");
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

    if (!this.Kids || isNaN(this.Count)) {
      // not all required properties parsed
      return false;
    }

    return true;
  }
}
