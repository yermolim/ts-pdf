import { codes } from "../../../codes";
import { Mat3, Vec2, vecMinMax } from "../../../../math";
import { getRandomUuid } from "../../../../common";
import { annotationTypes, valueTypes } from "../../../const";
import { CryptInfo, Rect } from "../../../common-interfaces";

import { PenData } from "../../../../annotator/pen-data";
import { InkAnnotationDto } from "../../../../annotator/serialization";

import { ParseInfo, ParseResult } from "../../../data-parser";
import { LiteralString } from "../../strings/literal-string";
import { DateString } from "../../strings/date-string";
import { XFormStream } from "../../streams/x-form-stream";
import { MarkupAnnotation } from "./markup-annotation";
import { BorderStyleDict } from "../../appearance/border-style-dict";
import { ResourceDict } from "../../appearance/resource-dict";
import { GraphicsStateDict } from "../../appearance/graphics-state-dict";

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

  static createFromPenData(data: PenData, userName: string): InkAnnotation {
    const positions: Vec2[] = [];
    const inkList: number[][] = [];
    data.paths.forEach(path => {
      const ink: number[] = [];
      path.positions.forEach(pos => {
        positions.push(pos);
        ink.push(pos.x, pos.y);
      });
      inkList.push(ink);
    });
    const {min: newRectMin, max: newRectMax} = 
      vecMinMax(...positions);  
    const w = data.strokeWidth; 
    const rect: Rect = [
      newRectMin.x - w / 2, 
      newRectMin.y - w / 2, 
      newRectMax.x + w / 2, 
      newRectMax.y + w / 2,
    ];

    const nowString = new Date().toISOString();
    const dto: InkAnnotationDto = {
      uuid: getRandomUuid(),
      annotationType: "/Ink",
      pageId: null,

      dateCreated: nowString,
      dateModified: nowString,
      author: userName || "unknown",

      rect,
      matrix: [1, 0, 0, 1, 0, 0],

      inkList,
      color: data.color,
      strokeWidth: data.strokeWidth,
      strokeDashGap: null,
    };

    return this.createFromDto(dto);
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

    const inkAnnotation = new InkAnnotation();
    inkAnnotation.$name = dto.uuid;
    inkAnnotation.NM = LiteralString.fromString(dto.uuid);
    inkAnnotation.T = LiteralString.fromString(dto.author);
    inkAnnotation.M = DateString.fromDate(new Date(dto.dateModified));
    inkAnnotation.CreationDate = DateString.fromDate(new Date(dto.dateCreated));
    inkAnnotation.InkList = dto.inkList;
    inkAnnotation.Rect = dto.rect;
    inkAnnotation.C = dto.color.slice(0, 3);
    inkAnnotation.CA = dto.color[3];
    inkAnnotation.BS = bs;

    inkAnnotation.createApStream();

    inkAnnotation._added = true;
    return inkAnnotation;
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
      matrix: this.apStream?.Matrix,

      inkList: this.InkList,
      color,
      strokeWidth: this.BS?.W ?? this.Border?.width ?? 1,
    };
  }
  
  applyCommonTransform(matrix: Mat3) {
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
    this.Rect = [xMin, yMin, xMax, yMax];
    // update calculated bBox if present
    if (this._bBox) {
      const bBox =  dict.getLocalBB();
      bBox.ll.set(xMin, yMin);
      bBox.lr.set(xMax, yMin);
      bBox.ur.set(xMax, yMax);
      bBox.ul.set(xMin, yMax);
    }

    this.createApStream();

    dict.M = DateString.fromDate(new Date());
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
  }

  protected createApStream() {
    const stampApStream = new XFormStream();
    stampApStream.Filter = "/FlateDecode";
    stampApStream.LastModified = DateString.fromDate(new Date());
    stampApStream.BBox = this.Rect;

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
    stampApStream.Resources = new ResourceDict();
    stampApStream.Resources.setGraphicsState("/GS0", gs);

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
    streamTextData += "\nQ";

    stampApStream.setTextStreamData(streamTextData);    
    this.apStream = stampApStream;
  }
}
