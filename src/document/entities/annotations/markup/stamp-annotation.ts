import { annotationTypes } from "../../../const";
import { getRandomUuid, Quadruple } from "../../../../common";
import { CryptInfo } from "../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../data-parser";

import { StampAnnotationDto } from "../../../../annotator/serialization";
import { stampForms } from "../../../../annotator/stamp-path-strings";

import { DateString } from "../../strings/date-string";
import { LiteralString } from "../../strings/literal-string";

import { XFormStream } from "../../streams/x-form-stream";
import { ResourceDict } from "../../appearance/resource-dict";
import { MarkupAnnotation } from "./markup-annotation";

export const stampTypes = {
  DRAFT: "/Draft",
  NOT_APPROVED: "/NotApproved",
  APPROVED: "/Approved",
  AS_IS: "/AsIs",
  FOR_COMMENT: "/ForComment",
  EXPERIMENTAL: "/Experimental",
  FINAL: "/Final",
  SOLD: "/Sold",
  EXPIRED: "/Expired",
  PUBLIC: "/ForPublicRelease",
  NOT_PUBLIC: "/NotForPublicRelease",
  DEPARTMENTAL: "/Departmental",
  CONFIDENTIAL: "/Confidential",
  SECRET: "/TopSecret",
} as const;
export type StampType = typeof stampTypes[keyof typeof stampTypes];

const stampBBox: Quadruple = [0, 0, 440, 120];
const halfStampBBox: Quadruple = [0, 0, 220, 60];

const redColor = [0.804, 0, 0];
const greenColor = [0, 0.804, 0];
const blueColor = [0, 0, 0.804];

export class StampAnnotation extends MarkupAnnotation {
  /**
   * (Optional) The name of an icon that shall be used in displaying the annotation
   */
  Name: StampType | string = stampTypes.DRAFT;  
  /**
   * (Optional; PDF 1.6+) A name describing the intent of the annotation
   */
  IT = "/Stamp";
  
  protected constructor() {
    super(annotationTypes.STAMP);
  }

  static createStandard(type: StampType, userName: string): StampAnnotation {
    const nowString = new Date().toISOString();
    const dto: StampAnnotationDto = {
      uuid: getRandomUuid(),
      annotationType: "/Stamp",
      pageId: null,

      dateCreated: nowString,
      dateModified: nowString,
      author: userName || "unknown",

      rect: halfStampBBox,
      matrix: [1, 0, 0, 1, 0, 0],

      stampType: type,
      stampImageData: null,
    };

    return this.createFromDto(dto);
  }
  
  static createFromDto(dto: StampAnnotationDto): StampAnnotation {
    if (dto.annotationType !== "/Stamp") {
      throw new Error("Invalid annotation type");
    }

    const created = DateString.fromDate(new Date(dto.dateCreated));
    const modified = DateString.fromDate(new Date(dto.dateModified));

    const stampForm = new XFormStream();
    stampForm.LastModified = modified;
    stampForm.BBox = stampBBox;
    stampForm.Filter = "/FlateDecode";

    let color: number[];
    let subject: string;
    switch (dto.stampType) {
      case "/Draft":        
        stampForm.setTextStreamData(stampForms.DRAFT);
        color = redColor;
        subject = "Draft";
        break;
      case "/Approved":        
        stampForm.setTextStreamData(stampForms.APPROVED);
        color = greenColor;
        subject = "Approved";
        break;
      case "/NotApproved":        
        stampForm.setTextStreamData(stampForms.NOT_APPROVED);
        color = redColor;
        subject = "Not Approved";
        break;
      case "/Departmental":        
        stampForm.setTextStreamData(stampForms.DEPARTMENTAL);
        color = blueColor;
        subject = "Departmental";
        break;
      case "/Confidential":        
        stampForm.setTextStreamData(stampForms.CONFIDENTIAL);
        color = redColor;
        subject = "Confidential";
        break;
      case "/Final":        
        stampForm.setTextStreamData(stampForms.FINAL);
        color = redColor;
        subject = "Final";
        break;
      case "/Expired":        
        stampForm.setTextStreamData(stampForms.EXPIRED);
        color = redColor;
        subject = "Expired";
        break;
      case "/AsIs":        
        stampForm.setTextStreamData(stampForms.AS_IS);
        color = redColor;
        subject = "As Is";
        break;
      case "/Sold":        
        stampForm.setTextStreamData(stampForms.SOLD);
        color = blueColor;
        subject = "Sold";
        break;
      case "/Experimental":        
        stampForm.setTextStreamData(stampForms.EXPERIMENTAL);
        color = blueColor;
        subject = "Experimental";
        break;
      case "/ForComment":        
        stampForm.setTextStreamData(stampForms.FOR_COMMENT);
        color = greenColor;
        subject = "For Comment";
        break;
      case "/TopSecret":        
        stampForm.setTextStreamData(stampForms.TOP_SECRET);
        color = redColor;
        subject = "Top Secret";
        break;
      case "/TopSecret":        
        stampForm.setTextStreamData(stampForms.TOP_SECRET);
        color = redColor;
        subject = "Top Secret";
        break;
      case "/ForPublicRelease":        
        stampForm.setTextStreamData(stampForms.FOR_PUBLIC_RELEASE);
        color = greenColor;
        subject = "For Public Release";
        break;
      case "/NotForPublicRelease":        
        stampForm.setTextStreamData(stampForms.NOT_FOR_PUBLIC_RELEASE);
        color = redColor;
        subject = "Not For Public Release";
        break;
      default:
        throw new Error(`Stamp type '${dto.stampType}' is not supported`);
    }
    const r = color[0].toFixed(3);
    const g = color[1].toFixed(3);
    const b = color[2].toFixed(3);
    const colorString = `${r} ${g} ${b} rg ${r} ${g} ${b} RG`;
    
    const stampApStream = new XFormStream();
    stampApStream.LastModified = modified;
    stampApStream.BBox = stampBBox;
    stampApStream.Resources = new ResourceDict();
    stampApStream.Resources.setXObject("/Fm", stampForm);
    stampApStream.Filter = "/FlateDecode";
    stampApStream.setTextStreamData(`q 1 0 0 -1 0 ${stampBBox[3]} cm ${colorString} 1 j 8.58 w /Fm Do Q`);

    const stampAnnotation = new StampAnnotation();
    stampAnnotation.Contents = LiteralString.fromString(subject);
    stampAnnotation.Subj = LiteralString.fromString(subject);
    stampAnnotation.C = color;
    stampAnnotation.CA = 1;
    stampAnnotation.apStream = stampApStream;
  
    stampAnnotation.$name = dto.uuid;
    stampAnnotation.CreationDate = created;
    stampAnnotation.M = modified;
    stampAnnotation.NM = LiteralString.fromString(dto.uuid);
    stampAnnotation.T = LiteralString.fromString(dto.author || "unknown");
    stampAnnotation.Name = dto.stampType;
    stampAnnotation.Rect = dto.rect;
    stampApStream.Matrix = dto.matrix;    

    // TODO: add reading custom image data

    const proxy = new Proxy<StampAnnotation>(stampAnnotation, stampAnnotation.onChange);
    stampAnnotation._proxy = proxy;
    stampAnnotation._added = true;
    return proxy;
  }

  static parse(parseInfo: ParseInfo): ParseResult<StampAnnotation> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new StampAnnotation();
      pdfObject.parseProps(parseInfo); 
      const proxy = new Proxy<StampAnnotation>(pdfObject, pdfObject.onChange);
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

    if (this.Name) {
      bytes.push(...encoder.encode("/Name "), ...encoder.encode(this.Name));
    }
    if (this.IT) {
      bytes.push(...encoder.encode("/IT "), ...encoder.encode(this.IT));
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  toDto(): StampAnnotationDto {
    return {
      annotationType: "/Stamp",
      uuid: this.$name,
      pageId: this.$pageId,

      dateCreated: this.CreationDate?.date.toISOString() || new Date().toISOString(),
      dateModified: this.M 
        ? this.M instanceof LiteralString
          ? this.M.literal
          : this.M.date.toISOString()
        : new Date().toISOString(),
      author: this.T?.literal,

      rect: this.Rect,
      matrix: this.apStream?.Matrix,

      stampType: this.Name,
      stampImageData: null, // TODO: add export custom image data
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
          case "/Name":
            i = this.parseNameProp(name, parser, i);
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
    
    if (!this.Name) {
      throw new Error("Not all required properties parsed");
    }
  }
}
