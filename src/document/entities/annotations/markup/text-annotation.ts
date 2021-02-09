import { AnnotationIconType, annotationIconTypes, 
  annotationMarkedStates, 
  annotationReviewStates, 
  AnnotationState, AnnotationStateModelType, 
  annotationStateModelTypes, annotationTypes } from "../../../common/const";
import { ParseInfo, ParseResult } from "../../../parser/data-parser";
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
    const text = new TextAnnotation();
    const parseResult = text.tryParseProps(parseInfo);

    return parseResult
      ? {value: text, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
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
          case "/Open":
            const opened = parser.parseBoolAt(i, true);
            if (opened) {
              this.Open = opened.value;
              i = opened.end + 1;
            } else {              
              throw new Error("Can't parse /Open property value");
            }
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

    return true;
  }
}
