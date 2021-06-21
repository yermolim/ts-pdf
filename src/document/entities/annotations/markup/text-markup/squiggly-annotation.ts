import { Vec2 } from "mathador";
import { buildSquigglyLine } from "../../../../../drawing/utils";

import { annotationTypes, lineCapStyles, lineJoinStyles } from "../../../../spec-constants";
import { CryptInfo } from "../../../../encryption/interfaces";
import { ParseResult } from "../../../../data-parse/data-parser";
import { ParserInfo } from "../../../../data-parse/parser-info";

import { DateString } from "../../../strings/date-string";
import { LiteralString } from "../../../strings/literal-string";
import { BorderStyleDict } from "../../../appearance/border-style-dict";
import { GraphicsStateDict } from "../../../appearance/graphics-state-dict";
import { ResourceDict } from "../../../appearance/resource-dict";
import { XFormStream } from "../../../streams/x-form-stream";
import { TextMarkupAnnotation, TextMarkupAnnotationDto } from "./text-markup-annotation";

export class SquigglyAnnotation extends TextMarkupAnnotation {   
  static readonly squiggleSize = 6;

  constructor() {
    super(annotationTypes.SQUIGGLY);
  }
  
  static createFromDto(dto: TextMarkupAnnotationDto): SquigglyAnnotation {
    if (dto.annotationType !== "/Squiggly") {
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
    
    const annotation = new SquigglyAnnotation();
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
      const margin = this.squiggleSize / 2 + (dto.strokeWidth || 2) / 2;
      annotation.Rect = [min.x - margin, min.y - margin, max.x + margin, max.y + margin];
    }
    annotation.C = dto.color.slice(0, 3);
    annotation.CA = dto.color[3];
    annotation.BS = bs;
    annotation.QuadPoints = dto.quadPoints;
    
    annotation.generateApStream();

    annotation._added = true;
    return annotation.initProxy();
  }
  
  static parse(parseInfo: ParserInfo): ParseResult<SquigglyAnnotation> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new SquigglyAnnotation();
      pdfObject.parseProps(parseInfo);
      return {
        value: pdfObject.initProxy(), 
        start: parseInfo.bounds.start, 
        end: parseInfo.bounds.end,
      };
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
      annotationType: "/Squiggly",
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
  protected override parseProps(parseInfo: ParserInfo) {
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

    // get color
    const colorString = this.getColorString();
    
    // push the graphics state onto the stack
    let streamTextData = `q ${colorString} /GS0 gs`;

    // fill stream data
    const bottomLeft = new Vec2();
    const bottomRight = new Vec2();
    const q = this.QuadPoints;
    for (let i = 0; i < q.length; i += 8) {
      bottomLeft.set(q[i + 4], q[i + 5]);
      bottomRight.set(q[i + 6], q[i + 7]);

      const squigglyLinePoints = buildSquigglyLine(bottomLeft, bottomRight, 
        SquigglyAnnotation.squiggleSize);
      if (!squigglyLinePoints?.length) {
        continue;
      }

      streamTextData += `\n${squigglyLinePoints[0].x} ${squigglyLinePoints[0].y} m`;
      for (let j = 1; j < squigglyLinePoints.length; j++) {
        streamTextData += `\n${squigglyLinePoints[j].x} ${squigglyLinePoints[j].y} l`;
      }
      streamTextData += "\nS";
    }

    // pop the graphics state back from the stack
    streamTextData += "\nQ";

    apStream.Resources = new ResourceDict();
    apStream.Resources.setGraphicsState("/GS0", gs);
    apStream.setTextStreamData(streamTextData);   

    this.apStream = apStream;
  }

  protected override initProxy(): SquigglyAnnotation {
    return <SquigglyAnnotation>super.initProxy();
  }

  protected override getProxy(): SquigglyAnnotation {
    return <SquigglyAnnotation>super.getProxy();
  } 
}
