import { codes } from "../../../codes";
import { annotationTypes, JustificationType, 
  justificationTypes, 
  LineEndingType, lineEndingTypes, Rect } from "../../../const";
import { DataCryptor } from "../../../crypto";
import { ParseInfo, ParseResult } from "../../../parser/data-parser";
import { LiteralString } from "../../common/literal-string";
import { MarkupAnnotation } from "./markup-annotation";

export const freeTextIntents = {
  PLAIN_TEXT: "/FreeText",
  WITH_CALLOUT: "/FreeTextCallout",
  CLICK_TO_TYPE: "/FreeTextTypeWriter",
} as const;
export type FreeTextIntent = typeof freeTextIntents[keyof typeof freeTextIntents];

export class FreeTextAnnotation extends MarkupAnnotation {
  /**
   * (Required) The default appearance string that shall be used in formatting the text. 
   * The annotation dictionary’s AP entry, if present, shall take precedence over the DA entry
   */
  DA: LiteralString;
  /**
   * (Optional; PDF 1.4+) A code specifying the form of quadding (justification) 
   * that shall be used in displaying the annotation’s text
   */
  Q: JustificationType;
  /**
   * (Optional; PDF 1.5+) A default style
   */
  DS: LiteralString;
  /**
   * (Optional; meaningful only if IT is FreeTextCallout; PDF 1.6+) 
   * An array of four or six numbers specifying a callout line 
   * attached to the free text annotation. Six numbers [x1y1x2y2x3y3] 
   * represent the starting, knee point, and ending coordinates of the line in default user space. 
   * Four numbers [x1y1x2y2] represent the starting and ending coordinates of the line
   */
  CL: number[];
  /**
   * (Optional; PDF 1.6+) A name describing the intent of the free text annotation
   */
  IT: FreeTextIntent = freeTextIntents.PLAIN_TEXT;
  /**
   * (Optional; PDF 1.6+) A set of four numbers describing the numerical differences 
   * between two rectangles: the Rect entry of the annotation and a rectangle contained 
   * within that rectangle. The inner rectangle is where the annotation’s text should be displayed. 
   * Any border styles and/or border effects specified by BS and BE entries, respectively, 
   * shall be applied to the border of the inner rectangle
   */
  RD: Rect;
  /**
   * (Optional; meaningful only if CL is present; PDF 1.6+) 
   * A name specifying the line ending style that shall be used in drawing the callout line 
   * specified in CL. The name shall specify the line ending style for the endpoint 
   * defined by the pairs of coordinates (x1, y1)
   */
  LE: LineEndingType = lineEndingTypes.NONE;
  
  constructor() {
    super(annotationTypes.FREE_TEXT);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<FreeTextAnnotation> {    
    const freeText = new FreeTextAnnotation();
    const parseResult = freeText.tryParseProps(parseInfo);

    return parseResult
      ? {value: freeText, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  toArray(cryptor?: DataCryptor): Uint8Array {
    const superBytes = super.toArray();  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.DA) {
      bytes.push(...encoder.encode("/DA"), ...this.DA.toArray());
    }
    if (this.Q) {
      bytes.push(...encoder.encode("/Q"), ...encoder.encode(" " + this.Q));
    }
    if (this.DS) {
      bytes.push(...encoder.encode("/DS"), ...this.DS.toArray());
    }
    if (this.CL) {
      bytes.push(...encoder.encode("/CL"), codes.L_BRACKET);
      this.CL.forEach(x => bytes.push(...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
    }
    if (this.IT) {
      bytes.push(...encoder.encode("/IT"), ...encoder.encode(this.IT));
    }
    if (this.RD) {
      bytes.push(
        ...encoder.encode("/RD"), codes.L_BRACKET, 
        ...encoder.encode(this.RD[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.RD[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.RD[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.RD[3] + ""), codes.R_BRACKET,
      );
    }
    if (this.LE) {
      bytes.push(...encoder.encode("/LE"), ...encoder.encode(this.LE));
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
          case "/DA":
            const appearanceString = LiteralString.parse(parser, i);
            if (appearanceString) {
              this.DA = appearanceString.value;
              i = appearanceString.end + 1;
            } else {              
              throw new Error("Can't parse /DA property value");
            }
            break;
          case "/Q":
            const justification = parser.parseNumberAt(i, true);
            if (justification && (<number[]>Object.values(justificationTypes))
              .includes(justification.value)) {
              this.Q = <JustificationType>justification.value;
              i = justification.end + 1;              
            } else {              
              throw new Error("Can't parse /Q property value");
            }
            break;            
          case "/DS":
            const style = LiteralString.parse(parser, i);
            if (style) {
              this.DS = style.value;
              i = style.end + 1;
            } else {              
              throw new Error("Can't parse /DS property value");
            }
            break;
          case "/CL":
            const callout = parser.parseNumberArrayAt(i, true);
            if (callout) {
              this.CL = callout.value;
              i = callout.end + 1;
            } else {              
              throw new Error("Can't parse /CL property value");
            }
            break;
          case "/IT":
            const intent = parser.parseNameAt(i, true);
            if (intent) {
              if (intent.value === "/FreeTextTypewriter") { // common typo                
                this.IT = freeTextIntents.CLICK_TO_TYPE;
                i = intent.end + 1; 
                break;   
              }
              else if ((<string[]>Object.values(freeTextIntents)).includes(intent.value)) {
                this.IT = <FreeTextIntent>intent.value;
                i = intent.end + 1;    
                break;          
              }
            }
            throw new Error("Can't parse /IT property value");
          case "/RD":
            const innerRect = parser.parseNumberArrayAt(i, true);
            if (innerRect) {
              this.RD = [
                innerRect.value[0],
                innerRect.value[1],
                innerRect.value[2],
                innerRect.value[3],
              ];
              i = innerRect.end + 1;
            } else {              
              throw new Error("Can't parse /RD property value");
            }
            break;
          case "/LE":
            const lineEndingType = parser.parseNameAt(i, true);
            if (lineEndingType && (<string[]>Object.values(lineEndingTypes))
              .includes(lineEndingType.value)) {
              this.LE = <LineEndingType>lineEndingType.value;
              i = lineEndingType.end + 1;              
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
        
    if (!this.DA) {
      // not all required properties parsed
      return false;
    }

    return true;
  }
}
