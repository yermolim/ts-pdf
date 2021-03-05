import { valueTypes } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { GroupDict } from "../misc/group-dict";

export class TransparencyGroupDict extends GroupDict {
  /** 
   * (Sometimes required, as discussed below) The group color space, 
   * which is used for the following purposes: 
   * - As the color space into which colors are converted when painted into the group 
   * - As the blending color space in which objects are composited within the group 
   * - As the color space of the group as a whole when it in turn is painted as an object onto its backdrop 
   * 
   * The group color space may be any device or CIE-based color space that treats 
   * its components as independent additive or subtractive values in the range 0.0 to 1.0, 
   *
   * Ordinarily, the CS entry is allowed only for isolated transparency groups 
   * (those for which I, below, is true), and even then it is optional. 
   * However, this entry is required in the group attributes dictionary for any transparency group 
   * XObject that has no parent group or page from which to inherit—in particular, 
   * one that is the value of the G entry in a soft-mask dictionary of subtype Luminosity
   * 
   * Default value: the color space of the parent group or page 
   * into which this transparency group is painted. 
   * (The parent’s color space in turn can be either explicitly specified or inherited.) 
   * 
   * Note: For a transparency group XObject used as an annotation appearance, 
   * the default color space is inherited from the page on which the annotation appears
   * */
  CS: string;
  /** 
   * (Optional) A flag specifying whether the transparency group is isolated. 
   * If this flag is true, objects within the group are composited against 
   * a fully transparent initial backdrop; if false, they are com-posited 
   * against the group’s backdrop. Default value: false. In the group attributes 
   * dictionary for a page, the interpretation of this entry is slightly altered. 
   * In the normal case in which the page is imposed directly on the output medium, 
   * the page group is effectively isolated and the specified I value is ignored. 
   * But if the page is in turn used as an element of some other page, 
   * it is treated as if it were a transparency group XObject; the I value is interpreted 
   * in the normal way to determine whether the page group is isolated
   * */
  I = false;
  /** 
   * (Optional) A flag specifying whether the transparency group is a knockout group. 
   * If this flag is false, later objects within the group are composited with earlier 
   * ones with which they overlap; if true, they are composited with the group’s 
   * initial backdrop and overwrite (“knock out”) any earlier overlapping objects. 
   * Default value: false
   * */
  K = false;
  
  constructor() {
    super();
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<TransparencyGroupDict> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new TransparencyGroupDict();
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

    if (this.CS) {
      bytes.push(...encoder.encode("/CS "), ...encoder.encode(this.CS));
    }
    if (this.I) {
      bytes.push(...encoder.encode("/I "), ...encoder.encode(" " + this.I));
    }
    if (this.K) {
      bytes.push(...encoder.encode("/K "), ...encoder.encode(" " + this.K));
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
    if (this.S !== "/Transparency") {
      throw new Error("Not a transparency dict");
    }

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
          case "/CS":
            const colorSpaceEntryType = parser.getValueTypeAt(i);
            if (colorSpaceEntryType === valueTypes.NAME) {  
              const colorSpaceName = parser.parseNameAt(i);  
              if (colorSpaceName) {
                this.CS = colorSpaceName.value;
                i = colorSpaceName.end + 1;
                break;
              }
              throw new Error("Can't parse /CS property name");
            } else if (colorSpaceEntryType === valueTypes.ARRAY) { 
              const colorSpaceArrayBounds = parser.getArrayBoundsAt(i); 
              if (colorSpaceArrayBounds) {
                // TODO: implement array-defined color spaces
                i = colorSpaceArrayBounds.end + 1;
                break;
              }  
              throw new Error("Can't parse /CS value dictionary");  
            }
            throw new Error(`Unsupported /CS property value type: ${colorSpaceEntryType}`);
          
          case "/I":
          case "/K":
            i = this.parseBoolProp(name, parser, i);
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
