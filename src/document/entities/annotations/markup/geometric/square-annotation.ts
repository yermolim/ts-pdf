import { buildCloudCurveFromPolyline, Double, Hextuple, Quadruple } from "../../../../../common";
import { codes } from "../../../../codes";
import { annotationTypes, lineCapStyles, lineJoinStyles } from "../../../../const";
import { Mat3, Vec2 } from "../../../../../math";

import { CryptInfo } from "../../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../../data-parser";

import { DateString } from "../../../strings/date-string";
import { LiteralString } from "../../../strings/literal-string";
import { XFormStream } from "../../../streams/x-form-stream";
import { BorderStyleDict } from "../../../appearance/border-style-dict";
import { GraphicsStateDict } from "../../../appearance/graphics-state-dict";
import { ResourceDict } from "../../../appearance/resource-dict";
import { GeometricAnnotation, GeometricAnnotationDto } from "./geometric-annotation";

export interface SquareAnnotationDto extends GeometricAnnotationDto {  
  rectMargins: Quadruple;
  cloud: boolean;
}

export class SquareAnnotation extends GeometricAnnotation {
  static readonly cloudArcSize = 20;

  /**
   * (Optional; PDF 1.5+) A set of four numbers that shall describe the numerical differences 
   * between two rectangles: the Rect entry of the annotation and the actual boundaries 
   * of the underlying square or circle. Such a difference may occur in situations 
   * where a border effect (described by BE) causes the size of the Rect to increase 
   * beyond that of the square or circle
   */
  RD: Quadruple;

  /**defines if annotation should be rendered using wavy lines (for custom annotations) */
  protected _cloud: boolean;
    
  constructor() {
    super(annotationTypes.SQUARE);
  }

  static createFromDto(dto: SquareAnnotationDto): SquareAnnotation {
    if (dto.annotationType !== "/Square") {
      throw new Error("Invalid annotation type");
    }

    const bs = new BorderStyleDict();
    bs.W = dto.strokeWidth;
    if (dto.strokeDashGap) {
      bs.D = dto.strokeDashGap;
    }
    
    const annotation = new SquareAnnotation();
    annotation.$name = dto.uuid;
    annotation.NM = LiteralString.fromString(dto.uuid);
    annotation.T = LiteralString.fromString(dto.author);
    annotation.M = DateString.fromDate(new Date(dto.dateModified));
    annotation.CreationDate = DateString.fromDate(new Date(dto.dateCreated));
    annotation.Rect = dto.rect;
    annotation.RD = dto.rectMargins;
    annotation.C = dto.color.slice(0, 3);
    annotation.CA = dto.color[3];
    annotation.BS = bs;

    annotation._cloud = dto.cloud;    
    annotation.generateApStream(dto.bbox, dto.matrix);

    const proxy = new Proxy<SquareAnnotation>(annotation, annotation.onChange);
    annotation._proxy = proxy;
    annotation._added = true;
    return proxy;
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<SquareAnnotation> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new SquareAnnotation();
      pdfObject.parseProps(parseInfo);
      const proxy = new Proxy<SquareAnnotation>(pdfObject, pdfObject.onChange);
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

    if (this.RD) {
      bytes.push(
        ...encoder.encode("/RD "), codes.L_BRACKET, 
        ...encoder.encode(this.RD[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.RD[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.RD[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.RD[3] + ""), codes.R_BRACKET,
      );
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  toDto(): SquareAnnotationDto {
    const color = this.getColorRect();

    return {
      annotationType: "/Square",
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
      rectMargins: this.RD,
      bbox: this.apStream?.BBox,
      matrix: this.apStream?.Matrix,

      cloud: this._cloud,
      color,
      strokeWidth: this.BS?.W ?? this.Border?.width ?? 1,
      strokeDashGap: this.BS?.D ?? [3, 0],
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
          case "/RD":
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
  }

  protected generateApStream(bbox?: Quadruple, matrix?: Hextuple) {
    const apStream = new XFormStream();
    apStream.Filter = "/FlateDecode";
    apStream.LastModified = DateString.fromDate(new Date());
    
    const streamBbox: Quadruple = bbox 
      ? [bbox[0], bbox[1], bbox[2], bbox[3]]
      : [this.Rect[0], this.Rect[1], this.Rect[2], this.Rect[3]];  
    apStream.BBox = streamBbox;
    apStream.Matrix = matrix 
      ? [matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]]
      : [1 ,0, 0, 1, 0, 0];

    let colorString: string;
    if (!this.C?.length) {
      colorString = "0 G 0 g";
    } else if (this.C.length < 3) {
      const g = this.C[0];
      colorString = `${g} G ${g} g`;
    } else if (this.C.length === 3) {
      const [r, g, b] = this.C;      
      colorString = `${r} ${g} ${b} RG ${r} ${g} ${b} rg`;
    } else {      
      const [c, m, y, k] = this.C;      
      colorString = `${c} ${m} ${y} ${k} K ${c} ${m} ${y} ${k} k`;
    }

    const ca = this.CA || 1;
    const width = this.BS?.W ?? this.Border?.width ?? 1;
    const dash = this.BS?.D[0] ?? this.Border?.dash ?? 3;
    const gap = this.BS?.D[1] ?? this.Border?.gap ?? 0;
    const gs = new GraphicsStateDict();
    gs.AIS = true;
    gs.BM = "/Normal";
    gs.CA = ca;
    gs.ca = ca;
    gs.LW = width;
    gs.D = [[dash, gap], 0];

    const xmin = streamBbox[0] + this.RD[0];
    const ymin = streamBbox[1] + this.RD[3];
    const xmax = streamBbox[2] - this.RD[2];
    const ymax = streamBbox[3] - this.RD[1];

    let streamTextData = `q ${colorString} /GS0 gs`;

    if (this._cloud) {
      gs.LC = lineCapStyles.ROUND;
      gs.LJ = lineJoinStyles.ROUND;

      const curveData = buildCloudCurveFromPolyline([
        new Vec2(xmin, ymin),
        new Vec2(xmin, ymax),
        new Vec2(xmax, ymax),
        new Vec2(xmax, ymin),
        new Vec2(xmin, ymin),
      ], SquareAnnotation.cloudArcSize);      
      streamTextData += `\n${curveData.start.x} ${curveData.start.y} m`;
      curveData.curves.forEach(x => {
        streamTextData += `\n${x[0].x} ${x[0].y} ${x[1].x} ${x[1].y} ${x[2].x} ${x[2].y} c`;
      });
      streamTextData += "\nS"; 

    } else {
      gs.LC = lineCapStyles.SQUARE;
      gs.LJ = lineJoinStyles.MITER;

      streamTextData += `\n${xmin} ${ymin} m`;
      streamTextData += `\n${xmin} ${ymax} l`;
      streamTextData += `\n${xmax} ${ymax} l`;
      streamTextData += `\n${xmax} ${ymin} l`;
      streamTextData += "\ns"; 
    }
    
    streamTextData += "\nQ";

    apStream.Resources = new ResourceDict();
    apStream.Resources.setGraphicsState("/GS0", gs);
    apStream.setTextStreamData(streamTextData);    

    this.apStream = apStream;
  }
}
