import { AnnotationIconType, annotationIconTypes, 
  annotationMarkedStates, 
  annotationReviewStates, 
  AnnotationState, AnnotationStateModelType, 
  annotationStateModelTypes, annotationTypes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../data-parser";
import { MarkupAnnotation } from "./markup-annotation";

export class TextAnnotation extends MarkupAnnotation {
  /**
   * (Optional) A flag specifying whether the annotation shall initially be displayed open
   */
  Open = false;
  /**
   * (Optional) The name of an icon that shall be used in displaying the annotation
   */
  Name: AnnotationIconType;
  /**
   * (Optional; PDF 1.5+) The state to which the original annotation shall be set
   */
  State: AnnotationState;
  /**
   * (Required if State is present, otherwise optional; PDF 1.5+) 
   * The state model corresponding to State
   */
  StateModel: AnnotationStateModelType;
  
  constructor() {
    super(annotationTypes.TEXT);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<TextAnnotation> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new TextAnnotation();
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

    if (this.Open) {
      bytes.push(...encoder.encode("/Open "), ...encoder.encode(" " + this.Open));
    }
    if (this.Name) {
      bytes.push(...encoder.encode("/Name "), ...encoder.encode(this.Name));
    }
    if (this.State) {
      bytes.push(...encoder.encode("/State "), ...encoder.encode(this.State));
    }
    if (this.StateModel) {
      bytes.push(...encoder.encode("/StateModel "), ...encoder.encode(this.StateModel));
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
          case "/Open":
            i = this.parseBoolProp(name, parser, i);
            break;
          
          case "/Name":
            const iconType = parser.parseNameAt(i, true);
            if (iconType && (<string[]>Object.values(annotationIconTypes))
              .includes(iconType.value)) {
              this.Name = <AnnotationIconType>iconType.value;
              i = iconType.end + 1;              
            } else {              
              throw new Error("Can't parse /Name property value");
            }
            break;             
          case "/State":
            const state = parser.parseNameAt(i, true);
            if (state && (<string[]>Object.values(annotationMarkedStates))
              .concat((<string[]>Object.values(annotationReviewStates)))
              .includes(state.value)) {
              this.State = <AnnotationState>state.value;
              i = state.end + 1;              
            } else {              
              throw new Error("Can't parse /State property value");
            }
            break;          
          case "/StateModel":
            const stateModelType = parser.parseNameAt(i, true);
            if (stateModelType && (<string[]>Object.values(annotationStateModelTypes))
              .includes(stateModelType.value)) {
              this.StateModel = <AnnotationStateModelType>stateModelType.value;
              i = stateModelType.end + 1;              
            } else {              
              throw new Error("Can't parse /StateModel property value");
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
  }
}
