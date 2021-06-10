import { Vec2 } from "mathador";

import { annotationTypes, lineCapStyles, lineJoinStyles } from "../../../../const";
import { CryptInfo } from "../../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../../data-parser";

import { DateString } from "../../../strings/date-string";
import { LiteralString } from "../../../strings/literal-string";
import { BorderStyleDict } from "../../../appearance/border-style-dict";
import { GraphicsStateDict } from "../../../appearance/graphics-state-dict";
import { ResourceDict } from "../../../appearance/resource-dict";
import { XFormStream } from "../../../streams/x-form-stream";
import { TextMarkupAnnotation, TextMarkupAnnotationDto } from "./text-markup-annotation";

export class UnderlineAnnotation extends TextMarkupAnnotation {  
  constructor() {
    super(annotationTypes.UNDERLINE);
  }
  
  static createFromDto(dto: TextMarkupAnnotationDto): UnderlineAnnotation {
    if (dto.annotationType !== "/Underline") {
      throw new Error("Invalid annotation type");
    }

    if (!dto?.quadPoints?.length || dto.quadPoints.length % 8) {
      // the coordinates array length must be a multiple of 8
      return;
    }

    const bs = new BorderStyleDict();
    bs.W = dto.strokeWidth;
    if (dto.strokeDashGap) {
      bs.D = dto.strokeDashGap;
    }
    
    const annotation = new UnderlineAnnotation();
    annotation.$name = dto.uuid;
    annotation.NM = LiteralString.fromString(dto.uuid);
    annotation.T = LiteralString.fromString(dto.author);
    annotation.M = DateString.fromDate(new Date(dto.dateModified));
    annotation.CreationDate = DateString.fromDate(new Date(dto.dateCreated));
    annotation.Contents = dto.textContent 
      ? LiteralString.fromString(dto.textContent) 
      : null;
    
    if (dto.rect) {
      annotation.Rect = dto.rect;
    } else {
      const vectors: Vec2[] = [];
      for (let i = 0; i < dto.quadPoints.length; i += 2) {
        vectors.push(new Vec2(dto.quadPoints[i], dto.quadPoints[i + 1]));
      }
      const {min, max} = Vec2.minMax(...vectors);
      const margin = dto.strokeWidth
        ? dto.strokeWidth / 2
        : 1;
      annotation.Rect = [min.x - margin, min.y - margin, max.x + margin, max.y + margin];
    }
    annotation.C = dto.color.slice(0, 3);
    annotation.CA = dto.color[3];
    annotation.BS = bs;
    annotation.QuadPoints = dto.quadPoints;
    
    annotation.generateApStream();

    const proxy = new Proxy<UnderlineAnnotation>(annotation, annotation.onChange);
    annotation._proxy = proxy;
    annotation._added = true;
    return proxy;
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<UnderlineAnnotation> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }  
    try {
      const pdfObject = new UnderlineAnnotation();
      pdfObject.parseProps(parseInfo);
      const proxy = new Proxy<UnderlineAnnotation>(pdfObject, pdfObject.onChange);
      pdfObject._proxy = proxy;
      return {value: proxy, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }  
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    return superBytes;
  }
  
  override toDto(): TextMarkupAnnotationDto {
    const color = this.getColorRect();

    return {
      annotationType: "/Underline",
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

      quadPoints: this.QuadPoints,

      color,
      strokeWidth: this.BS?.W ?? this.Border?.width ?? 1,
      strokeDashGap: this.BS?.D ?? [3, 0],
    };
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected override parseProps(parseInfo: ParseInfo) {
    super.parseProps(parseInfo);
    // const {parser, bounds} = parseInfo;
    // const start = bounds.contentStart || bounds.start;
    // const end = bounds.contentEnd || bounds.end; 
    
    // let i = parser.skipToNextName(start, end - 1);
    // let name: string;
    // let parseResult: ParseResult<string>;
    // while (true) {
    //   parseResult = parser.parseNameAt(i);
    //   if (parseResult) {
    //     i = parseResult.end + 1;
    //     name = parseResult.value;
    //     switch (name) {
    //       default:
    //         // skip to next name
    //         i = parser.skipToNextName(i, end - 1);
    //         break;
    //     }
    //   } else {
    //     break;
    //   }
    // };
  }
  
  protected generateApStream() {
    if (!this.QuadPoints?.length || this.QuadPoints.length % 8) {
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
    const strokeWidth = this.strokeWidth;
    const strokeDash = this.BS?.D[0] ?? this.Border?.dash ?? 3;
    const strokeGap = this.BS?.D[1] ?? this.Border?.gap ?? 0;
    const gs = new GraphicsStateDict();
    gs.AIS = true;
    gs.BM = "/Normal";
    gs.CA = opacity;
    gs.ca = opacity;
    gs.LW = strokeWidth;
    gs.LC = lineCapStyles.SQUARE;
    gs.LJ = lineJoinStyles.MITER;
    gs.D = [[strokeDash, strokeGap], 0];
    
    // push the graphics state onto the stack
    let streamTextData = `q ${colorString} /GS0 gs`;

    // fill stream data
    const bottomLeft = new Vec2();
    const bottomRight = new Vec2();
    const q = this.QuadPoints;
    for (let i = 0; i < q.length; i += 8) {
      bottomLeft.set(q[i + 4], q[i + 5]);
      bottomRight.set(q[i + 6], q[i + 7]);
      streamTextData += `\n${bottomLeft.x} ${bottomLeft.y} m`;
      streamTextData += `\n${bottomRight.x} ${bottomRight.y} l`;
      streamTextData += "\nS";
    }

    // pop the graphics state back from the stack
    streamTextData += "\nQ";

    apStream.Resources = new ResourceDict();
    apStream.Resources.setGraphicsState("/GS0", gs);
    apStream.setTextStreamData(streamTextData);   

    this.apStream = apStream;
  }
}
