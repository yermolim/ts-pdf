import { Quadruple } from "../../../common/types";
import { dictTypes } from "../../spec-constants";
import { CryptInfo } from "../../encryption/interfaces";
import { ParserResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";
import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";

/**PDF document page tree object */
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
  MediaBox: Quadruple;
  /**
   * (Optional; inheritable) The number of degrees by which the page shall be rotated 
   * clockwise when displayed or printed. The value shall be a multiple of 90
   */
  Rotate = 0;
  
  constructor() {
    super(dictTypes.PAGE_TREE);
  }
  
  static async parseAsync(parseInfo: ParserInfo): Promise<ParserResult<PageTreeDict>> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new PageTreeDict();
      await pdfObject.parsePropsAsync(parseInfo);
      return {value: pdfObject, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Parent) {
      bytes.push(...encoder.encode("/Parent "), ...this.Parent.toArray(cryptInfo));
    }
    if (this.Kids) {
      bytes.push(...encoder.encode("/Kids "), ...this.encodeSerializableArray(this.Kids, cryptInfo));
    }
    if (this.Count) {
      bytes.push(...encoder.encode("/Count "), ...encoder.encode(" " + this.Count));
    }
    if (this.MediaBox) {
      bytes.push(...encoder.encode("/MediaBox "), ...this.encodePrimitiveArray(this.MediaBox, encoder));
    }
    if (this.Rotate) {
      bytes.push(...encoder.encode("/Rotate "), ...encoder.encode(" " + this.Rotate));
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  protected override async parsePropsAsync(parseInfo: ParserInfo) {
    await super.parsePropsAsync(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    let i = await parser.skipToNextNameAsync(start, end - 1);
    let name: string;
    let parseResult: ParserResult<string>;
    while (true) {
      parseResult = await parser.parseNameAtAsync(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/Parent":            
            i = await this.parseRefPropAsync(name, parser, i);
            break;
            
          case "/Kids":            
            i = await this.parseRefArrayPropAsync(name, parser, i);
            break;
            
          case "/Count":
          case "/Rotate":
            i = await this.parseNumberPropAsync(name, parser, i, false);
            break;

          case "/MediaBox":
            i = await this.parseNumberArrayPropAsync(name, parser, i, true);
            break;
            
          default:
            // skip to next name
            i = await parser.skipToNextNameAsync(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };

    if (!this.Kids || isNaN(this.Count)) {
      throw new Error("Not all required properties parsed");
    }
  }
}
