import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { PdfDict } from "../core/pdf-dict";

export class ResourceDict extends PdfDict {
  /** 
   * (Optional) A dictionary that maps resource names 
   * to graphics state parameter dictionaries 
   * */
  ExtGState: PdfDict;
  /** 
   * (Optional) A dictionary that maps each resource name 
   * to either the name of a device-dependent colour space 
   * or an array describing a colour space
   * */
  ColorSpace: PdfDict;
  /** 
   * (Optional) A dictionary that maps resource names to pattern objects
   * */
  Pattern: PdfDict;
  /** 
   * (Optional; PDF 1.3+) A dictionary that maps resource names to shading dictionaries
   * */
  Shading: PdfDict;
  /** 
   * (Optional) A dictionary that maps resource names to external objects
   * */
  XObject: PdfDict;
  /** 
   * (Optional) A dictionary that maps resource names to font dictionaries
   * */
  Font: PdfDict;
  /** 
   * (Optional) An array of predefined procedure set names
   * */
  ProcSet: string[];
  /** 
   * (Optional; PDF 1.2+) A dictionary that maps resource names 
   * to property list dictionaries for marked content
   * */
  Properties: PdfDict;
  
  constructor() {
    super(null);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<ResourceDict> {    
    const trailer = new ResourceDict();
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
          // TODO: add cases for all properties
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
