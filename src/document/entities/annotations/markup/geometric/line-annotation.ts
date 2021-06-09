import { Mat3, Vec2 } from "mathador";
import { runEmptyTimeout } from "../../../../../common/dom";
import { Quadruple, Double, Hextuple } from "../../../../../common/types";
import { bezierConstant } from "../../../../../drawing/utils";

import { codes } from "../../../../codes";
import { annotationTypes, lineCapStyles, LineEndingType, 
  lineEndingTypes, lineJoinStyles, valueTypes } from "../../../../const";
import { CryptInfo } from "../../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../../data-parser";
  
import { ObjectId } from "../../../core/object-id";
import { DateString } from "../../../strings/date-string";
import { LiteralString } from "../../../strings/literal-string";
import { XFormStream } from "../../../streams/x-form-stream";
import { BorderStyleDict } from "../../../appearance/border-style-dict";
import { GraphicsStateDict } from "../../../appearance/graphics-state-dict";
import { FontDict } from "../../../appearance/font-dict";
import { ResourceDict } from "../../../appearance/resource-dict";
import { MeasureDict } from "../../../appearance/measure-dict";
import { GeometricAnnotation, GeometricAnnotationDto } from "./geometric-annotation";

interface TextLineData {
  text: string;
  rect: Quadruple;
  relativeRect: Quadruple;
}

interface TextData {
  width: number;
  height: number;
  rect: Quadruple;
  relativeRect: Quadruple;
  lines: TextLineData[];
}

interface BboxAndMatrix {
  bbox: [min: Vec2, max: Vec2];
  matrix: Mat3;
}

export const lineIntents = {
  ARROW: "/LineArrow",
  DIMENSION: "/LineDimension",
} as const;
export type LineIntent = typeof lineIntents[keyof typeof lineIntents];

export const captionPositions = {
  INLINE: "/Inline",
  TOP: "/Top",
} as const;
export type CaptionPosition = typeof captionPositions[keyof typeof captionPositions];

export interface LineAnnotationDto extends GeometricAnnotationDto {  
  vertices: Quadruple;

  intent: LineIntent;
  endingType?: [LineEndingType, LineEndingType];

  leaderLineLength?: number;
  leaderLineExtension?: number;
  leaderLineOffset?: number;

  caption?: boolean;
  captionPosition?: CaptionPosition;
  captionOffset?: Double;
}

export class LineAnnotation extends GeometricAnnotation {
  /**defines how many times the line ending size is larger than the line width */
  static readonly lineEndingMultiplier = 3;
  static readonly lineEndingMinimalSize = 10;

  //#region PDF fields
  /**
   * (Optional; PDF 1.6+) A name describing the intent of the line annotation
   */
  IT: LineIntent = lineIntents.DIMENSION;
  /**
   * (Required) An array of four numbers, [x1y1x2y2], 
   * specifying the starting and ending coordinates of the line in default user space. 
   * If the LL entry is present, this value shall represent the endpoints 
   * of the leader lines rather than the endpoints of the line itself
   */
  L: Quadruple;  
  /**
   * (Optional; PDF 1.4+) An array of two names specifying the line ending styles 
   * that shall be used in drawing the line. The first and second elements 
   * of the array shall specify the line ending styles for the endpoints defined, 
   * respectively, by the first and second pairs of coordinates, 
   * (x1, y1)and (x2, y2), in the L array
   */
  LE: [LineEndingType, LineEndingType] = [lineEndingTypes.NONE, lineEndingTypes.NONE];

  /** 
   * (Optional; PDF 1.6+) A non-negative number that shall represents the length 
   * of leader line extensions that extend from the line proper 180 degrees from the leader lines
   */
  LLE = 0;
  /** 
   * (Required if LLE is present, otherwise optional; PDF 1.6+)
   * The length of leader lines in default user space that extend 
   * from each endpoint of the line perpendicular to the line itself, as shown in Figure 60. 
   * A positive value shall mean that the leader lines appear in the direction 
   * that is clockwise when traversing the line from its starting point to its ending point 
   * (as specified by L); a negative value shall indicate the opposite direction
   */
  LL = 0;
  /** 
   * (Optional; PDF 1.7+) A non-negative number that shall represent the length 
   * of the leader line offset, which is the amount of empty space 
   * between the endpoints of the annotation and the beginning of the leader lines
   */
  LLO = 0;

  /** 
   * (Optional; PDF 1.6+) If true, the text specified by the Contents or RC entries 
   * shall be replicated as a caption in the appearance of the line
   */
  Cap = false;
  /** 
   * (Optional; meaningful only if Cap is true; PDF 1.7+) 
   * A name describing the annotation’s caption positioning. Valid values are 
   * Inline, meaning the caption shall be centered inside the line, 
   * and Top, meaning the caption shall be on top of the line
   */
  CP: CaptionPosition = captionPositions.INLINE;
  /** 
   * (Optional; meaningful only if Cap is true; PDF 1.7+) 
   * An array of two numbers that shall specify the offset of the caption text 
   * from its normal position. The first value shall be the horizontal offset 
   * along the annotation line from its midpoint, with a positive value 
   * indicating offset to the right and a negative value indicating offset to the left.
   * The second value shall be the vertical offset perpendicular to the annotation line, 
   * with a positive value indicating a shift up and a negative value indicating a shift down
   */
  CO: Double = [0, 0];

  /** 
   * (Optional; PDF 1.7+) A measure dictionary that shall specify the scale and units 
   * that apply to the line annotation
   */
  Measure: MeasureDict;
  //#endregion

  protected _scaleHandleActive: "start" | "end";  
  protected _rtStyle: string;
  protected _rtText: string;

  protected _textData: TextData;

  protected _fontMap: Map<string, FontDict>;

  /** Y-axis offset from control points to the actual line drawn */
  get offsetY(): number {
    return (Math.abs(this.LL || 0) + (this.LLO || 0)) * (this.LL < 0 ? -1 : 1);
  }
  
  constructor() {
    super(annotationTypes.LINE);
  }  
  
  static async createFromDtoAsync(dto: LineAnnotationDto, 
    fontMap: Map<string, FontDict>): Promise<LineAnnotation> {
    if (dto.annotationType !== "/Line") {
      throw new Error("Invalid annotation type");
    }

    const bs = new BorderStyleDict();
    bs.W = dto.strokeWidth;
    if (dto.strokeDashGap) {
      bs.D = dto.strokeDashGap;
    }
    
    const annotation = new LineAnnotation();
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
    annotation.IT = dto.intent || lineIntents.DIMENSION;
    annotation.LE = dto.endingType || [lineEndingTypes.NONE, lineEndingTypes.NONE];
    annotation.L = dto.vertices;
    annotation.LL = dto.leaderLineLength || 0;
    annotation.LLE = dto.leaderLineExtension || 0;
    annotation.LLO = dto.leaderLineOffset || 0;
    annotation.Cap = dto.caption;
    annotation.CP = dto.captionPosition || captionPositions.INLINE;
    annotation.CO = dto.captionOffset || [0, 0];
 
    annotation._fontMap = fontMap;
    await annotation.generateApStreamAsync();

    const proxy = new Proxy<LineAnnotation>(annotation, annotation.onChange);
    annotation._proxy = proxy;
    annotation._added = true;
    return proxy;
  }

  static parse(parseInfo: ParseInfo, 
    fontMap: Map<string, FontDict>): ParseResult<LineAnnotation> {  
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    } 
    try {
      const pdfObject = new LineAnnotation();
      pdfObject.parseProps(parseInfo);
      pdfObject._fontMap = fontMap;
      const proxy = new Proxy<LineAnnotation>(pdfObject, pdfObject.onChange);
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

    if (this.L) {
      bytes.push(
        ...encoder.encode("/L "), codes.L_BRACKET, 
        ...encoder.encode(this.L[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.L[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.L[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.L[3] + ""), codes.R_BRACKET,
      );
    }
    if (this.LE) {
      bytes.push(...encoder.encode("/LE "), codes.L_BRACKET);
      this.LE.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(x)));
      bytes.push(codes.R_BRACKET);
    }
    if (this.LL) {
      bytes.push(...encoder.encode("/LL "), ...encoder.encode(" " + this.LL));
    }
    if (this.LLE) {
      bytes.push(...encoder.encode("/LLE "), ...encoder.encode(" " + this.LLE));
    }
    if (this.Cap) {
      bytes.push(...encoder.encode("/Cap "), ...encoder.encode(" " + this.Cap));
    }
    if (this.IT) {
      bytes.push(...encoder.encode("/IT "), ...encoder.encode(this.IT));
    }
    if (this.LLO) {
      bytes.push(...encoder.encode("/LLO "), ...encoder.encode(" " + this.LLO));
    }
    if (this.CP) {
      bytes.push(...encoder.encode("/CP "), ...encoder.encode(this.CP));
    }
    if (this.Measure) {
      bytes.push(...encoder.encode("/Measure "), ...this.Measure.toArray(cryptInfo));
    }
    if (this.CO) {
      bytes.push(
        ...encoder.encode("/CO "), codes.L_BRACKET, 
        ...encoder.encode(this.CO[0] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.CO[1] + ""), codes.R_BRACKET,
      );
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }    
    
  toDto(): LineAnnotationDto {
    const color = this.getColorRect();

    return {
      annotationType: "/Line",
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

      vertices: this.L,
      intent: this.IT,
      endingType: this.LE,
      leaderLineLength: this.LL,
      leaderLineExtension: this.LLE,
      leaderLineOffset: this.LLO,
      caption: this.Cap,
      captionPosition: this.CP,
      captionOffset: this.CO,

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
          case "/L":
          case "/CO":
            i = this.parseNumberArrayProp(name, parser, i, true);
            break;
          
          case "/LE":
            const lineEndings = parser.parseNameArrayAt(i, true);
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
          case "/IT":
            const intent = parser.parseNameAt(i, true);
            if (intent) {
              if ((<string[]>Object.values(lineIntents)).includes(intent.value)) {
                this.IT = <LineIntent>intent.value;
                i = intent.end + 1;    
                break;          
              }
            }
            throw new Error("Can't parse /IT property value");
          case "/CP":
            const captionPosition = parser.parseNameAt(i, true);
            if (captionPosition && (<string[]>Object.values(captionPositions))
              .includes(captionPosition.value)) {
              this.CP = <CaptionPosition>captionPosition.value;
              i = captionPosition.end + 1;
            } else {              
              throw new Error("Can't parse /CP property value");
            }
            break; 

          case "/LL":      
          case "/LLE":
          case "/LLO":
            i = this.parseNumberProp(name, parser, i, false);
            break; 

          case "/Cap":
            i = this.parseBoolProp(name, parser, i);
            break; 

          case "/Measure":            
            const measureEntryType = parser.getValueTypeAt(i);
            if (measureEntryType === valueTypes.REF) {              
              const measureDictId = ObjectId.parseRef(parser, i);
              if (measureDictId && parseInfo.parseInfoGetter) {
                const measureParseInfo = parseInfo.parseInfoGetter(measureDictId.value.id);
                if (measureParseInfo) {
                  const measureDict = MeasureDict.parse(measureParseInfo);
                  if (measureDict) {
                    this.Measure = measureDict.value;
                    i = measureDict.end + 1;
                    break;
                  }
                }
              }              
              throw new Error("Can't parse /BS value reference");
            } else if (measureEntryType === valueTypes.DICTIONARY) { 
              const measureDictBounds = parser.getDictBoundsAt(i); 
              if (measureDictBounds) {
                const measureDict = MeasureDict.parse({parser, bounds: measureDictBounds});
                if (measureDict) {
                  this.Measure = measureDict.value;
                  i = measureDict.end + 1;
                  break;
                }
              }  
              throw new Error("Can't parse /Measure value dictionary");  
            }
            throw new Error(`Unsupported /Measure property value type: ${measureEntryType}`);   

          default:
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
    
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
  }

  protected async updateTextDataAsync(maxWidth: number): Promise<TextData> {
    const text = this.Contents?.literal;
    // const text = "Lorem-Ipsum is simply\ndummy, text of the печати, and typesetting industry.";
    
    if (text) {
      const pTemp = document.createElement("p");
      // apply default text styling
      // TODO: add support for custom styling using 'this._rtStyle' prop or smth else
      pTemp.style.color = "black";
      pTemp.style.fontSize = "9px";
      pTemp.style.fontFamily = "arial";
      pTemp.style.fontWeight = "normal";
      pTemp.style.fontStyle = "normal";
      pTemp.style.lineHeight = "normal";
      pTemp.style.overflowWrap = "normal";
      pTemp.style.textAlign = "center";
      pTemp.style.textDecoration = "none";
      pTemp.style.verticalAlign = "top";
      pTemp.style.whiteSpace = "pre-wrap";
      pTemp.style.wordBreak = "normal";

      // apply specific styling to the paragraph to hide it from the page;
      pTemp.style.position = "fixed";
      pTemp.style.left = "0";
      pTemp.style.top = "0";
      pTemp.style.margin = "0";
      pTemp.style.padding = "0";
      pTemp.style.maxWidth = maxWidth.toFixed() + "px";       
      pTemp.style.visibility = "hidden"; // DEBUG pTemp.style.zIndex = "100"; 
      pTemp.style.transform = "scale(0.1)";
      pTemp.style.transformOrigin = "top left";

      // add the paragraph to DOM
      document.body.append(pTemp);
      
      // detect wrapped lines
      // TODO: improve detecting logic
      const words = text.split(/([- \n\r])/u); //[-./\\()"',;<>~!@#$%^&*|+=[\]{}`~?: ] 
      const lines: string[] = [];
      let currentLineText = "";
      let previousHeight = 0;
      for (let i = 0; i < words.length; i++) {
        const word = words[i];
        pTemp.textContent += word;        
        await runEmptyTimeout(); // allow DOM to redraw to recalculate dimensions
        const currentHeight = pTemp.offsetHeight;
        previousHeight ||= currentHeight;
        if (currentHeight > previousHeight) {
          // line break triggered
          lines.push(currentLineText);
          currentLineText = word;
          previousHeight = currentHeight;
        } else {
          currentLineText += word;
        }
      }
      lines.push(currentLineText);

      // clear the paragraph
      pTemp.innerHTML = "";

      // create temp span for each line to get line positions
      const lineSpans: HTMLSpanElement[] = [];
      for (const line of lines) {
        const lineSpan = document.createElement("span");
        lineSpan.style.position = "relative";
        lineSpan.textContent = line;
        lineSpans.push(lineSpan);
        pTemp.append(lineSpan);
      }      
      await runEmptyTimeout(); // allow DOM to redraw to recalculate dimensions

      const textWidth = pTemp.offsetWidth;
      const textHeight = pTemp.offsetHeight;
      
      // calculate the text pivot point depending on caption position
      const pivotPoint = this.CP === captionPositions.INLINE
        ? new Vec2(textWidth / 2, textHeight / 2) // pivot point is at the text center
        : new Vec2(textWidth / 2, -this.strokeWidth); // pivot point is at the text bottom with a margin

      // calculate dimensions for each line
      const lineData: TextLineData[] = [];
      for (let i = 0; i < lines.length; i++) {
        const span = lineSpans[i];
        const x = span.offsetLeft;
        const y = span.offsetTop;
        const width = span.offsetWidth;
        const height = span.offsetHeight;
        // line dimensions in PDF CS 
        // (Y-axis is flipped, bottom-left corner is 0,0)
        const lineBottomLeftPdf = new Vec2(x, textHeight - (y + height));
        const lineTopRightPdf = new Vec2(x + width, textHeight - y);
        const lineRect: Quadruple = [
          lineBottomLeftPdf.x, lineBottomLeftPdf.y,
          lineTopRightPdf.x, lineTopRightPdf.y
        ];
        // line dimensions relative to annotation text pivot point 
        // (Y-axis is flipped, pivot point is 0,0)
        const lineBottomLeftPdfRel = Vec2.substract(lineBottomLeftPdf, pivotPoint);
        const lineTopRightPdfRel = Vec2.substract(lineTopRightPdf, pivotPoint);
        const lineRelativeRect: Quadruple = [
          lineBottomLeftPdfRel.x, lineBottomLeftPdfRel.y,
          lineTopRightPdfRel.x, lineTopRightPdfRel.y
        ];
        lineData.push({
          text: lines[i],
          rect: lineRect,
          relativeRect: lineRelativeRect,
        });
      }

      // calculate dimensions for the whole text
      // text dimensions in PDF CS 
      // (Y-axis is flipped, bottom-left corner is 0,0)
      const textRect: Quadruple = [0, 0, textWidth, textHeight];
      // text dimensions relative to annotation text pivot point 
      // (Y-axis is flipped, pivot point is 0,0)
      const textRelativeRect: Quadruple = [
        0 - pivotPoint.x, 0 - pivotPoint.y,
        textWidth - pivotPoint.x, textHeight - pivotPoint.y
      ];
      const textData: TextData = {
        width: textWidth,
        height: textHeight,
        rect: textRect,
        relativeRect: textRelativeRect,
        lines: lineData,
      };

      // remove the temp paragraph from DOM 
      // pTemp.remove();

      this._textData = textData;
    } else {
      this._textData = null;
    }

    return this._textData;
  }

  /**
   * actualize the 'Rect' property content using the current 'L' property value
   * @returns 
   */
  protected async updateRectAsync(): Promise<BboxAndMatrix> {
    const [x1, y1, x2, y2] = this.L;
    const start = new Vec2(x1, y1);
    const end = new Vec2(x2, y2);

    // calculate the data for updating bounding boxes
    const length = Vec2.substract(end, start).getMagnitude();
    const strokeWidth = this.strokeWidth;
    const halfStrokeWidth = strokeWidth / 2;

    let marginMin = 0;
    // calculate ending margin if any other line ending type except 'none' is used
    if (this.LE[0] !== lineEndingTypes.NONE || this.LE[1] !== lineEndingTypes.NONE) {
      const endingSizeInner = Math.max(strokeWidth * LineAnnotation.lineEndingMultiplier, 
        LineAnnotation.lineEndingMinimalSize);
      // '+ strokeWidth' is used to include the ending figure stroke width
      const endingSize = endingSizeInner + strokeWidth;
      marginMin = endingSize / 2;
    } else {
      marginMin = halfStrokeWidth;
    }

    const textMargin = 4 * marginMin;
    const textMaxWidth = length > textMargin
      ? length - textMargin
      : length;
    const textData = await this.updateTextDataAsync(textMaxWidth);

    // calculate the margin from the control points side of the line
    const marginFront = Math.max(
      Math.abs(this.LL || 0) + (this.LLO || 0) + halfStrokeWidth,
      marginMin,
    );
    // calculate the margin from the opposite side of the line
    const marginBack = Math.max(
      (this.LLE || 0) + halfStrokeWidth,
      marginMin,
    );
    const height = marginFront + marginBack;
     
    // calculate final margins
    const top = this.LL < 0
      ? marginMin // annotation is under control points
      : height; // annotation is above control points (or at the same line)
    const bottom = this.LL < 0
      ? height // annotation is under control points
      : marginMin; // annotation is above control points (or at the same line)

    let xMin = -marginMin;
    let yMin = -bottom;
    let xMax = length + marginMin;
    let yMax = top;
    // adjust margins to fit text if present 
    if (textData) {
      const offsetY = this.offsetY;
      const [textXMin, textYMin, textXMax, textYMax] = textData.relativeRect;
      xMin = Math.min(xMin, textXMin + length / 2);
      yMin = Math.min(yMin, textYMin + offsetY);
      xMax = Math.max(xMax, textXMax + length / 2);
      yMax = Math.max(yMax, textYMax + offsetY);
    }
    const bbox: [min: Vec2, max: Vec2] = [new Vec2(xMin, yMin), new Vec2(xMax, yMax)];
    
    const xAlignedStart = new Vec2();
    const xAlignedEnd = new Vec2(length, 0);
    const matrix = Mat3.from4Vec2(xAlignedStart, xAlignedEnd, start, end);        

    // update the non axis-aligned bounding-box
    const localBox =  this.getLocalBB();
    localBox.ll.set(bbox[0].x, bbox[0].y).applyMat3(matrix);
    localBox.lr.set(bbox[1].x, bbox[0].y).applyMat3(matrix);
    localBox.ur.set(bbox[1].x, bbox[1].y).applyMat3(matrix);
    localBox.ul.set(bbox[0].x, bbox[1].y).applyMat3(matrix);

    // update the Rect (AABB)
    const {min: rectMin, max: rectMax} = 
      Vec2.minMax(localBox.ll, localBox.lr, localBox.ur, localBox.ul);
    this.Rect = [rectMin.x, rectMin.y, rectMax.x, rectMax.y];

    return {bbox, matrix};
  }
  
  protected getLineStreamText(start: Vec2, end: Vec2): string {
    let lineStream = "";

    // draw line itself
    lineStream += `\n${start.x} ${start.y} m`;
    lineStream += `\n${end.x} ${end.y} l`;
    lineStream += "\nS";    

    // draw leader lines
    if (this.LL) {
      if (this.LL > 0) {
        lineStream += `\n${start.x} ${start.y - Math.abs(this.LL)} m`;
        lineStream += `\n${start.x} ${start.y + this.LLE} l`;
        lineStream += "\nS";
        lineStream += `\n${end.x} ${end.y - Math.abs(this.LL)} m`;
        lineStream += `\n${end.x} ${end.y + this.LLE} l`;
        lineStream += "\nS";
      } else {
        lineStream += `\n${start.x} ${start.y + Math.abs(this.LL)} m`;
        lineStream += `\n${start.x} ${start.y - this.LLE} l`;
        lineStream += "\nS";
        lineStream += `\n${end.x} ${end.y + Math.abs(this.LL)} m`;
        lineStream += `\n${end.x} ${end.y - this.LLE} l`;
        lineStream += "\nS";
      }
    }

    return lineStream;
  }

  protected getLineEndingStreamText(point: Vec2, type: LineEndingType, 
    strokeWidth: number, side: "left" | "right"): string {
    const size = Math.max(strokeWidth * LineAnnotation.lineEndingMultiplier, 
      LineAnnotation.lineEndingMinimalSize);

    let text = "";
    switch (type) {
      case lineEndingTypes.ARROW_OPEN:
        if (side === "left") {      
          text += `\n${point.x + size} ${point.y + size / 2} m`;
          text += `\n${point.x} ${point.y} l`;
          text += `\n${point.x + size} ${point.y - size / 2} l`;
        } else {
          text += `\n${point.x - size} ${point.y + size / 2} m`;
          text += `\n${point.x} ${point.y} l`;
          text += `\n${point.x - size} ${point.y - size / 2} l`;
        }
        text += "\nS";
        return text;
      case lineEndingTypes.ARROW_OPEN_R:
        if (side === "left") {      
          text += `\n${point.x} ${point.y + size / 2} m`;
          text += `\n${point.x + size} ${point.y} l`;
          text += `\n${point.x} ${point.y - size / 2} l`;
        } else {
          text += `\n${point.x} ${point.y + size / 2} m`;
          text += `\n${point.x - size} ${point.y} l`;
          text += `\n${point.x} ${point.y - size / 2} l`;
        }
        text += "\nS";
        return text;
      case lineEndingTypes.ARROW_CLOSED:
        if (side === "left") {      
          text += `\n${point.x + size} ${point.y + size / 2} m`;
          text += `\n${point.x} ${point.y} l`;
          text += `\n${point.x + size} ${point.y - size / 2} l`;
        } else {
          text += `\n${point.x - size} ${point.y + size / 2} m`;
          text += `\n${point.x} ${point.y} l`;
          text += `\n${point.x - size} ${point.y - size / 2} l`;
        }
        text += "\ns";
        return text;
      case lineEndingTypes.ARROW_CLOSED_R:
        if (side === "left") {  
          text += `\n${point.x + size} ${point.y} m`; 
          text += `\n${point.x} ${point.y + size / 2} l`;
          text += `\n${point.x} ${point.y - size / 2} l`;
        } else { 
          text += `\n${point.x - size} ${point.y} m`;
          text += `\n${point.x} ${point.y - size / 2} l`;
          text += `\n${point.x} ${point.y + size / 2} l`;
        }
        text += "\ns";
        return text;
      case lineEndingTypes.BUTT:     
        text += `\n${point.x} ${point.y + size / 2} m`;
        text += `\n${point.x} ${point.y - size / 2} l`;
        text += "\nS";
        return text;
      case lineEndingTypes.SLASH:     
        text += `\n${point.x + size / 2} ${point.y + size / 2} m`;
        text += `\n${point.x - size / 2} ${point.y - size / 2} l`;
        text += "\nS";
        return text;        
      case lineEndingTypes.DIAMOND:     
        text += `\n${point.x} ${point.y + size / 2} m`;
        text += `\n${point.x + size / 2} ${point.y} l`;
        text += `\n${point.x} ${point.y - size / 2} l`;
        text += `\n${point.x - size / 2} ${point.y} l`;
        text += "\ns";
        return text;       
      case lineEndingTypes.SQUARE:     
        text += `\n${point.x - size / 2} ${point.y + size / 2} m`;
        text += `\n${point.x + size / 2} ${point.y + size / 2} l`;
        text += `\n${point.x + size / 2} ${point.y - size / 2} l`;
        text += `\n${point.x - size / 2} ${point.y - size / 2} l`;
        text += "\ns";
        return text;       
      case lineEndingTypes.CIRCLE:
        const c = bezierConstant;
        const r = size / 2;       
        const cw = c * r;
        const xmin = point.x - r;
        const ymin = point.y - r;
        const xmax = point.x + r;
        const ymax = point.y + r;
        // drawing four cubic bezier curves starting at the top tangent
        text += `\n${point.x} ${ymax} m`;
        text += `\n${point.x + cw} ${ymax} ${xmax} ${point.y + cw} ${xmax} ${point.y} c`;
        text += `\n${xmax} ${point.y - cw} ${point.x + cw} ${ymin} ${point.x} ${ymin} c`;
        text += `\n${point.x - cw} ${ymin} ${xmin} ${point.y - cw} ${xmin} ${point.y} c`;
        text += `\n${xmin} ${point.y + cw} ${point.x - cw} ${ymax} ${point.x} ${ymax} c`;
        text += "\nS";
        return text;
      case lineEndingTypes.NONE:
      default:
        return "";
    }
  }

  protected async getTextStreamTextAsync(start: Vec2, end: Vec2, 
    textData: TextData, codeMap: Map<string, number>, fontName: string): Promise<string> {
    const lineCenter = Vec2.add(start, end).multiplyByScalar(0.5);
    
    const [xMin, yMin, xMax, yMax] = textData.relativeRect;
    // the text corner coordinates in annotation-local CS
    const topLeftLCS = new Vec2(xMin, yMin).add(lineCenter);
    const bottomRightLCS = new Vec2(xMax, yMax).add(lineCenter);

    // DEBUG
    // draw text background rect      
    const textBgRectStream = 
      "\nq 1 g 1 G" // push the graphics state onto the stack and set bg color
      + `\n${topLeftLCS.x} ${topLeftLCS.y} m`
      + `\n${topLeftLCS.x} ${bottomRightLCS.y} l`
      + `\n${bottomRightLCS.x} ${bottomRightLCS.y} l`
      + `\n${bottomRightLCS.x} ${topLeftLCS.y} l`
      + "\nf"
      + "\nQ"; // pop the graphics state back from the stack

    // TODO: implement drawing text
    let textStream = "\nq 0 g 0 G"; // push the graphics state onto the stack and set text color
    const fontSize = 9;
    for (const line of textData.lines) {
      if (!line.text) {
        continue;
      }      
      const lineStart = new Vec2(line.relativeRect[0], line.relativeRect[1]).add(lineCenter);
      let lineHex = "";
      for (const char of line.text) {
        const code = codeMap.get(char);
        if (code) {
          lineHex += code.toString(16).padStart(2, "0");
        }
      }
      textStream += `\nBT 0 Tc 0 Tw 100 Tz ${fontName} ${fontSize} Tf 0 Tr`;
      textStream += `\n1 0 0 1 ${lineStart.x} ${lineStart.y + fontSize * 0.2} Tm`;
      textStream += `\n<${lineHex}> Tj`;
      textStream += "\nET";
    };
    textStream += "\nQ"; // pop the graphics state back from the stack
      
    return textBgRectStream + textStream;
  }

  protected async generateApStreamAsync() {
    if (!this.L) {
      return;
    }

    // update Rect and get the bounding box and the matrix for the stream
    const data = await this.updateRectAsync();

    const apStream = new XFormStream();
    apStream.Filter = "/FlateDecode";
    apStream.LastModified = DateString.fromDate(new Date());
    apStream.BBox = [data.bbox[0].x, data.bbox[0].y, data.bbox[1].x, data.bbox[1].y];
    apStream.Matrix = <Hextuple><any>data.matrix.toFloatShortArray();
    apStream.Resources = new ResourceDict();

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
    gs.D = [[strokeDash, strokeGap], 0];
    gs.LC = lineCapStyles.SQUARE;
    gs.LJ = lineJoinStyles.MITER;
    apStream.Resources.setGraphicsState("/GS0", gs);
    
    const matrixInv = Mat3.invert(data.matrix);
    // calculate start and end position coordinates before transformation
    const apStart = new Vec2(this.L[0], this.L[1])
      .applyMat3(matrixInv)
      .truncate();
    const apEnd = new Vec2(this.L[2], this.L[3])
      .applyMat3(matrixInv)
      .truncate();
    const offsetY = this.offsetY;
    apStart.y += offsetY;
    apEnd.y += offsetY;    
    
    const lineStream = this.getLineStreamText(apStart, apEnd);
    const leftEnding = this.getLineEndingStreamText(apStart, this.LE[0], strokeWidth, "left");
    const rightEnding = this.getLineEndingStreamText(apEnd, this.LE[1], strokeWidth, "right");

    let textStream: string;
    if (this._textData) {  
      // TODO: add other fonts
      const fontFamily = "arial";
      const font = this._fontMap?.get(fontFamily);
      const codeMap = font.encoding?.codeMap;
      if (!font || !codeMap) {
        throw new Error(`Font not found in the font map: '${fontFamily}'`);
      }

      const fontName = "/tspdfF0";
      apStream.Resources.setFont(fontName, font);
      textStream = await this.getTextStreamTextAsync(apStart, apEnd, 
        this._textData, codeMap, fontName);
    } else {
      textStream = "";
    }

    const streamTextData = 
      `q ${colorString} /GS0 gs` // push the graphics state onto the stack
      + lineStream // draw line itself with leader lines
      + leftEnding // draw line left ending 
      + rightEnding // draw line right ending
      + textStream // draw text if present
      + "\nQ"; // pop the graphics state back from the stack
    apStream.setTextStreamData(streamTextData);    

    this.apStream = apStream;
  }

  protected async applyCommonTransformAsync(matrix: Mat3) {  
    const dict = <LineAnnotation>this._proxy || this;

    // transform the segment end points    
    const [x1, y1, x2, y2] = dict.L;
    const start = new Vec2(x1, y1).applyMat3(matrix);
    const end = new Vec2(x2, y2).applyMat3(matrix);
    dict.L = [start.x, start.y, end.x, end.y];

    // rebuild the appearance stream instead of transforming it to get rid of line distorsions
    await dict.generateApStreamAsync();

    dict.M = DateString.fromDate(new Date());
  }
  
  //#region overriding handles
  protected renderHandles(): SVGGraphicsElement[] {   
    return [...this.renderLineEndHandles(), this.renderRotationHandle()];
  } 
  
  protected renderLineEndHandles(): SVGGraphicsElement[] {
    const startHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    startHandle.classList.add("annotation-handle-scale");
    startHandle.setAttribute("data-handle-name", "start");
    startHandle.setAttribute("cx", this.L[0] + "");
    startHandle.setAttribute("cy", this.L[1] + ""); 
    startHandle.addEventListener("pointerdown", this.onLineEndHandlePointerDown);
    
    const endHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    endHandle.classList.add("annotation-handle-scale");
    endHandle.setAttribute("data-handle-name", "end");
    endHandle.setAttribute("cx", this.L[2] + "");
    endHandle.setAttribute("cy", this.L[3] + ""); 
    endHandle.addEventListener("pointerdown", this.onLineEndHandlePointerDown);

    return [startHandle, endHandle];
  } 
  
  protected onLineEndHandlePointerDown = (e: PointerEvent) => { 
    if (!e.isPrimary) {
      //it's a secondary touch action
      return;
    }

    document.addEventListener("pointerup", this.onLineEndHandlePointerUp);
    document.addEventListener("pointerout", this.onLineEndHandlePointerUp); 

    const target = e.target as HTMLElement;

    const handleName = target.dataset["handleName"];
    switch (handleName) {
      case "start": 
        this._scaleHandleActive = "start";    
        break;
      case "end":
        this._scaleHandleActive = "end";    
        break;
      default:
        // execution should not reach here
        throw new Error(`Invalid handle name: ${handleName}`);
    }

    // set timeout to prevent an accidental annotation scaling
    this._transformationTimer = setTimeout(() => {
      this._transformationTimer = null;       
      // append the svg element copy     
      this._renderedControls.after(this._svgContentCopy);
      document.addEventListener("pointermove", this.onLineEndHandlePointerMove);
    }, 200);

    e.stopPropagation();
  };

  protected onLineEndHandlePointerMove = (e: PointerEvent) => {
    if (!e.isPrimary || !this._scaleHandleActive) {
      //it's a secondary touch action or no scale handle is activated
      return;
    }

    // calculate transformation
    // source line ends
    const start = new Vec2(this.L[0], this.L[1]);
    const end = new Vec2(this.L[2], this.L[3]);
    // transformed line ends
    let startTemp: Vec2;
    let endTemp: Vec2;
    if (this._scaleHandleActive === "start") {
      startTemp = this.convertClientCoordsToPage(e.clientX, e.clientY);
      endTemp = end.clone();
    } else {
      startTemp = start.clone();
      endTemp = this.convertClientCoordsToPage(e.clientX, e.clientY);
    }    
    // set the temp transformation matrix
    this._tempTransformationMatrix = Mat3.from4Vec2(start, end, startTemp, endTemp);
    
    // move the svg element copy to visualize the future transformation in real-time
    this._svgContentCopy.setAttribute("transform", 
      `matrix(${this._tempTransformationMatrix.toFloatShortArray().join(" ")})`);
  };
  
  protected onLineEndHandlePointerUp = async (e: PointerEvent) => {
    if (!e.isPrimary) {
      // it's a secondary touch action
      return;
    }

    document.removeEventListener("pointermove", this.onLineEndHandlePointerMove);
    document.removeEventListener("pointerup", this.onLineEndHandlePointerUp);
    document.removeEventListener("pointerout", this.onLineEndHandlePointerUp);
    
    // transform the annotation
    await this.applyTempTransformAsync();
    await this.updateRenderAsync();
  };
  //#endregion
}
