import { Quadruple } from "../../../../common/types";
import { getRandomUuid } from "../../../../common/uuid";

import { AnnotationIconType, annotationIconTypes, 
  annotationMarkedStates, 
  annotationReviewStates, 
  AnnotationState, AnnotationStateModelType, 
  annotationStateModelTypes, annotationTypes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../data-parser";

import { DateString } from "../../strings/date-string";
import { LiteralString } from "../../strings/literal-string";
import { XFormStream } from "../../streams/x-form-stream";
import { ResourceDict } from "../../appearance/resource-dict";
import { MarkupAnnotation } from "./markup-annotation";
import { AnnotationDto } from "../annotation-dict";


//#region additional stamp annotation types and constants
export const textNoteTypes = {
  NOTE: "/Note",
} as const;
export type TextNoteType = typeof textNoteTypes[keyof typeof textNoteTypes];

const textNoteForms = {
  NOTE:
  `25 10 m
  175 10 l
  175 10 190 10 190 25 c
  190 135 l
  190 135 190 150 175 150 c
  95 150 l
  10 190 l
  35 150 l
  25 150 l
  25 150 10 150 10 135 c
  10 25 l
  10 25 10 10 25 10 c
  b  
  35 35 m
  165 35 l
  S  
  35 55 m
  165 55 l
  S
  35 75 m
  125 75 l
  S
  35 95 m
  165 95 l
  S
  35 115 m
  115 115 l
  S
  `,
} as const;

interface NoteCreationInfo {   
  textStreamData: string;
  fillColor: [r: number, g: number, b: number];
  subject: string;
  bBox: Quadruple;
  rect: Quadruple;
}

const textNoteCreationInfos = {
  "/Note": {        
    textStreamData: textNoteForms.NOTE,
    fillColor: [1, 1, 0.4],
    subject: "Note",
    bBox: [0, 0, 200, 200],
    rect: [0, 0, 25, 25],
  },
} as const;

export interface TextAnnotationDto extends AnnotationDto {
  color: Quadruple;
  textNoteType?: AnnotationIconType;
  textNoteState?: AnnotationState;
  textNoteStateModel?: AnnotationStateModelType;
}
//#endregion

export class TextAnnotation extends MarkupAnnotation {
  /**
   * (Optional) A flag specifying whether the annotation shall initially be displayed open
   */
  Open = false;
  /**
   * (Optional) The name of an icon that shall be used in displaying the annotation
   */
  Name: AnnotationIconType = annotationIconTypes.NOTE;
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
  
  static createStandard(userName: string, color: Quadruple,
    type: AnnotationIconType = annotationIconTypes.NOTE): TextAnnotation {
    const nowString = new Date().toISOString();
    const dto: TextAnnotationDto = {
      uuid: getRandomUuid(),
      annotationType: "/Text",
      pageId: null,

      dateCreated: nowString,
      dateModified: nowString,
      author: userName || "unknown",

      textContent: null,

      rect: null,
      matrix: null,

      color,
      textNoteType: type,
    };

    return this.createFromDto(dto);
  }
  
  static createFromDto(dto: TextAnnotationDto): TextAnnotation {
    if (dto.annotationType !== "/Text") {
      throw new Error("Invalid annotation type");
    }

    const created = DateString.fromDate(new Date(dto.dateCreated));
    const modified = DateString.fromDate(new Date(dto.dateModified));

    const stampForm = new XFormStream();
    stampForm.LastModified = modified;
    stampForm.Filter = "/FlateDecode";

    // set the stamp options using the default stamp information dictionary
    const stampCreationInfo: NoteCreationInfo = textNoteCreationInfos[dto.textNoteType];
    if (!stampCreationInfo) {
      throw new Error(`Stamp type '${dto.textNoteType}' is not supported`);
    }
    stampForm.setTextStreamData(stampCreationInfo.textStreamData);
    const strokeColor = dto.color;
    const fillColor = stampCreationInfo.fillColor;
    const subject = stampCreationInfo.subject;
    const bBox = stampCreationInfo.bBox;
    
    stampForm.BBox = bBox;

    const strokeR = strokeColor[0].toFixed(3);
    const strokeG = strokeColor[1].toFixed(3);
    const strokeB = strokeColor[2].toFixed(3);
    const fillR = fillColor[0].toFixed(3);
    const fillG = fillColor[1].toFixed(3);
    const fillB = fillColor[2].toFixed(3);
    const strokeString = `${fillR} ${fillG} ${fillB} rg ${strokeR} ${strokeG} ${strokeB} RG`;
    
    const apStream = new XFormStream();
    apStream.LastModified = modified;
    apStream.BBox = bBox;
    apStream.Matrix = dto.matrix || [1, 0, 0, 1, 0, 0];  
    apStream.Resources = new ResourceDict();
    apStream.Resources.setXObject("/Fm", stampForm);
    apStream.Filter = "/FlateDecode";
    apStream.setTextStreamData(`q 1 0 0 -1 0 ${bBox[3]} cm ${strokeString} 1 j 8.58 w /Fm Do Q`);

    const annotation = new TextAnnotation();
    annotation.$name = dto.uuid;  
    annotation.NM = LiteralString.fromString(dto.uuid); // identifier
    annotation.T = LiteralString.fromString(dto.author || "unknown");
    annotation.M = modified;
    annotation.CreationDate = created;
    annotation.Contents = dto.textContent 
      ? LiteralString.fromString(dto.textContent) 
      : LiteralString.fromString(subject);

    annotation.Subj = LiteralString.fromString(subject);
    annotation.Name = dto.textNoteType;
    annotation.State = dto.textNoteState;
    annotation.StateModel = dto.textNoteStateModel;
    annotation.Rect = dto.rect || stampCreationInfo.rect;
    annotation.C = strokeColor;
    annotation.CA = 1; // opacity
    annotation.apStream = apStream;

    const proxy = new Proxy<TextAnnotation>(annotation, annotation.onChange);
    annotation._proxy = proxy;
    annotation._added = true;
    return proxy;
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<TextAnnotation> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new TextAnnotation();
      pdfObject.parseProps(parseInfo);
      const proxy = new Proxy<TextAnnotation>(pdfObject, pdfObject.onChange);
      pdfObject._proxy = proxy;
      return {value: proxy, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
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
  
  toDto(): TextAnnotationDto {
    const color = this.getColorRect();

    return {
      annotationType: "/Text",
      uuid: this.$name,
      pageId: this.$pageId,

      dateCreated: this.CreationDate?.date.toISOString() || new Date().toISOString(),
      dateModified: this.M 
        ? this.M instanceof LiteralString
          ? this.M.literal
          : this.M.date.toISOString()
        : new Date().toISOString(),
      author: this.T?.literal,

      textContent: this.Contents?.literal,

      rect: this.Rect,
      bbox: this.apStream?.BBox,
      matrix: this.apStream?.Matrix,

      color,
      textNoteType: this.Name,
      textNoteState: this.State,
      textNoteStateModel: this.StateModel,
    };
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
  
  // disable handles
  protected renderHandles(): SVGGraphicsElement[] {   
    return [];
  } 
}
