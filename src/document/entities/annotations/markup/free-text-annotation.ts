import { Mat3, Vec2 } from "mathador";

import { Quadruple } from "../../../../common/types";
import { calcPdfBBoxToRectMatrices } from "../../../../drawing/utils";

import { codes } from "../../../codes";
import { annotationTypes, JustificationType, 
  justificationTypes, 
  LineEndingType, lineEndingTypes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../data-parser";

import { LiteralString } from "../../strings/literal-string";
import { FontDict } from "../../appearance/font-dict";

import { MarkupAnnotation } from "./markup-annotation";

export const freeTextIntents = {
  PLAIN_TEXT: "/FreeText",
  WITH_CALLOUT: "/FreeTextCallout",
  CLICK_TO_TYPE: "/FreeTextTypeWriter",
} as const;
export type FreeTextIntent = typeof freeTextIntents[keyof typeof freeTextIntents];

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
  
  //#region overriding handles
  protected override renderHandles(): SVGGraphicsElement[] {  
    const stream = this.apStream; 
    const {matAA: mat} = calcPdfBBoxToRectMatrices(stream.BBox, this.Rect, stream.Matrix);

    return [
      ...this.renderTextBoxCornerHandles(mat), 
      ...this.renderCalloutHandles(mat), 
      this.renderRotationHandle()
    ];
  } 
  
  protected renderTextBoxCornerHandles(mat: Mat3): SVGGraphicsElement[] {
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
    // text box corners in page CS
    const pBL = Vec2.applyMat3(apBL, mat);
    const pTR = Vec2.applyMat3(apTR, mat);
    const pBR = Vec2.applyMat3(apBR, mat);
    const pTL = Vec2.applyMat3(apTL, mat);

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
  
  protected renderCalloutHandles(mat: Mat3): SVGGraphicsElement[] {
    const cl = this.CL;
    if (!cl?.length) {
      return [];
    }

    // callout points in untransformed stream CS
    let apCoBase: Vec2;
    let apCoPointer: Vec2;
    let apCoKnee: Vec2;
    if (cl.length === 6) {
      apCoBase = new Vec2(cl[4], cl[5]);
      apCoKnee = new Vec2(cl[2], cl[3]);
      apCoPointer = new Vec2(cl[0], cl[1]);
    } else if (cl.length === 4) {
      apCoBase = new Vec2(cl[2], cl[3]);
      apCoPointer = new Vec2(cl[0], cl[1]);
    } else {
      throw new Error(`Invalid callout array length: ${cl.length}`);
    }

    const handles: SVGGraphicsElement[] = [];

    if (apCoKnee) {
      // callout knee point in page CS
      const pCoKnee = Vec2.applyMat3(apCoKnee, mat);
      const kneeHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      kneeHandle.classList.add("annotation-handle", "scale");
      kneeHandle.setAttribute("data-handle-name", "co-knee");
      kneeHandle.setAttribute("cx", pCoKnee.x + "");
      kneeHandle.setAttribute("cy", pCoKnee.y + ""); 
      // handle.addEventListener("pointerdown", this.onScaleHandlePointerDown); // TODO: replace
      handles.push(kneeHandle);   
    }

    // callout base point in page CS
    const pCoBase = Vec2.applyMat3(apCoBase, mat);
    const baseHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    baseHandle.classList.add("annotation-handle", "scale");
    baseHandle.setAttribute("data-handle-name", "co-base");
    baseHandle.setAttribute("cx", pCoBase.x + "");
    baseHandle.setAttribute("cy", pCoBase.y + ""); 
    // handle.addEventListener("pointerdown", this.onScaleHandlePointerDown); // TODO: replace
    handles.push(baseHandle); 

    // callout pointer point in page CS
    const pCoPointer = Vec2.applyMat3(apCoPointer, mat);
    const pointerHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    pointerHandle.classList.add("annotation-handle", "scale");
    pointerHandle.setAttribute("data-handle-name", "co-pointer");
    pointerHandle.setAttribute("cx", pCoPointer.x + "");
    pointerHandle.setAttribute("cy", pCoPointer.y + ""); 
    // handle.addEventListener("pointerdown", this.onScaleHandlePointerDown); // TODO: replace
    handles.push(pointerHandle);

    return handles;
  } 
  //#endregion
}
