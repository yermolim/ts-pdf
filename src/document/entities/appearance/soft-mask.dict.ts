import { dictTypes, SoftMaskType, softMaskTypes } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { codes } from "../../codes";

export class SoftMaskDict extends PdfDict {
  /** 
   * (Required) A subtype specifying the method to be used in deriving 
   * the mask values from the transparency group specified by the G entry: 
   * [/Alpha] Use the group’s computed alpha, disregarding its color. 
   * [/Luminosity] Convert the group’s computed color to a single-component luminosity value
   * */
  S: SoftMaskType;
  /**
   * (Required) A transparency group XObject  to be used as the source of alpha 
   * or color values for deriving the mask. If the subtype S is Luminosity, 
   * the group attributes dictionary must contain a CS entry defining the color space 
   * in which the compositing computation is to be performed
   */
  G: ObjectId;
  /** 
   * (Optional) An array of component values specifying the color 
   * to be used as the backdrop against which to composite the transparency group XObject G. 
   * This entry is consulted only if the subtype S is Luminosity. 
   * The array consists of n numbers, where n is the number of components 
   * in the color space specified by the CS entry in the group attributes dictionary
   * */
  BC: number[];
  /**
   * (Optional) A function object specifying the transfer function 
   * to be used in deriving the mask values. The function accepts one input, 
   * the computed group alpha or luminosity (depending on the value of the subtype S), 
   * and returns one output, the resulting mask value. Both the input and output 
   * must be in the range 0.0 to 1.0; if the computed output falls outside this range, 
   * it is forced to the nearest valid value. 
   * The name Identity may be specified 
   * in place of a function object to designate the identity function.
   */
  TR: "/Identity" = "/Identity";

  constructor() {
    super(dictTypes.SOFT_MASK);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<SoftMaskDict> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new SoftMaskDict();
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

    if (this.S) {
      bytes.push(...encoder.encode("/S "), ...encoder.encode(this.S));
    }
    if (this.G) {
      bytes.push(...encoder.encode("/G "), codes.WHITESPACE, ...this.G.toArray(cryptInfo));
    }
    if (this.BC) {
      bytes.push(...encoder.encode("/BC "), codes.L_BRACKET);
      this.BC.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
    }
    if (this.TR) {
      bytes.push(...encoder.encode("/TR "), ...encoder.encode(" " + this.TR));
    }    
    //TODO: handle TR as function

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
          case "/S":
            const softMaskType = parser.parseNameAt(i, true);
            if (softMaskType && (<string[]>Object.values(softMaskTypes))
              .includes(softMaskType.value)) {
              this.S = <SoftMaskType>softMaskType.value;
              i = softMaskType.end + 1;              
            } else {              
              throw new Error("Can't parse /S property value");
            }
            break;         
          
          case "/G":
            i = this.parseRefProp(name, parser, i);
            break; 
          
          case "/BC":            
            i = this.parseNumberArrayProp(name, parser, i);
            break;   
          
          //TODO: handle TR as function 
          case "/TR":
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
