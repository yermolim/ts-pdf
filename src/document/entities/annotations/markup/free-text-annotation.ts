import { Mat3, Vec2 } from "mathador";

import { Double, Hextuple, Quadruple } from "../../../../common/types";
import { AnnotationDto } from "../../../../common/annotation";

import { SvgTempPath } from "../../../../drawing/paths/svg-temp-path";
import { calcPdfBBoxToRectMatrices, VecMinMax, 
  lineEndingMinimalSize, lineEndingMultiplier } from "../../../../drawing/utils";

import { CryptInfo } from "../../../encryption/interfaces";
import { annotationTypes, JustificationType, justificationTypes, 
  lineCapStyles, LineEndingType, lineEndingTypes, lineJoinStyles,
  freeTextIntents, FreeTextIntent } from "../../../spec-constants";
import { ParserResult } from "../../../data-parse/data-parser";
import { ParserInfo } from "../../../data-parse/parser-info";

import { DateString } from "../../strings/date-string";
import { LiteralString } from "../../strings/literal-string";
import { XFormStream } from "../../streams/x-form-stream";
import { BorderStyleDict } from "../../appearance/border-style-dict";
import { GraphicsStateDict } from "../../appearance/graphics-state-dict";
import { FontDict } from "../../appearance/font-dict";
import { ResourceDict } from "../../appearance/resource-dict";

import { MarkupAnnotation } from "./markup-annotation";

export interface FreeTextAnnotPoints {
  /**text box bottom-left corner */
  bl: Vec2; 
  /**text box top-right corner */
  tr: Vec2;
  /**text box bottom-right corner */
  br: Vec2;
  /**text box top-left corner */
  tl: Vec2;

  /**text box left edge center */
  l: Vec2;
  /**text box top edge center */
  t: Vec2; 
  /**text box right edge center */
  r: Vec2;
  /**text box bottom edge center */
  b: Vec2;

  /**callout base point*/
  cob?: Vec2;
  /**callout knee point*/
  cok?: Vec2;
  /**callout pointer point*/
  cop?: Vec2;
}

export interface FreeTextAnnotPointsDto {
  /**text box bottom-left corner */
  bl: Double; 
  /**text box top-right corner */
  tr: Double;
  /**text box bottom-right corner */
  br: Double;
  /**text box top-left corner */
  tl: Double;

  /**text box left edge center */
  l: Double;
  /**text box top edge center */
  t: Double; 
  /**text box right edge center */
  r: Double;
  /**text box bottom edge center */
  b: Double;

  /**callout base point*/
  cob?: Double;
  /**callout knee point*/
  cok?: Double;
  /**callout pointer point*/
  cop?: Double;
}

export interface FreeTextAnnotationDto extends AnnotationDto {  
  /**annotation key points in page CS */
  points: FreeTextAnnotPointsDto;
  
  color: Quadruple;
  strokeWidth: number;
  strokeDashGap?: Double;

  intent?: FreeTextIntent;
  justification?: JustificationType;
  calloutEndingType?: LineEndingType;
}

export class FreeTextAnnotation extends MarkupAnnotation {
  //#region PDF props
  /**
   * (Required) The default appearance string that shall be used in formatting the text. 
   * The annotation dictionary’s AP entry, if present, shall take precedence over the DA entry
   */
  DA: LiteralString;
  /**
   * (Optional; PDF 1.4+) A code specifying the form of quadding (justification) 
   * that shall be used in displaying the annotation’s text
   */
  Q: JustificationType = justificationTypes.LEFT;
  /**
   * (Optional; PDF 1.5+) A default style
   */
  DS: LiteralString;
  /**
   * (Optional; meaningful only if IT is FreeTextCallout; PDF 1.6+) 
   * An array of four or six numbers specifying a callout line 
   * attached to the free text annotation. Six numbers [x1y1x2y2x3y3] 
   * represent the starting, knee point, and ending coordinates of the line in default user space. 
   * Four numbers [x1y1x2y2] represent the starting and ending coordinates of the line
   */
  CL: number[];
  /**
   * (Optional; PDF 1.6+) A name describing the intent of the free text annotation
   */
  IT: FreeTextIntent = freeTextIntents.PLAIN_TEXT;
  /**
   * (Optional; PDF 1.6+) A set of four numbers describing the numerical differences 
   * between two rectangles: the Rect entry of the annotation and a rectangle contained 
   * within that rectangle. The inner rectangle is where the annotation’s text should be displayed. 
   * Any border styles and/or border effects specified by BS and BE entries, respectively, 
   * shall be applied to the border of the inner rectangle
   */
  RD: Quadruple;
  /**
   * (Optional; meaningful only if CL is present; PDF 1.6+) 
   * A name specifying the line ending style that shall be used in drawing the callout line 
   * specified in CL. The name shall specify the line ending style for the endpoint 
   * defined by the pairs of coordinates (x1, y1)
   */
  LE: LineEndingType = lineEndingTypes.NONE;
  //#endregion
  
  protected _defaultStyle: string;
  protected _rtStyle: string;
  protected _rtText: string;
  
  protected _fontMap: Map<string, FontDict>;

  protected readonly _svgTemp = new SvgTempPath();
  protected _pointsTemp: FreeTextAnnotPoints;
  
  /**annotation key points in stream-local CS */
  get pointsStreamCS(): FreeTextAnnotPoints {
    const stroke = this.strokeWidth;
    const halfStroke = stroke / 2;    
    // AP stream bounding box
    const [apXMin, apYMin, apXMax, apYMax] = this.apStream.BBox;
    // text box margins relative to AP stream bounding box
    const [mLeft, mBottom, mRight, mTop] = this.RD || [halfStroke, halfStroke, halfStroke, halfStroke];
    // text box corners in untransformed stream CS
    const apBL = new Vec2(apXMin + mLeft, apYMin + mBottom);
    const apTR = new Vec2(apXMax - mRight, apYMax - mTop);
    const apBR = new Vec2(apTR.x, apBL.y);
    const apTL = new Vec2(apBL.x, apTR.y);
    // text box edge centers in untransformed stream CS
    const apL = Vec2.add(apBL, apTL).multiplyByScalar(0.5);
    const apT = Vec2.add(apTL, apTR).multiplyByScalar(0.5);
    const apR = Vec2.add(apBR, apTR).multiplyByScalar(0.5);
    const apB = Vec2.add(apBL, apBR).multiplyByScalar(0.5);
    // callout points in untransformed stream CS
    const cl = this.CL;
    let apCoBase: Vec2;
    let apCoPointer: Vec2;
    let apCoKnee: Vec2;
    if (cl) {
      if (cl.length === 6) {
        apCoBase = new Vec2(cl[4], cl[5]);
        apCoKnee = new Vec2(cl[2], cl[3]);
        apCoPointer = new Vec2(cl[0], cl[1]);
      } else if (cl.length === 4) {
        apCoBase = new Vec2(cl[2], cl[3]);
        apCoPointer = new Vec2(cl[0], cl[1]);
      }
    }

    return {
      bl: apBL, tr: apTR, br: apBR, tl: apTL,
      l: apL, t: apT, r: apR, b: apB,
      cob: apCoBase, cok: apCoKnee, cop: apCoPointer,
    };
  }
  
  /**annotation key points in page CS */
  get pointsPageCS(): FreeTextAnnotPoints {
    const points = this.pointsStreamCS;
    const {matAA: mat} = calcPdfBBoxToRectMatrices(this.apStream.BBox, 
      this.Rect, this.apStream.Matrix);
    
    return {
      bl: points.bl.applyMat3(mat), 
      tr: points.tr.applyMat3(mat), 
      br: points.br.applyMat3(mat), 
      tl: points.tl.applyMat3(mat),
      l: points.l.applyMat3(mat), 
      t: points.t.applyMat3(mat), 
      r: points.r.applyMat3(mat), 
      b: points.b.applyMat3(mat),
      cob: points.cob ? points.cob.applyMat3(mat) : null, 
      cok: points.cok ? points.cok.applyMat3(mat) : null, 
      cop: points.cop ? points.cop.applyMat3(mat) : null,
    };
  }

  /**minimal margin needed to be added for correct annotation content rendering */
  get minMargin(): number {
    const strokeWidth = this.strokeWidth;
    const halfStrokeWidth = strokeWidth / 2;    
    // calculate margin
    let marginMin: number;
    if (this.LE && this.LE !== lineEndingTypes.NONE) {
      // annotation has a callout with special line ending
      const endingSizeWoStroke = Math.max(strokeWidth * lineEndingMultiplier, lineEndingMinimalSize);
      // '+ strokeWidth' is used to include the ending figure stroke width
      const endingSize = endingSizeWoStroke + strokeWidth;
      marginMin = endingSize / 2;      
    } else {
      marginMin = halfStrokeWidth;
    }    

    return marginMin;
  }

  constructor() {
    super(annotationTypes.FREE_TEXT);
  }  
  
  static async createFromDtoAsync(dto: FreeTextAnnotationDto, 
    fontMap: Map<string, FontDict>): Promise<FreeTextAnnotation> {
    if (dto.annotationType !== "/FreeText") {
      throw new Error("Invalid annotation type");
    }

    const bs = new BorderStyleDict();
    bs.W = dto.strokeWidth;
    if (dto.strokeDashGap) {
      bs.D = dto.strokeDashGap;
    }
    
    const annotation = new FreeTextAnnotation();
    annotation.$name = dto.uuid;
    annotation.NM = LiteralString.fromString(dto.uuid);
    annotation.T = LiteralString.fromString(dto.author);
    annotation.M = DateString.fromDate(new Date(dto.dateModified));
    annotation.CreationDate = DateString.fromDate(new Date(dto.dateCreated));
    annotation.Contents = dto.textContent 
      ? LiteralString.fromString(dto.textContent) 
      : null;
      
    annotation.Rect = dto.rect;
    annotation.C = dto.color.slice(0, 3);
    annotation.CA = dto.color[3];
    annotation.BS = bs;
    annotation.IT = dto.intent || freeTextIntents.PLAIN_TEXT;
    annotation.LE = dto.calloutEndingType || lineEndingTypes.NONE;
    annotation.Q = dto.justification || justificationTypes.LEFT;
 
    annotation._fontMap = fontMap;
    
    const {bl, tr, br, tl, l, t, r, b, cob, cok, cop} = dto.points;
    const points: FreeTextAnnotPoints = {
      bl: new Vec2(bl[0], bl[1]), 
      tr: new Vec2(tr[0], tr[1]),
      br: new Vec2(br[0], br[1]),
      tl: new Vec2(tl[0], tl[1]),    
      l: new Vec2(l[0], l[1]),
      t: new Vec2(t[0], t[1]), 
      r: new Vec2(r[0], r[1]),
      b: new Vec2(b[0], b[1]),    
      cob: cob ? new Vec2(cob[0], cob[1]) : null,
      cok: cok ? new Vec2(cok[0], cok[1]) : null,
      cop: cop ? new Vec2(cop[0], cop[1]) : null,
    };
    await annotation.generateApStreamAsync(points);

    annotation._added = true;    
    return annotation.initProxy();
  }
  
  static async parseAsync(parseInfo: ParserInfo, 
    fontMap: Map<string, FontDict>): Promise<ParserResult<FreeTextAnnotation>> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new FreeTextAnnotation();
      await pdfObject.parsePropsAsync(parseInfo);
      pdfObject._fontMap = fontMap;
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

    if (this.DA) {
      bytes.push(...encoder.encode("/DA "), ...this.DA.toArray(cryptInfo));
    }
    if (this.Q) {
      bytes.push(...encoder.encode("/Q "), ...encoder.encode(" " + this.Q));
    }
    if (this.DS) {
      bytes.push(...encoder.encode("/DS "), ...this.DS.toArray(cryptInfo));
    }
    if (this.RC) {
      bytes.push(...encoder.encode("/RC "), ...this.RC.toArray(cryptInfo));
    }
    if (this.CL) {
      bytes.push(...encoder.encode("/CL "), ...this.encodePrimitiveArray(this.CL, encoder));
    }
    if (this.IT) {
      bytes.push(...encoder.encode("/IT "), ...encoder.encode(this.IT));
    }
    if (this.RD) {
      bytes.push(...encoder.encode("/RD "), ...this.encodePrimitiveArray(this.RD, encoder));
    }
    if (this.LE) {
      bytes.push(...encoder.encode("/LE "), ...encoder.encode(this.LE));
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  /**
   * serialize the annotation to a data transfer object
   * @returns 
   */
  override toDto(): FreeTextAnnotationDto {
    const color = this.getColorRect();
    const {bl, tr, br, tl, l, t, r, b, cob, cok, cop} = this.pointsPageCS;
    const points: FreeTextAnnotPointsDto = {
      bl: <Double><any>bl.truncate().toFloatArray(), 
      tr: <Double><any>tr.truncate().toFloatArray(),
      br: <Double><any>br.truncate().toFloatArray(),
      tl: <Double><any>tl.truncate().toFloatArray(),   
      l: <Double><any>l.truncate().toFloatArray(),
      t: <Double><any>t.truncate().toFloatArray(), 
      r: <Double><any>r.truncate().toFloatArray(),
      b: <Double><any>b.truncate().toFloatArray(),    
      cob: cob ? <Double><any>cob.truncate().toFloatArray() : null,
      cok: cok ? <Double><any>cok.truncate().toFloatArray() : null,
      cop: cop ? <Double><any>cop.truncate().toFloatArray() : null,
    };

    return {
      annotationType: "/FreeText",
      uuid: this.$name,
      pageId: this.$pageId,

      dateCreated: this["CreationDate"]?.date?.toISOString() || new Date().toISOString(),
      dateModified: this.M 
        ? this.M instanceof LiteralString
          ? this.M.literal
          : this.M.date.toISOString()
        : new Date().toISOString(),
      author: this["T"]?.literal,

      textContent: this.Contents?.literal,

      rect: this.Rect,
      bbox: this.apStream?.BBox,
      matrix: this.apStream?.Matrix,

      points,

      color,
      strokeWidth: this.BS?.W ?? this.Border?.width ?? 1,
      strokeDashGap: this.BS?.D ?? [3, 0],

      intent: this.IT,
      justification: this.Q,
      calloutEndingType: this.LE,
    };
  }
  
  override async setTextContentAsync(text: string, undoable = true) {
    await super.setTextContentAsync(text, undoable);
    await this.updateStreamAsync(null);
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected override async parsePropsAsync(parseInfo: ParserInfo) {
    await super.parsePropsAsync(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    let i = await parser.skipToNextNameAsync(start, end - 1);
    let name: string;
    let parseResult: ParserResult<string>;
    while (true) {
      parseResult = await parser.parseNameAtAsync(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/DA":         
          case "/DS":            
          case "/RC":            
            i = await this.parseLiteralPropAsync(name, parser, i, parseInfo.cryptInfo);
            break;

          case "/Q":
            const justification = await parser.parseNumberAtAsync(i, true);
            if (justification && (<number[]>Object.values(justificationTypes))
              .includes(justification.value)) {
              this.Q = <JustificationType>justification.value;
              i = justification.end + 1;              
            } else {              
              throw new Error("Can't parse /Q property value");
            }
            break;
          case "/LE":
            const lineEndingType = await parser.parseNameAtAsync(i, true);
            if (lineEndingType && (<string[]>Object.values(lineEndingTypes))
              .includes(lineEndingType.value)) {
              this.LE = <LineEndingType>lineEndingType.value;
              i = lineEndingType.end + 1;              
            } else {              
              throw new Error("Can't parse /LE property value");
            }
            break;

          case "/CL":
          case "/RD":  
            i = await this.parseNumberArrayPropAsync(name, parser, i, true);
            break;

          case "/IT":
            const intent = await parser.parseNameAtAsync(i, true);
            if (intent) {
              if (intent.value === "/FreeTextTypewriter") { // common typo                
                this.IT = freeTextIntents.CLICK_TO_TYPE;
                i = intent.end + 1; 
                break;   
              }
              else if ((<string[]>Object.values(freeTextIntents)).includes(intent.value)) {
                this.IT = <FreeTextIntent>intent.value;
                i = intent.end + 1;    
                break;          
              }
            }
            throw new Error("Can't parse /IT property value");
            
          default:
            // skip to next name
            i = await parser.skipToNextNameAsync(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };

    if (this.DS) {
      this._defaultStyle = this.DS.literal;
    }
    if (this.RC) {
      const domParser = new DOMParser();
      const body = domParser.parseFromString(this.RC.literal, "text/xml")?.querySelector("body");
      if (body) {
        const style = body.getAttribute("style");
        const p = body.querySelector("p");
        this._rtStyle = style || "";
        this._rtText = p?.textContent || ""; 
      }
    }
        
    if (!this.DA) {
      throw new Error("Not all required properties parsed");
    }
    
    if (!this.C || (this.C[0] === 1 && this.C[1] === 1 && this.C[2] === 1)) {
      // TODO: find more elegant and flexible solution
      // if no color defined of the defined color is white, set color to red
      this.C = [1, 0, 0];
    }
  }

  //#region generating appearance stream
  /**
   * calculate transformation matrix from stream CS to page CS
   * @param tbTopLeftPage text box top-left corner in page CS
   * @param tbTopRightPage text box top-right corner in page CS 
   * @returns transformation matrix from stream CS to page CS
   */
  protected calculateStreamMatrix(tbTopLeftPage: Vec2, tbTopRightPage: Vec2): Mat3 {
    // align annotation horizontally starting at 0, 0 (top-left text box corner) for stream    
    const length = Vec2.subtract(tbTopRightPage, tbTopLeftPage).getMagnitude();
    const alignedTL = new Vec2();
    const alignedTR = new Vec2(length, 0);
    // calculate matrix from stream CS to page CS
    const matrix = Mat3.from4Vec2(alignedTL, alignedTR, tbTopLeftPage, tbTopRightPage);
    
    return matrix;
  }

  /**
   * calculate points coordinates in stream CS and the stream bounding box
   * @param pPoints annotation key points coordinates in page CS
   * @param matrixStreamToPage transformation matrix from stream CS to page CS
   * @returns points coordinates in stream CS and the stream bounding box
   */
  protected calculateStreamBbox(pPoints: FreeTextAnnotPoints, matrixStreamToPage: Mat3): 
  {bbox: VecMinMax; points: FreeTextAnnotPoints} {
    const {
      bl: pBL, tr: pTR, br: pBR, tl: pTL,
      l: pL, t: pT, r: pR, b: pB,
      cob: pCoBase, cok: pCoKnee, cop: pCoPointer
    } = pPoints;

    const minMargin = this.minMargin;
    const matrixPageToStream = Mat3.invert(matrixStreamToPage);

    // calculate point positions in stream CS
    const sBL = Vec2.applyMat3(pBL, matrixPageToStream).truncate();
    const sTR = Vec2.applyMat3(pTR, matrixPageToStream).truncate();
    const sBR = Vec2.applyMat3(pBR, matrixPageToStream).truncate();
    const sTL = Vec2.applyMat3(pTL, matrixPageToStream).truncate();
    const sL = Vec2.applyMat3(pL, matrixPageToStream).truncate();
    const sT = Vec2.applyMat3(pT, matrixPageToStream).truncate();
    const sR = Vec2.applyMat3(pR, matrixPageToStream).truncate();
    const sB = Vec2.applyMat3(pB, matrixPageToStream).truncate();
    const sCoBase = pCoBase ? Vec2.applyMat3(pCoBase, matrixPageToStream).truncate() : null;
    const sCoKnee = pCoKnee ? Vec2.applyMat3(pCoKnee, matrixPageToStream).truncate() : null;
    const sCoPointer = pCoPointer ? Vec2.applyMat3(pCoPointer, matrixPageToStream).truncate() : null;

    // get minimum and maximum point coordinates in stream CS
    const actualPoints = [sBL, sTR, sBR, sTL, sCoKnee, sCoPointer].filter(x => x);
    const {min: boxMinNoMargin, max: boxMaxNoMargin} = 
      Vec2.minMax(...actualPoints);

    // get minimum and maximum bounding box point coordinates in stream-local CS (including margins)
    const boxMin = new Vec2(boxMinNoMargin.x - minMargin, boxMinNoMargin.y - minMargin);
    const boxMax = new Vec2(boxMaxNoMargin.x + minMargin, boxMaxNoMargin.y + minMargin);

    return {
      bbox: [boxMin, boxMax],
      points: {
        bl: sBL, 
        tr: sTR, 
        br: sBR, 
        tl: sTL,
        l: sL, 
        t: sT, 
        r: sR, 
        b: sB,
        cob: sCoBase, 
        cok: sCoKnee, 
        cop: sCoPointer,
      },
    };
  } 
  
  /**
   * actualize values of 'Rect', 'CL', 'RD', 'IT' properties using annotation key points
   * @param sPoints annotation key points in stream CS
   * @param matrixStreamToPage transformation matrix from stream CS to page CS
   * @param bbox stream bounding box
   * @returns
   */
  protected updateAnnotCoords(sPoints: FreeTextAnnotPoints, 
    matrixStreamToPage: Mat3, bbox: VecMinMax) {
    const {
      bl: sBL, tr: sTR,
      cob: sCoBase, cok: sCoKnee, cop: sCoPointer
    } = sPoints;
    const [boxMin, boxMax] = bbox;
    
    // update the non axis-aligned bounding-box
    const localBox =  this.getLocalBB();
    localBox.ll.set(boxMin.x, boxMin.y).applyMat3(matrixStreamToPage).truncate();
    localBox.lr.set(boxMax.x, boxMin.y).applyMat3(matrixStreamToPage).truncate();
    localBox.ur.set(boxMax.x, boxMax.y).applyMat3(matrixStreamToPage).truncate();
    localBox.ul.set(boxMin.x, boxMax.y).applyMat3(matrixStreamToPage).truncate();

    // update the Rect (AABB)
    const {min: rectMin, max: rectMax} = 
      Vec2.minMax(localBox.ll, localBox.lr, localBox.ur, localBox.ul);
    this.Rect = [rectMin.x, rectMin.y, rectMax.x, rectMax.y];

    // update callout coords
    if (sCoPointer && sCoBase) {
      if (sCoKnee) {
        this.CL = [sCoPointer.x, sCoPointer.y, sCoKnee.x, sCoKnee.y, sCoBase.x, sCoBase.y];
      } else {        
        this.CL = [sCoPointer.x, sCoPointer.y, sCoBase.x, sCoBase.y];
      }
      this.IT = freeTextIntents.WITH_CALLOUT;
    } else {
      this.CL = undefined;
      this.IT = freeTextIntents.PLAIN_TEXT;
    }

    // update text box offsets
    this.RD = [
      sBL.x - boxMin.x,
      sBL.y - boxMin.y,
      boxMax.x - sTR.x,
      boxMax.y - sTR.y,
    ];
  }  
  
  protected override getColorString(): string {
    const [r, g, b] = this.getColorRect();
    return `${r} ${g} ${b} RG 1 g`;
  }

  /**
   * 
   * @param sPoints annotation key points in stream CS 
   * @returns 
   */
  protected getCalloutStreamPart(sPoints: FreeTextAnnotPoints): string {
    let calloutStream = "";
    if (sPoints.cop && sPoints.cob) {
      // draw callout lines
      calloutStream += `\n${sPoints.cob.x} ${sPoints.cob.y} m`;
      if (sPoints.cok) {
        calloutStream += `\n${sPoints.cok.x} ${sPoints.cok.y} l`;
      }
      calloutStream += `\n${sPoints.cop.x} ${sPoints.cop.y} l`;
      calloutStream += "\nS";

      // draw callout pointer
      const coEnds = sPoints.cok
        ? [sPoints.cok, sPoints.cop]
        : [sPoints.cob, sPoints.cop];
      const [coStart, coEnd] = coEnds;
      const coStartAligned = new Vec2(0, 0);
      const coEndAligned = new Vec2(Vec2.subtract(coEnd, coStart).getMagnitude());
      const coMat = Mat3.from4Vec2(coStartAligned, coEndAligned, coStart, coEnd);      
      const calloutPointerStream = this.getLineEndingStreamPart(coEndAligned, 
        this.LE, this.strokeWidth, "right");
      
      // TODO: replace after updating Mathador
      // calloutStream += `\nq ${coMat.toFloatShortArray().join(" ")} cm`;
      const coMatShort = coMat.toFloatShortArray();
      calloutStream += "\nq "
       + `${coMatShort[0].toFixed(5)} `
       + `${coMatShort[1].toFixed(5)} `
       + `${coMatShort[2].toFixed(5)} `
       + `${coMatShort[3].toFixed(5)} `
       + `${coMatShort[4].toFixed(5)} `
       + `${coMatShort[5].toFixed(5)} `
       + "cm";

      calloutStream += calloutPointerStream;
      calloutStream += "\nQ";
    }
    return calloutStream;
  }
  
  /**
   * 
   * @param sPoints annotation key points in stream CS 
   * @param font ts-pdf custom font dictionary
   * @returns 
   */
  protected async getTextStreamPartAsync(sPoints: FreeTextAnnotPoints, 
    font: FontDict): Promise<string> {
    const w = this.strokeWidth;

    const textMaxWidth = sPoints.br.x - sPoints.bl.x - 2 * w;
    if (textMaxWidth <= 0) {
      return "";
    }

    const fontSize = 12;
    let textAlign: "left" | "center" | "right";
    if (this.Q) {
      textAlign = this.Q === justificationTypes.CENTER
        ? "center"
        : "right";
    } else {
      textAlign = "left";
    }
    const textData = await this.updateTextDataAsync({
      maxWidth: textMaxWidth, // prevent text to intersect with border
      fontSize,
      textAlign: textAlign,
      pivotPoint: "top-left",
    });

    if (!textData) {
      return "";
    }

    let textStream = "\nq 0 g 0 G"; // push the graphics state onto the stack and set text color
    const codeMap = font.encoding.codeMap;
    for (const line of textData.lines) {
      if (!line.text) {
        continue;
      }      
      const lineStart = new Vec2(line.relativeRect[0], line.relativeRect[1])
        .add(sPoints.tl)
        .add(new Vec2(w, -w)) // prevent text from intersecting with border stroke
        .truncate();
      let lineHex = "";
      for (const char of line.text) {
        const code =  codeMap.get(char);
        if (code) {
          lineHex += code.toString(16).padStart(2, "0");
        }
      }
      textStream += `\nBT 0 Tc 0 Tw 100 Tz ${font.name} ${fontSize} Tf 0 Tr`;
      // '+ fontSize * 0.2' is needed to set the correct rendered text baseline
      textStream += `\n1 0 0 1 ${lineStart.x} ${lineStart.y + fontSize * 0.2} Tm`;
      textStream += `\n<${lineHex}> Tj`;
      textStream += "\nET";
    };
    textStream += "\nQ"; // pop the graphics state back from the stack      
    return textStream;
  }
  
  /**
   * generate new appearance stream based on the current annotation data
   * @param pPoints annotation key points coordinates in page CS
   */
  protected async generateApStreamAsync(pPoints: FreeTextAnnotPoints) {
    if (!pPoints) {
      throw new Error("No key annotation point coordinates passed");
    }    
    const matrix = this.calculateStreamMatrix(pPoints.tl, pPoints.tr);
    const {bbox, points: sPoints} = this.calculateStreamBbox(pPoints, matrix);    
    this.updateAnnotCoords(sPoints, matrix, bbox);

    const apStream = new XFormStream();
    apStream.Filter = "/FlateDecode";
    apStream.LastModified = DateString.fromDate(new Date());
    apStream.BBox = [bbox[0].x, bbox[0].y, bbox[1].x, bbox[1].y];
    apStream.Matrix = <Hextuple><any>matrix.toFloatShortArray();
    apStream.Resources = new ResourceDict();

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
    gs.LC = lineCapStyles.SQUARE;
    gs.LJ = lineJoinStyles.MITER;
    apStream.Resources.setGraphicsState("/GS0", gs);

    // set font
    // TODO: implement font selection
    const fontFamily = "arial";
    const font = this._fontMap?.get(fontFamily);
    if (!font || !font.encoding?.codeMap) {
      throw new Error(`Suitable font is not found in the font map: '${fontFamily}'`);
    }
    apStream.Resources.setFont(font.name, font);

    const colorString = this.getColorString();

    // get stream parts
    const calloutStreamPart = this.getCalloutStreamPart(sPoints);
    const textBoxStreamPart = `\n${sPoints.bl.x} ${sPoints.bl.y} m`
      + `\n${sPoints.br.x} ${sPoints.br.y} l`
      + `\n${sPoints.tr.x} ${sPoints.tr.y} l`
      + `\n${sPoints.tl.x} ${sPoints.tl.y} l`
      + "\nb";
    const textStreamPart = await this.getTextStreamPartAsync(sPoints, font);

    // combine stream parts
    const streamTextData = 
      `q ${colorString} /GS0 gs` // push the graphics state onto the stack
      + calloutStreamPart // draw callout if present
      + textBoxStreamPart // draw text box
      + textStreamPart // draw text if present
      + "\nQ"; // pop the graphics state back from the stack
    apStream.setTextStreamData(streamTextData);    

    this.apStream = apStream;
  }

  protected async updateStreamAsync(points: FreeTextAnnotPoints, undoable = true) {    
    // use proxy for tracking property changes
    const dict = this.getProxy();

    const oldPoints = dict.pointsPageCS;
    await dict.generateApStreamAsync(points || oldPoints);
    await dict.updateRenderAsync();    
    
    if (points && dict.$onEditAction) {
      // run callback only if the 'points' variable is defined
      // that means the edit is actually happened, not just a stream refresh
      dict.$onEditAction(undoable 
        ? async () => {
          await dict.updateStreamAsync(oldPoints, false);
        }
        : undefined);
    }
  }
  //#endregion
  
  //#region overriding handles
  protected override renderHandles(): SVGGraphicsElement[] {
    const points = this.pointsPageCS;

    return [
      ...this.renderTextBoxCornerHandles(points), 
      ...this.renderCalloutHandles(points), 
      this.renderRotationHandle()
    ];
  } 
  
  //#region text box handles
  protected renderTextBoxCornerHandles(points: FreeTextAnnotPoints): SVGGraphicsElement[] {
    // text box corners in page CS
    const {bl: pBL, br: pBR, tr: pTR, tl: pTL} = points;

    const cornerMap = new Map<string, Vec2>();
    cornerMap.set("tb-bl", pBL);
    cornerMap.set("tb-br", pBR);
    cornerMap.set("tb-tr", pTR);
    cornerMap.set("tb-tl", pTL);

    const handles: SVGGraphicsElement[] = [];
    ["tb-bl", "tb-br", "tb-tr", "tb-tl"].forEach(x => {
      const {x: cx, y: cy} = cornerMap.get(x);
      const handle = document.createElementNS("http://www.w3.org/2000/svg", "line");
      handle.classList.add("annotation-handle", "scale");
      handle.setAttribute("data-handle-name", x);
      handle.setAttribute("x1", cx + "");
      handle.setAttribute("y1", cy + ""); 
      handle.setAttribute("x2", cx + "");
      handle.setAttribute("y2", cy + 0.1 + ""); 
      handle.addEventListener("pointerdown", this.onTextBoxCornerHandlePointerDown);
      handles.push(handle);   
    });

    return handles;
  }   
  
  protected onTextBoxCornerHandlePointerDown = (e: PointerEvent) => { 
    if (!e.isPrimary) {
      //it's a secondary touch action
      return;
    }

    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);
    target.addEventListener("pointerup", this.onTextBoxCornerHandlePointerUp);
    target.addEventListener("pointerout", this.onTextBoxCornerHandlePointerUp); 

    this._pointsTemp = this.pointsPageCS;
    this._moved = false;

    // set timeout to prevent an accidental annotation scaling
    this._transformationTimer = setTimeout(() => {
      this._transformationTimer = null;       
      // append the svg element copy     
      this._svgTemp.insertAfter(this._renderedControls);
      target.addEventListener("pointermove", this.onTextBoxCornerHandlePointerMove);
    }, 200);

    e.stopPropagation();
  };

  protected onTextBoxCornerHandlePointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) {
      //it's a secondary touch action
      return;
    }

    const target = e.target as HTMLElement;
    const handleName = target.dataset.handleName;

    const points = this._pointsTemp;
    const p = this.convertClientCoordsToPage(e.clientX, e.clientY);

    // get length of the text box sides
    const horLength = Vec2.subtract(points.br, points.bl).getMagnitude();
    const vertLength = Vec2.subtract(points.tl, points.bl).getMagnitude();
    // calculate the transformation matrix 
    // from the current text box position to the AA CS (with bottom-left corner at 0,0)
    const matToAligned = Mat3.from4Vec2(points.bl, points.br, new Vec2(), new Vec2(horLength, 0));

    // get the opposite point (relatively to the moved one)
    let oppositeP: Vec2;
    switch (handleName) {
      case "tb-bl": 
        oppositeP = points.tr;
        break;
      case "tb-br":
        oppositeP = points.tl;
        break;
      case "tb-tr":
        oppositeP = points.bl;
        break;
      case "tb-tl":
        oppositeP = points.br;
        break;
      default:
        return;
    }  

    // calculate the current point and the opposite point
    // coordinates in the AA CS
    const pAligned = Vec2.applyMat3(p, matToAligned);
    const oppositePAligned = Vec2.applyMat3(oppositeP, matToAligned);
    // calculate length of the text box sides after moving the point
    const transformedHorLength = Math.abs(pAligned.x - oppositePAligned.x);
    const transformedVertLength = Math.abs(pAligned.y - oppositePAligned.y);
    // calculate the transformation scale ratio for X and Y axes
    const scaleX = transformedHorLength / horLength;
    const scaleY = transformedVertLength / vertLength;
    // get the current rotation
    const {r: rotation} = matToAligned.getTRS();
    // calculate the final transformation matrix
    const mat = new Mat3()
      .applyTranslation(-oppositeP.x, -oppositeP.y)
      .applyRotation(rotation)
      .applyScaling(scaleX, scaleY)
      .applyRotation(-rotation)
      .applyTranslation(oppositeP.x, oppositeP.y);
    // apply the matrix to all points that need to be transformed
    points.bl.applyMat3(mat);
    points.br.applyMat3(mat);
    points.tr.applyMat3(mat);
    points.tl.applyMat3(mat); 
    points.l.applyMat3(mat);
    points.t.applyMat3(mat);
    points.r.applyMat3(mat);
    points.b.applyMat3(mat);
    points.cob?.applyMat3(mat);

    // update temp svg element to visualize the future transformation in real-time
    this._svgTemp.set("lightblue", "blue", this.strokeWidth, 
      [points.bl, points.br, points.tr, points.tl], true);

    this._moved = true;
  };
  
  protected onTextBoxCornerHandlePointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      // it's a secondary touch action
      return;
    }

    const target = e.target as HTMLElement;
    target.removeEventListener("pointermove", this.onTextBoxCornerHandlePointerMove);
    target.removeEventListener("pointerup", this.onTextBoxCornerHandlePointerUp);
    target.removeEventListener("pointerout", this.onTextBoxCornerHandlePointerUp);
    target.releasePointerCapture(e.pointerId); 

    this._svgTemp.remove();
    
    if (this._moved) {
      // transform the annotation
      this.updateStreamAsync(this._pointsTemp);
    }
  };
  //#endregion
  
  //#region callout handles
  protected renderCalloutHandles(points: FreeTextAnnotPoints): SVGGraphicsElement[] {
    const handles: SVGGraphicsElement[] = [];

    if (!points.cop) {
      return handles;
    }

    ["l", "t", "r", "b"].forEach(x => {    
      const side = points[x];  
      const sideHandle = document.createElementNS("http://www.w3.org/2000/svg", "line");
      sideHandle.classList.add("annotation-handle", "helper");
      sideHandle.setAttribute("data-handle-name", `co-pivot-${x}`);
      sideHandle.setAttribute("x1", side.x + "");
      sideHandle.setAttribute("y1", side.y + ""); 
      sideHandle.setAttribute("x2", side.x + "");
      sideHandle.setAttribute("y2", side.y + 0.1 + ""); 
      sideHandle.addEventListener("pointerdown", this.onSideHandlePointerUp);
      handles.push(sideHandle); 
    });

    if (points.cok) {
      const pCoKnee = points.cok;
      const kneeHandle = document.createElementNS("http://www.w3.org/2000/svg", "line");
      kneeHandle.classList.add("annotation-handle", "translation");
      kneeHandle.setAttribute("data-handle-name", "co-knee");
      kneeHandle.setAttribute("x1", pCoKnee.x + "");
      kneeHandle.setAttribute("y1", pCoKnee.y + ""); 
      kneeHandle.setAttribute("x2", pCoKnee.x + "");
      kneeHandle.setAttribute("y2", pCoKnee.y + 0.1 + ""); 
      kneeHandle.addEventListener("pointerdown", this.onCalloutHandlePointerDown);
      handles.push(kneeHandle);   
    }

    const pCoPointer = points.cop;
    const pointerHandle = document.createElementNS("http://www.w3.org/2000/svg", "line");
    pointerHandle.classList.add("annotation-handle", "translation");
    pointerHandle.setAttribute("data-handle-name", "co-pointer");
    pointerHandle.setAttribute("x1", pCoPointer.x + "");
    pointerHandle.setAttribute("y1", pCoPointer.y + ""); 
    pointerHandle.setAttribute("x2", pCoPointer.x + "");
    pointerHandle.setAttribute("y2", pCoPointer.y + 0.1 + ""); 
    pointerHandle.addEventListener("pointerdown", this.onCalloutHandlePointerDown);
    handles.push(pointerHandle);

    return handles;
  } 
  
  protected onSideHandlePointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      // it's a secondary touch action
      return;
    }

    const target = e.target as HTMLElement;
    const handleName = target.dataset.handleName;

    const points = this.pointsPageCS;
    switch (handleName) {
      case "co-pivot-l":
        if (Vec2.equals(points.cob, points.l)) {
          return;
        }
        points.cob.setFromVec2(points.l);
        break;
      case "co-pivot-t":
        if (Vec2.equals(points.cob, points.t)) {
          return;
        }
        points.cob.setFromVec2(points.t);
        break;
      case "co-pivot-r":
        if (Vec2.equals(points.cob, points.r)) {
          return;
        }
        points.cob.setFromVec2(points.r);
        break;
      case "co-pivot-b":
        if (Vec2.equals(points.cob, points.b)) {
          return;
        }
        points.cob.setFromVec2(points.b);
        break;
      default:
        return;
    }
    
    // transform the annotation
    this.updateStreamAsync(points);
  };
  
  protected onCalloutHandlePointerDown = (e: PointerEvent) => { 
    if (!e.isPrimary) {
      //it's a secondary touch action
      return;
    }

    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);
    target.addEventListener("pointerup", this.onCalloutHandlePointerUp);
    target.addEventListener("pointerout", this.onCalloutHandlePointerUp); 

    this._pointsTemp = this.pointsPageCS;
    this._moved = false;

    // set timeout to prevent an accidental annotation scaling
    this._transformationTimer = setTimeout(() => {
      this._transformationTimer = null;       
      // append the svg element copy     
      this._svgTemp.insertAfter(this._renderedControls);
      target.addEventListener("pointermove", this.onCalloutHandlePointerMove);
    }, 200);

    e.stopPropagation();
  };

  protected onCalloutHandlePointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) {
      //it's a secondary touch action
      return;
    }

    const target = e.target as HTMLElement;
    const handleName = target.dataset.handleName;

    switch (handleName) {
      case "co-knee":
        this._pointsTemp.cok.setFromVec2(this.convertClientCoordsToPage(e.clientX, e.clientY));
        break;
      case "co-pointer":
        this._pointsTemp.cop.setFromVec2(this.convertClientCoordsToPage(e.clientX, e.clientY));
        break;
      default:
        return;
    }

    this._svgTemp.set("none", "blue", 
      this.strokeWidth, 
      this._pointsTemp.cok 
        ? [this._pointsTemp.cob, this._pointsTemp.cok, this._pointsTemp.cop]
        : [this._pointsTemp.cob, this._pointsTemp.cop]);
    
    this._moved = true;
  };
  
  protected onCalloutHandlePointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      // it's a secondary touch action
      return;
    }

    const target = e.target as HTMLElement;
    target.removeEventListener("pointermove", this.onCalloutHandlePointerMove);
    target.removeEventListener("pointerup", this.onCalloutHandlePointerUp);
    target.removeEventListener("pointerout", this.onCalloutHandlePointerUp);
    target.releasePointerCapture(e.pointerId); 

    this._svgTemp.remove();
    
    if (this._moved) {
      // transform the annotation
      this.updateStreamAsync(this._pointsTemp);
    }
  };
  //#region 
  
  //#endregion

  protected override initProxy(): FreeTextAnnotation {
    return <FreeTextAnnotation>super.initProxy();
  }

  protected override getProxy(): FreeTextAnnotation {
    return <FreeTextAnnotation>super.getProxy();
  }
}
