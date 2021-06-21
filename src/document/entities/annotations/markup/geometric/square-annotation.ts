import { Hextuple, Quadruple } from "../../../../../common/types";
import { Mat3, Vec2 } from "mathador";
import { calcPdfBBoxToRectMatrices } from "../../../../../drawing/utils";
import { buildCloudCurveFromPolyline } from "../../../../../drawing/clouds";

import { annotationTypes, lineCapStyles, lineJoinStyles } from "../../../../spec-constants";
import { CryptInfo } from "../../../../encryption/interfaces";
import { ParserResult } from "../../../../data-parse/data-parser";
import { ParserInfo } from "../../../../data-parse/parser-info";

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
   * Order is: left-top-right-bottom
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
    annotation.Contents = dto.textContent 
      ? LiteralString.fromString(dto.textContent) 
      : null;
      
    annotation.Rect = dto.rect;
    annotation.RD = dto.rectMargins;
    annotation.C = dto.color.slice(0, 3);
    annotation.CA = dto.color[3];
    annotation.BS = bs;

    annotation._cloud = dto.cloud;    
    annotation.generateApStream(dto.bbox, dto.matrix);

    annotation._added = true;
    return annotation.initProxy();
  }
  
  static parse(parseInfo: ParserInfo): ParserResult<SquareAnnotation> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new SquareAnnotation();
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
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.RD) {
      bytes.push(...encoder.encode("/RD "), ...this.encodePrimitiveArray(this.RD, encoder));
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  override toDto(): SquareAnnotationDto {
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

      textContent: this.Contents?.literal,

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
  protected override parseProps(parseInfo: ParserInfo) {
    super.parseProps(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    let i = parser.skipToNextName(start, end - 1);
    let name: string;
    let parseResult: ParserResult<string>;
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
    
    // set bounding box and transformation matrix
    const streamBbox: Quadruple = bbox 
      ? [bbox[0], bbox[1], bbox[2], bbox[3]]
      : [this.Rect[0], this.Rect[1], this.Rect[2], this.Rect[3]];  
    apStream.BBox = streamBbox;
    const streamMatrix: Hextuple =  matrix 
      ? [matrix[0], matrix[1], matrix[2], matrix[3], matrix[4], matrix[5]]
      : [1 ,0, 0, 1, 0, 0];
    apStream.Matrix = streamMatrix;

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
    gs.D = [[strokeDash, strokeGap], 0]; 

    // set margins to default if absent
    if (!this.RD) {
      const defaultMargin = this._cloud
        ? SquareAnnotation.cloudArcSize / 2
        : strokeWidth / 2;
      this.RD ||= [defaultMargin, defaultMargin, defaultMargin, defaultMargin];
    }    

    // calculate matrices needed for drawing
    const bBoxToRectMat = calcPdfBBoxToRectMatrices(streamBbox, 
      this.Rect, streamMatrix).matAA;
    const invMatArray = Mat3.invert(bBoxToRectMat).toFloatShortArray(); 
    const {r: rotation} = apStream.matrix.getTRS(); 
    const marginsRotationMat = new Mat3().applyRotation(rotation);  
    
    // box corners starting positions
    const boxLL = new Vec2(streamBbox[0], streamBbox[1]);
    const boxLR = new Vec2(streamBbox[2], streamBbox[1]);
    const boxUR = new Vec2(streamBbox[2], streamBbox[3]);
    const boxUL = new Vec2(streamBbox[0], streamBbox[3]);
    
    // calculating margin vectors for the box corners
    // applying only rotation to keep margin values in their original state after any scaling
    const [marginLeft, marginTop, marginRight, marginBottom] = this.RD; 
    const marginLL = new Vec2(marginLeft, marginBottom).applyMat3(marginsRotationMat);
    const marginLR = new Vec2(-marginRight, marginBottom).applyMat3(marginsRotationMat);
    const marginUR = new Vec2(-marginRight, -marginTop).applyMat3(marginsRotationMat);
    const marginUL = new Vec2(marginLeft, -marginTop).applyMat3(marginsRotationMat);

    // apply transformation to the box corners
    // add the rotated margin vectors after transformation to preserve the initial margin values
    const trBoxLL = Vec2.applyMat3(boxLL, bBoxToRectMat).add(marginLL);
    const trBoxLR = Vec2.applyMat3(boxLR, bBoxToRectMat).add(marginLR);
    const trBoxUR = Vec2.applyMat3(boxUR, bBoxToRectMat).add(marginUR);
    const trBoxUL = Vec2.applyMat3(boxUL, bBoxToRectMat).add(marginUL);  

    // get color
    const colorString = this.getColorString();

    // push the graphics state onto the stack
    let streamTextData = `q ${colorString} /GS0 gs`; 
    // add the inversed transformation matrix to 
    streamTextData += `\n${invMatArray[0]} ${invMatArray[1]} ${invMatArray[2]} ${invMatArray[3]} ${invMatArray[4]} ${invMatArray[5]} cm`;

    // the graphics will be drawn using transformed coordinates to preserve stroke options
    // (by using such way line width, margins, etc. will still be as they were specified)
    if (this._cloud) {
      gs.LC = lineCapStyles.ROUND;
      gs.LJ = lineJoinStyles.ROUND; 
      
      const curveData = buildCloudCurveFromPolyline([
        trBoxLL.clone(),
        trBoxLR.clone(),
        trBoxUR.clone(),
        trBoxUL.clone(),
        trBoxLL.clone(),
      ], SquareAnnotation.cloudArcSize);      

      streamTextData += `\n${curveData.start.x} ${curveData.start.y} m`;
      curveData.curves.forEach(x => {
        streamTextData += `\n${x[0].x} ${x[0].y} ${x[1].x} ${x[1].y} ${x[2].x} ${x[2].y} c`;
      });
      streamTextData += "\nS"; 

    } else {
      gs.LC = lineCapStyles.SQUARE;
      gs.LJ = lineJoinStyles.MITER;

      streamTextData += `\n${trBoxLL.x} ${trBoxLL.y} m`;
      streamTextData += `\n${trBoxLR.x} ${trBoxLR.y} l`;
      streamTextData += `\n${trBoxUR.x} ${trBoxUR.y} l`;
      streamTextData += `\n${trBoxUL.x} ${trBoxUL.y} l`;
      streamTextData += "\ns"; 
    }

    // pop the graphics state back from the stack
    streamTextData += "\nQ";

    apStream.Resources = new ResourceDict();
    apStream.Resources.setGraphicsState("/GS0", gs);
    apStream.setTextStreamData(streamTextData);    

    this.apStream = apStream;
  }
  
  protected override async applyCommonTransformAsync(matrix: Mat3, undoable = true) { 
    // use proxy for tracking property changes   
    const dict = this.getProxy();

    // transform bounding boxes
    dict.applyRectTransform(matrix);
    
    // if the annotation has a content stream, rebuild the stream
    const stream = dict.apStream;
    if (stream) {
      const newApMatrix = Mat3.multiply(stream.matrix, matrix);
      dict.generateApStream(stream.BBox, <Hextuple><unknown>newApMatrix.toFloatShortArray());
    }

    dict.M = DateString.fromDate(new Date());
    
    if (dict.$onEditAction) {
      const invertedMat = Mat3.invert(matrix); 
      dict.$onEditAction(undoable
        ? async () => {
          await dict.applyCommonTransformAsync(invertedMat, false);
          await dict.updateRenderAsync();
        }
        : undefined);
    }
  }

  protected override initProxy(): SquareAnnotation {
    return <SquareAnnotation>super.initProxy();
  }

  protected override getProxy(): SquareAnnotation {
    return <SquareAnnotation>super.getProxy();
  }  
}
