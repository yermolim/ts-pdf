import { codes } from "../../../codes";
import { Mat3, Vec2 } from "../../../../common/math";
import { Double, Quadruple } from "../../../../common/types";
import { annotationTypes, lineCapStyles, lineJoinStyles, valueTypes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";

import { ParseInfo, ParseResult } from "../../../data-parser";
import { LiteralString } from "../../strings/literal-string";
import { DateString } from "../../strings/date-string";
import { XFormStream } from "../../streams/x-form-stream";
import { BorderStyleDict } from "../../appearance/border-style-dict";
import { ResourceDict } from "../../appearance/resource-dict";
import { GraphicsStateDict } from "../../appearance/graphics-state-dict";

import { MarkupAnnotation } from "./markup-annotation";
import { AnnotationDto } from "../annotation-dict";
import { AppearanceStreamRenderer } from "../../../render/appearance-stream-renderer";

export interface InkAnnotationDto extends AnnotationDto {
  inkList: number[][];
  color: Quadruple;
  strokeWidth: number;
  strokeDashGap?: Double;
}
export class InkAnnotation extends MarkupAnnotation {
  /**
   * (Required) An array of n arrays, each representing a stroked path. 
   * Each array shall be a series of alternating horizontal and vertical coordinates 
   * in default user space, specifying points along the path. 
   * When drawn, the points shall be connected by straight lines or curves 
   * in an implementation-dependent way
   */
  InkList: number[][];
  
  protected constructor() {
    super(annotationTypes.INK);
  }

  static createFromDto(dto: InkAnnotationDto): InkAnnotation {
    if (dto.annotationType !== "/Ink") {
      throw new Error("Invalid annotation type");
    }
    
    const bs = new BorderStyleDict();
    bs.W = dto.strokeWidth;
    if (dto.strokeDashGap) {
      bs.D = dto.strokeDashGap;
    }

    const annotation = new InkAnnotation();
    annotation.$name = dto.uuid;
    annotation.NM = LiteralString.fromString(dto.uuid);
    annotation.T = LiteralString.fromString(dto.author);
    annotation.M = DateString.fromDate(new Date(dto.dateModified));
    annotation.CreationDate = DateString.fromDate(new Date(dto.dateCreated));
    annotation.InkList = dto.inkList;
    annotation.Rect = dto.rect;
    annotation.C = dto.color.slice(0, 3);
    annotation.CA = dto.color[3];
    annotation.BS = bs;

    annotation.generateApStream();

    const proxy = new Proxy<InkAnnotation>(annotation, annotation.onChange);
    annotation._proxy = proxy;
    annotation._added = true;
    return proxy;
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<InkAnnotation> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new InkAnnotation();
      pdfObject.parseProps(parseInfo);
      const proxy = new Proxy<InkAnnotation>(pdfObject, pdfObject.onChange);
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

    if (this.InkList) {
      bytes.push(...encoder.encode("/InkList "), codes.L_BRACKET);
      this.InkList.forEach(x => {        
        bytes.push(codes.L_BRACKET);
        x.forEach(y => bytes.push(...encoder.encode(" " + y)));         
        bytes.push(codes.R_BRACKET);
      });
      bytes.push(codes.R_BRACKET);
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }

  toDto(): InkAnnotationDto {
    const color = this.getColorRect();

    return {
      annotationType: "/Ink",
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

      inkList: this.InkList,
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
          case "/InkList":
            i = parser.skipEmpty(i);
            const inkType = parser.getValueTypeAt(i);
            if (inkType === valueTypes.ARRAY) {
              const inkList: number[][] = [];
              let inkArrayPos = ++i;
              while (true) {
                const sublist = parser.parseNumberArrayAt(inkArrayPos);
                if (!sublist) {
                  break;
                }
                inkList.push(sublist.value);
                inkArrayPos = sublist.end + 1;
              }
              this.InkList = inkList;
              break;
            }
            throw new Error("Can't parse /InkList property value");

          default:
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
    
    if (!this.InkList?.length) {
      throw new Error("Not all required properties parsed");
    }

    // bake the current annotation rotation into its appearance stream
    // works perfectly with PDF-XChange annotations
    // TODO: test with annotations created not in PDF-XChange
    this.bakeRotation();    
  }

  protected generateApStream() {
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
    gs.LJ = lineJoinStyles.ROUND;
    gs.LC = lineCapStyles.SQUARE;
    gs.D = [[strokeDash, strokeGap], 0];

    // push the graphics state onto the stack
    let streamTextData = `q ${colorString} /GS0 gs`;
    let px: number;
    let py: number;
    this.InkList.forEach(list => {      
      px = list[0];
      py = list[1];
      streamTextData += `\n${px} ${py} m`;
      for (let i = 2; i < list.length; i = i + 2) {
        px = list[i];
        py = list[i + 1];
        streamTextData += `\n${px} ${py} l`;
      }
      streamTextData += "\nS";
    });    
    // pop the graphics state back from the stack
    streamTextData += "\nQ";

    apStream.Resources = new ResourceDict();
    apStream.Resources.setGraphicsState("/GS0", gs);
    apStream.setTextStreamData(streamTextData);   

    this.apStream = apStream;
  }  
  
  protected applyCommonTransform(matrix: Mat3) {
    const dict = <InkAnnotation>this._proxy || this;

    // transform current InkList and Rect
    let x: number;
    let y: number;
    let xMin: number;
    let yMin: number;
    let xMax: number;
    let yMax: number;
    const vec = new Vec2();
    dict.InkList.forEach(list => {
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
    });
    
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

  protected bakeRotation() {    
    const angle = this.getCurrentRotation();
    const centerX = (this.Rect[0] + this.Rect[2]) / 2;
    const centerY = (this.Rect[1] + this.Rect[3]) / 2;

    // calculate the rotation matrix
    const matrix = new Mat3()
      .applyTranslation(-centerX, -centerY)
      .applyRotation(angle)
      .applyTranslation(centerX, centerY);

    this.applyCommonTransform(matrix);
  }
}
