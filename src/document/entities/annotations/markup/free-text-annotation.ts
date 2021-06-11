import { Mat3, Vec2 } from "mathador";

import { Hextuple, Quadruple } from "../../../../common/types";
import { calcPdfBBoxToRectMatrices, VecMinMax } from "../../../../drawing/utils";

import { codes } from "../../../char-codes";
import { annotationTypes, JustificationType, justificationTypes, 
  lineCapStyles, 
  lineEndingMinimalSize, lineEndingMultiplier, 
  LineEndingType, lineEndingTypes, lineJoinStyles } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../data-parser";

import { LiteralString } from "../../strings/literal-string";
import { DateString } from "../../strings/date-string";
import { XFormStream } from "../../streams/x-form-stream";
import { FontDict } from "../../appearance/font-dict";
import { ResourceDict } from "../../appearance/resource-dict";
import { GraphicsStateDict } from "../../appearance/graphics-state-dict";

import { MarkupAnnotation } from "./markup-annotation";

export const freeTextIntents = {
  PLAIN_TEXT: "/FreeText",
  WITH_CALLOUT: "/FreeTextCallout",
  CLICK_TO_TYPE: "/FreeTextTypeWriter",
} as const;
export type FreeTextIntent = typeof freeTextIntents[keyof typeof freeTextIntents];

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
    if (this.CL?.length && this.LE && this.LE !== lineEndingTypes.NONE) {
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
  
  static parse(parseInfo: ParseInfo, 
    fontMap: Map<string, FontDict>): ParseResult<FreeTextAnnotation> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new FreeTextAnnotation();
      pdfObject.parseProps(parseInfo);
      pdfObject._fontMap = fontMap;
      const proxy = new Proxy<FreeTextAnnotation>(pdfObject, pdfObject.onChange);
      pdfObject._proxy = proxy;
      return {value: proxy, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
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
      bytes.push(...encoder.encode("/CL "), codes.L_BRACKET);
      this.CL.forEach(x => bytes.push(...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
    }
    if (this.IT) {
      bytes.push(...encoder.encode("/IT "), ...encoder.encode(this.IT));
    }
    if (this.RD) {
      bytes.push(
        ...encoder.encode("/RD "), codes.L_BRACKET, 
        ...encoder.encode(this.RD[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.RD[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.RD[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.RD[3] + ""), codes.R_BRACKET,
      );
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
  
  override setTextContent(text: string) {
    super.setTextContent(text);
    const dict = <FreeTextAnnotation>this._proxy;
    dict.generateApStreamAsync(this.pointsPageCS).then(() => dict.updateRenderAsync());
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected override parseProps(parseInfo: ParseInfo) {
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
          case "/DA":         
          case "/DS":            
          case "/RC":            
            i = this.parseLiteralProp(name, parser, i, parseInfo.cryptInfo);
            break;

          case "/Q":
            const justification = parser.parseNumberAt(i, true);
            if (justification && (<number[]>Object.values(justificationTypes))
              .includes(justification.value)) {
              this.Q = <JustificationType>justification.value;
              i = justification.end + 1;              
            } else {              
              throw new Error("Can't parse /Q property value");
            }
            break;
          case "/LE":
            const lineEndingType = parser.parseNameAt(i, true);
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
            i = this.parseNumberArrayProp(name, parser, i, true);
            break;

          case "/IT":
            const intent = parser.parseNameAt(i, true);
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
            i = parser.skipToNextName(i, end - 1);
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
    const length = Vec2.substract(tbTopRightPage, tbTopLeftPage).getMagnitude();
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
    const sBL = Vec2.applyMat3(pBL, matrixPageToStream);
    const sTR = Vec2.applyMat3(pTR, matrixPageToStream);
    const sBR = Vec2.applyMat3(pBR, matrixPageToStream);
    const sTL = Vec2.applyMat3(pTL, matrixPageToStream);
    const sL = Vec2.applyMat3(pL, matrixPageToStream);
    const sT = Vec2.applyMat3(pT, matrixPageToStream);
    const sR = Vec2.applyMat3(pR, matrixPageToStream);
    const sB = Vec2.applyMat3(pB, matrixPageToStream);
    const sCoBase = pCoBase ? Vec2.applyMat3(pCoBase, matrixPageToStream) : null;
    const sCoKnee = pCoKnee ? Vec2.applyMat3(pCoKnee, matrixPageToStream) : null;
    const sCoPointer = pCoPointer ? Vec2.applyMat3(pCoPointer, matrixPageToStream) : null;

    // get minimum and maximum point coordinates in stream CS
    const {min: boxMinNoMargin, max: boxMaxNoMargin} = 
      Vec2.minMax(sBL, sTR, sBR, sTL, sCoKnee, sCoPointer);

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
    localBox.ll.set(boxMin.x, boxMin.y).applyMat3(matrixStreamToPage);
    localBox.lr.set(boxMax.x, boxMin.y).applyMat3(matrixStreamToPage);
    localBox.ur.set(boxMax.x, boxMax.y).applyMat3(matrixStreamToPage);
    localBox.ul.set(boxMin.x, boxMax.y).applyMat3(matrixStreamToPage);

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
    // TODO: implement getting real color if possible
    return "1 G 1 0 0 rg";
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
        calloutStream += `\n${sPoints.cok.x} ${sPoints.cok.x} l`;
      }
      calloutStream += `\n${sPoints.cop.x} ${sPoints.cop.y} l`;
      calloutStream += "\nS";

      // draw callout pointer
      const coEnds = sPoints.cok
        ? [sPoints.cok, sPoints.cop]
        : [sPoints.cob, sPoints.cop];
      const [coStart, coEnd] = coEnds;
      const coStartAligned = new Vec2(0, 0);
      const coEndAligned = new Vec2(Vec2.substract(coEnd, coStart).getMagnitude());
      const coMat = Mat3.from4Vec2(coStartAligned, coEndAligned, coStart, coEnd);      
      const calloutPointerStream = this.getLineEndingStreamPart(coEndAligned, 
        this.LE, this.strokeWidth, "right");
      calloutStream += `\nq ${coMat.toFloatShortArray().join(" ")} cm`;
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
    const textMaxWidth = sPoints.br.x - sPoints.bl.x - this.strokeWidth;
    if (textMaxWidth <= 0) {
      return "";
    }

    const textData = await this.updateTextDataAsync({
      maxWidth: textMaxWidth, // prevent text to intersect with border
      fontSize: 12,
      textAlign: "center",
      pivotPoint: "top-left",
    });

    if (!textData) {
      return "";
    }

    let textStream = "\nq 0 g 0 G"; // push the graphics state onto the stack and set text color
    const fontSize = 9;
    const codeMap = font.encoding.codeMap;
    for (const line of textData.lines) {
      if (!line.text) {
        continue;
      }      
      const lineStart = new Vec2(line.relativeRect[0], line.relativeRect[1]).add(sPoints.tl);
      let lineHex = "";
      for (const char of line.text) {
        const code =  codeMap.get(char);
        if (code) {
          lineHex += code.toString(16).padStart(2, "0");
        }
      }
      textStream += `\nBT 0 Tc 0 Tw 100 Tz ${font.name} ${fontSize} Tf 0 Tr`;
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
      + `\n${sPoints.tr.x} ${sPoints.tr.y} m`
      + `\n${sPoints.tl.x} ${sPoints.tl.y} m`
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
  
  protected renderTextBoxCornerHandles(points: FreeTextAnnotPoints): SVGGraphicsElement[] {
    // text box corners in page CS
    const {bl: pBL, br: pBR, tr: pTR, tl: pTL} = points;

    const cornerMap = new Map<string, Vec2>();
    cornerMap.set("tb-bl", pBL);
    cornerMap.set("tb-br", pTR);
    cornerMap.set("tb-tr", pBR);
    cornerMap.set("tb-tl", pTL);

    const handles: SVGGraphicsElement[] = [];
    ["tb-bl", "tb-br", "tb-tr", "tb-tl"].forEach(x => {
      const {x: cx, y: cy} = cornerMap.get(x);
      const handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      handle.classList.add("annotation-handle", "scale");
      handle.setAttribute("data-handle-name", x);
      handle.setAttribute("cx", cx + "");
      handle.setAttribute("cy", cy + ""); 
      // handle.addEventListener("pointerdown", this.onScaleHandlePointerDown); // TODO: replace
      handles.push(handle);   
    });

    return handles;
  } 
  
  protected renderCalloutHandles(points: FreeTextAnnotPoints): SVGGraphicsElement[] {
    // callout points in page CS
    const {cob: pCoBase, cok: pCoKnee, cop: pCoPointer} = points;

    const handles: SVGGraphicsElement[] = [];

    if (pCoKnee) {
      const kneeHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      kneeHandle.classList.add("annotation-handle", "scale");
      kneeHandle.setAttribute("data-handle-name", "co-knee");
      kneeHandle.setAttribute("cx", pCoKnee.x + "");
      kneeHandle.setAttribute("cy", pCoKnee.y + ""); 
      // handle.addEventListener("pointerdown", this.onScaleHandlePointerDown); // TODO: replace
      handles.push(kneeHandle);   
    }

    if (pCoBase) {
      const baseHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      baseHandle.classList.add("annotation-handle", "scale");
      baseHandle.setAttribute("data-handle-name", "co-base");
      baseHandle.setAttribute("cx", pCoBase.x + "");
      baseHandle.setAttribute("cy", pCoBase.y + ""); 
      // handle.addEventListener("pointerdown", this.onScaleHandlePointerDown); // TODO: replace
      handles.push(baseHandle); 
    }

    if (pCoPointer) {
      const pointerHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pointerHandle.classList.add("annotation-handle", "scale");
      pointerHandle.setAttribute("data-handle-name", "co-pointer");
      pointerHandle.setAttribute("cx", pCoPointer.x + "");
      pointerHandle.setAttribute("cy", pCoPointer.y + ""); 
      // handle.addEventListener("pointerdown", this.onScaleHandlePointerDown); // TODO: replace
      handles.push(pointerHandle);
    }

    return handles;
  } 
  //#endregion
}
