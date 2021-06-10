import { Double, Octuple, Quadruple } from "../../../../../common/types";

import { codes } from "../../../../codes";
import { AnnotationType } from "../../../../const";
import { CryptInfo } from "../../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../../data-parser";

import { AnnotationDto } from "../../annotation-dict";
import { MarkupAnnotation } from "../markup-annotation";

export interface TextMarkupAnnotationDto extends AnnotationDto {
  color: Quadruple;
  quadPoints: number[];
  strokeWidth?: number;
  strokeDashGap?: Double;
}

export abstract class TextMarkupAnnotation extends MarkupAnnotation {
  /** 
   * (Required) An array of 8×n numbers specifying the coordinates of n quadrilaterals 
   * in default user space. Each quadrilateral shall encompasses a word 
   * or group of contiguous words in the text underlying the annotation
   */
  QuadPoints: number[];
  
  protected constructor(type: AnnotationType) {
    super(type);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.QuadPoints) {
      bytes.push(...encoder.encode("/QuadPoints "), codes.L_BRACKET);
      this.QuadPoints.forEach(x => bytes.push(...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
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
  protected override parseProps(parseInfo: ParseInfo) {
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
          case "/QuadPoints":            
            i = this.parseNumberArrayProp(name, parser, i, true);
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
        
    if (!this.QuadPoints) {
      throw new Error("Not all required properties parsed");
    }
  }
  
  // disable translation
  protected override onTranslationPointerDown = (e: PointerEvent) => { };
  
  // disable handles
  protected override renderHandles(): SVGGraphicsElement[] {   
    return [];
  } 
}
