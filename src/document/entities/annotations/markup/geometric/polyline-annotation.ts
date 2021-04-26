import { Mat3, Vec2 } from "../../../../../common/math";
import { buildCloudCurveFromPolyline } from "../../../../../common/drawing";

import { codes } from "../../../../codes";
import { annotationTypes, lineCapStyles, LineEndingType, lineEndingTypes, lineJoinStyles } from "../../../../const";
import { CryptInfo } from "../../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../../data-parser";

import { DateString } from "../../../strings/date-string";
import { LiteralString } from "../../../strings/literal-string";
import { XFormStream } from "../../../streams/x-form-stream";
import { BorderStyleDict } from "../../../appearance/border-style-dict";
import { GraphicsStateDict } from "../../../appearance/graphics-state-dict";
import { ResourceDict } from "../../../appearance/resource-dict";
import { PolyAnnotation, PolyAnnotationDto, polyIntents } from "./poly-annotation";

export interface PolylineAnnotationDto extends PolyAnnotationDto {  
  endingType?: [LineEndingType, LineEndingType];
}

export class PolylineAnnotation extends PolyAnnotation {  
  /**
   * (Optional; PDF 1.4+) An array of two names specifying the line ending styles 
   * that shall be used in drawing the line. The first and second elements 
   * of the array shall specify the line ending styles for the endpoints defined, 
   * respectively, by the first and second pairs of coordinates, 
   * (x1, y1)and (x2, y2), in the L array
   */
  LE: [startType: LineEndingType, endType: LineEndingType] = [lineEndingTypes.NONE, lineEndingTypes.NONE];

  constructor() {
    super(annotationTypes.POLYLINE);
  }
  
  static createFromDto(dto: PolylineAnnotationDto): PolylineAnnotation {
    if (dto.annotationType !== "/Polyline") {
      throw new Error("Invalid annotation type");
    }

    const bs = new BorderStyleDict();
    bs.W = dto.strokeWidth;
    if (dto.strokeDashGap) {
      bs.D = dto.strokeDashGap;
    }
    
    const annotation = new PolylineAnnotation();
    annotation.$name = dto.uuid;
    annotation.NM = LiteralString.fromString(dto.uuid);
    annotation.T = LiteralString.fromString(dto.author);
    annotation.M = DateString.fromDate(new Date(dto.dateModified));
    annotation.CreationDate = DateString.fromDate(new Date(dto.dateCreated));
    annotation.Rect = dto.rect;
    annotation.C = dto.color.slice(0, 3);
    annotation.CA = dto.color[3];
    annotation.BS = bs;
    annotation.IT = polyIntents.POLYLINE_DIMENSION;
    annotation.LE = dto.endingType;
    annotation.Vertices = dto.vertices;
 
    annotation.generateApStream();

    const proxy = new Proxy<PolylineAnnotation>(annotation, annotation.onChange);
    annotation._proxy = proxy;
    annotation._added = true;
    return proxy;
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<PolylineAnnotation> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new PolylineAnnotation();
      pdfObject.parseProps(parseInfo);
      const proxy = new Proxy<PolylineAnnotation>(pdfObject, pdfObject.onChange);
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

    if (this.LE) {
      bytes.push(...encoder.encode("/LE "), codes.L_BRACKET);
      this.LE.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(x)));
      bytes.push(codes.R_BRACKET);
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  } 
    
  toDto(): PolylineAnnotationDto {
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
      bbox: this.apStream?.BBox,
      matrix: this.apStream?.Matrix,

      vertices: this.Vertices,

      endingType: this.LE,

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
          case "/LE":
            const lineEndings = parser.parseNameAt(i, true);
            if (lineEndings
                && (<string[]>Object.values(lineEndingTypes)).includes(lineEndings.value[0])
                && (<string[]>Object.values(lineEndingTypes)).includes(lineEndings.value[1])) {
              this.LE = [
                <LineEndingType>lineEndings.value[0],
                <LineEndingType>lineEndings.value[1],
              ];
              i = lineEndings.end + 1;
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
  }
  
  protected generateApStream() {
    if (!this.Vertices?.length || this.Vertices.length < 4) {
      // any polyline can't have less than 2 vertices (4 coordinates)
      return;
    }

    const apStream = new XFormStream();
    apStream.Filter = "/FlateDecode";
    apStream.LastModified = DateString.fromDate(new Date());
    apStream.BBox = [this.Rect[0], this.Rect[1], this.Rect[2], this.Rect[3]];

    // set color
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

    // set stroke style options
    const opacity = this.CA || 1;
    const strokeWidth = this.BS?.W ?? this.Border?.width ?? 1;
    const strokeDash = this.BS?.D[0] ?? this.Border?.dash ?? 3;
    const strokeGap = this.BS?.D[1] ?? this.Border?.gap ?? 0;
    const gs = new GraphicsStateDict();
    gs.AIS = true;
    gs.BM = "/Normal";
    gs.CA = opacity;
    gs.ca = opacity;
    gs.LW = strokeWidth;
    gs.D = [[strokeDash, strokeGap], 0];
    gs.LC = lineCapStyles.SQUARE;
    gs.LJ = lineJoinStyles.MITER;
    
    const list = this.Vertices;
    let streamTextData = `q ${colorString} /GS0 gs`;

    let px: number;
    let py: number;
    streamTextData += `\n${list[0]} ${list[1]} m`;
    for (let i = 2; i < list.length; i = i + 2) {
      px = list[i];
      py = list[i + 1];
      streamTextData += `\n${px} ${py} l`;
    }
    streamTextData += "\nS"; 

    // pop the graphics state back from the stack
    streamTextData += "\nQ";

    apStream.Resources = new ResourceDict();
    apStream.Resources.setGraphicsState("/GS0", gs);
    apStream.setTextStreamData(streamTextData);    

    this.apStream = apStream;
  }
  
  protected applyCommonTransform(matrix: Mat3) {  
    const dict = <PolylineAnnotation>this._proxy || this;

    // transform current InkList and Rect
    let x: number;
    let y: number;
    let xMin: number;
    let yMin: number;
    let xMax: number;
    let yMax: number;
    const vec = new Vec2();
    const list = dict.Vertices;
    for (let i = 0; i < list.length; i = i + 2) {
      x = list[i];
      y = list[i + 1];
      vec.set(x, y).applyMat3(matrix);
      list[i] = vec.x;
      list[i + 1] = vec.y;

      if (!xMin || vec.x < xMin) {
        xMin = vec.x;
      }
      if (!yMin || vec.y < yMin) {
        yMin = vec.y;
      }
      if (!xMax || vec.x > xMax) {
        xMax = vec.x;
      }
      if (!yMax || vec.y > yMax) {
        yMax = vec.y;
      }
    }
    
    const margin = (dict.BS?.W ?? dict.Border?.width ?? 1) / 2;
    xMin -= margin;
    yMin -= margin;
    xMax += margin;
    yMax += margin;
    this.Rect = [xMin, yMin, xMax, yMax];
    // update calculated bBox if present
    if (this._bBox) {
      const bBox =  dict.getLocalBB();
      bBox.ll.set(xMin, yMin);
      bBox.lr.set(xMax, yMin);
      bBox.ur.set(xMax, yMax);
      bBox.ul.set(xMin, yMax);
    }

    // rebuild the appearance stream instead of transforming it to get rid of line distorsions
    this.generateApStream();

    dict.M = DateString.fromDate(new Date());
  }
}
