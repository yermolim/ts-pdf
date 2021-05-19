import { StandardStampCreationInfo, standardStampCreationInfos } 
  from "../../../../common/drawing";

import { CryptInfo } from "../../../common-interfaces";
import { annotationTypes, colorSpaces } from "../../../const";
import { ParseInfo, ParseResult } from "../../../data-parser";

import { DateString } from "../../strings/date-string";
import { LiteralString } from "../../strings/literal-string";

import { XFormStream } from "../../streams/x-form-stream";
import { ImageStream } from "../../streams/image-stream";
import { ResourceDict } from "../../appearance/resource-dict";

import { MarkupAnnotation } from "./markup-annotation";
import { AnnotationDto } from "../annotation-dict";

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

export interface StampAnnotationDto extends AnnotationDto {
  stampType: string;
  stampSubject?: string;
  stampImageData?: number[];
}

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
  
  static createFromDto(dto: StampAnnotationDto): StampAnnotation {
    if (dto.annotationType !== "/Stamp") {
      throw new Error("Invalid annotation type");
    }

    const created = DateString.fromDate(new Date(dto.dateCreated));
    const modified = DateString.fromDate(new Date(dto.dateModified)); 

    const apStream = new XFormStream();
    apStream.LastModified = modified;
    apStream.Filter = "/FlateDecode";
    apStream.Resources = new ResourceDict();
    apStream.Matrix = dto.matrix || [1, 0, 0, 1, 0, 0];    
    
    const annotation = new StampAnnotation();
    annotation.$name = dto.uuid;  
    annotation.NM = LiteralString.fromString(dto.uuid); // identifier
    annotation.T = LiteralString.fromString(dto.author || "unknown");
    annotation.M = modified;
    annotation.CreationDate = created;
    annotation.Name = dto.stampType;   
    annotation.apStream = apStream;
    
    // set the stamp options using the default stamp information dictionary
    const stampCreationInfo: StandardStampCreationInfo = 
      standardStampCreationInfos[dto.stampType];
    if (stampCreationInfo) {
      // standard stamp
      const stampForm = new XFormStream();
      stampForm.LastModified = modified;
      stampForm.Filter = "/FlateDecode";

      stampForm.setTextStreamData(stampCreationInfo.textStreamData);
      const color = stampCreationInfo.color;
      const subject = stampCreationInfo.subject;
      const bBox = stampCreationInfo.bBox;
      const rect = dto.rect || stampCreationInfo.rect;
      
      stampForm.BBox = bBox;

      const r = color[0].toFixed(3);
      const g = color[1].toFixed(3);
      const b = color[2].toFixed(3);
      const colorString = `${r} ${g} ${b} rg ${r} ${g} ${b} RG`;

      apStream.BBox = bBox;
      apStream.Resources.setXObject("/Fm", stampForm);
      apStream.setTextStreamData(`q 1 0 0 -1 0 ${bBox[3]} cm ${colorString} 1 j 8.58 w /Fm Do Q`);
      
      annotation.Rect = rect;
      annotation.Contents = dto.textContent 
        ? LiteralString.fromString(dto.textContent) 
        : LiteralString.fromString(subject);
      annotation.Subj = LiteralString.fromString(subject);
      annotation.C = color;
      annotation.CA = 1; // opacity
    } else if (dto.stampImageData?.length && !(dto.stampImageData.length % 4)) {
      // custom stamp
      const data = new Uint8Array(dto.stampImageData);

      const stampMask = new ImageStream();
      stampMask.Filter = "/FlateDecode";
      stampMask.BitsPerComponent = 8;
      stampMask.Width = dto.rect[2];
      stampMask.Height = dto.rect[3];
      stampMask.ColorSpace = colorSpaces.GRAYSCALE;
      stampMask.streamData = data.filter((v, i) => (i + 1) % 4 === 0); // take only alpha values

      const stampImage = new ImageStream();
      stampImage.Filter = "/FlateDecode";
      stampImage.BitsPerComponent = 8;
      stampImage.Width = dto.rect[2];
      stampImage.Height = dto.rect[3];
      stampImage.ColorSpace = colorSpaces.RGB;
      stampImage.streamData = data.filter((v, i) => (i + 1) % 4 !== 0); // skip alpha values
      stampImage.sMask = stampMask;
      
      apStream.BBox = dto.bbox;
      apStream.Resources.setXObject("/Im", stampImage);
      apStream.setTextStreamData("q /Im Do Q"); // TODO: check if matrix needed
      
      annotation.Rect = dto.rect;
      annotation.Contents = dto.textContent 
        ? LiteralString.fromString(dto.textContent) 
        : LiteralString.fromString(dto.stampType);
      annotation.Subj = dto.stampSubject 
        ? LiteralString.fromString(dto.stampSubject) 
        : LiteralString.fromString(dto.stampType);
    } else {
      throw new Error("Custom stamp has no valid image data");
    }

    const proxy = new Proxy<StampAnnotation>(annotation, annotation.onChange);
    annotation._proxy = proxy;
    annotation._added = true;
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

      textContent: this.Contents?.literal,

      rect: this.Rect,
      bbox: this.apStream?.BBox,
      matrix: this.apStream?.Matrix,

      stampType: this.Name,
      stampSubject: this.Subj?.literal,
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
