import { Mat3, Vec2 } from "mathador";
import { VecMinMax, lineEndingMinimalSize, 
  lineEndingMultiplier } from "../../../../../drawing/utils";
import { Quadruple, Double, Hextuple } from "../../../../../common/types";
import { TempSvgPath } from "../../../../../common/dom";

import { codes } from "../../../../encoding/char-codes";
import { annotationTypes, valueTypes, lineCapStyles, LineEndingType, 
  lineEndingTypes, lineJoinStyles, lineIntents, LineIntent, 
  lineCaptionPositions, LineCaptionPosition } from "../../../../spec-constants";
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

export interface LineAnnotationDto extends GeometricAnnotationDto {  
  vertices: Quadruple;

  intent: LineIntent;
  endingType?: [LineEndingType, LineEndingType];

  leaderLineLength?: number;
  leaderLineExtension?: number;
  leaderLineOffset?: number;

  caption?: boolean;
  captionPosition?: LineCaptionPosition;
  captionOffset?: Double;
}

export class LineAnnotation extends GeometricAnnotation {
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
  CP: LineCaptionPosition = lineCaptionPositions.INLINE;
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

  protected _fontMap: Map<string, FontDict>;
  
  protected readonly _svgTemp = new TempSvgPath();

  /** Y-axis offset from control points to the actual line drawn */
  get offsetY(): number {
    return (Math.abs(this.LL || 0) + (this.LLO || 0)) * (this.LL < 0 ? -1 : 1);
  }
  
  /**minimal margin needed to be added for correct annotation content rendering */
  get minMargin(): number {
    const strokeWidth = this.strokeWidth;
    const halfStrokeWidth = strokeWidth / 2;
    let marginMin = 0;
    // calculate ending margin if any other line ending type except 'none' is used
    if (this.LE[0] !== lineEndingTypes.NONE || this.LE[1] !== lineEndingTypes.NONE) {
      const endingSizeInner = Math.max(strokeWidth * lineEndingMultiplier, 
        lineEndingMinimalSize);
      // '+ strokeWidth' is used to include the ending figure stroke width
      const endingSize = endingSizeInner + strokeWidth;
      marginMin = endingSize / 2;
    } else {
      marginMin = halfStrokeWidth;
    }

    return marginMin;
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
    annotation.CP = dto.captionPosition || lineCaptionPositions.INLINE;
    annotation.CO = dto.captionOffset || [0, 0];
 
    annotation._fontMap = fontMap;
    await annotation.generateApStreamAsync();

    annotation._added = true;
    return annotation.initProxy();
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
    
  override toDto(): LineAnnotationDto {
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

  override async setTextContentAsync(text: string, undoable = true) {
    await super.setTextContentAsync(text, undoable);
    await this.updateStreamAsync();
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
            if (captionPosition && (<string[]>Object.values(lineCaptionPositions))
              .includes(captionPosition.value)) {
              this.CP = <LineCaptionPosition>captionPosition.value;
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

  protected override async applyCommonTransformAsync(matrix: Mat3, undoable = true) {  
    // use proxy for tracking property changes
    const dict = this.getProxy();

    // transform the segment end points    
    const [x1, y1, x2, y2] = dict.L;
    const start = new Vec2(x1, y1).applyMat3(matrix);
    const end = new Vec2(x2, y2).applyMat3(matrix);
    dict.L = [start.x, start.y, end.x, end.y];

    // rebuild the appearance stream instead of transforming it to get rid of line distorsions
    await dict.generateApStreamAsync();

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
  
  protected async updateStreamAsync() { 
    // use proxy for tracking property changes   
    const dict = this.getProxy();
    await dict.generateApStreamAsync();
    await dict.updateRenderAsync();
  }

  //#region generating appearance stream
  protected async calculateStreamBboxAsync(): Promise<VecMinMax> {
    const [x1, y1, x2, y2] = this.L;
    const length = new Vec2(x2 - x1, y2 - y1).getMagnitude(); 

    const strokeWidth = this.strokeWidth;
    const halfStrokeWidth = strokeWidth / 2;
    const marginMin = this.minMargin;

    const textMargin = 4 * marginMin;
    const textMaxWidth = length > textMargin
      ? length - textMargin
      : length;
    const textData = await this.updateTextDataAsync({
      maxWidth: textMaxWidth,
      fontSize: 9,
      textAlign: "center",
      pivotPoint: this.CP === lineCaptionPositions.INLINE
        ? "center"
        : "bottom-margin",
    });

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

    return bbox;
  }

  /**
   * get transformation matrix from stream CS to page CS
   * @returns 
   */
  protected calculateStreamMatrix(): Mat3 {
    const [x1, y1, x2, y2] = this.L;
    const start = new Vec2(x1, y1);
    const end = new Vec2(x2, y2);

    // calculate the data for updating bounding boxes
    const length = Vec2.subtract(end, start).getMagnitude();    
    const xAlignedStart = new Vec2();
    const xAlignedEnd = new Vec2(length, 0);
    const matrix = Mat3.from4Vec2(xAlignedStart, xAlignedEnd, start, end);

    return matrix;
  }
 
  /**
   * actualize the 'Rect' property content
   * @param bbox bounding box in stream CS
   * @param matrix transformation matrix
   */
  protected updateRect(bbox: VecMinMax, matrix: Mat3) {
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
  }

  /**
   * 
   * @param matrix transformation matrix from stream CS to page CS
   * @returns 
   */
  protected getLineEndsStreamCoords(matrix: Mat3): VecMinMax {
    const matrixInv = Mat3.invert(matrix);
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
    
    return [apStart, apEnd];
  }
   
  protected getLineStreamPart(start: Vec2, end: Vec2): string {
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

  protected async getTextStreamPartAsync(pivotPoint: Vec2, font: FontDict): Promise<string> {
    const textData = this._textData;
    if (!textData) {
      return "";
    }
    
    const [xMin, yMin, xMax, yMax] = textData.relativeRect;
    // the text corner coordinates in annotation-local CS
    const bottomLeftLCS = new Vec2(xMin, yMin).add(pivotPoint);
    const topRightLCS = new Vec2(xMax, yMax).add(pivotPoint);

    // draw text background rect
    const textBgRectStream = 
      "\nq 1 g 1 G" // push the graphics state onto the stack and set bg color
      + `\n${bottomLeftLCS.x} ${bottomLeftLCS.y} m`
      + `\n${bottomLeftLCS.x} ${topRightLCS.y} l`
      + `\n${topRightLCS.x} ${topRightLCS.y} l`
      + `\n${topRightLCS.x} ${bottomLeftLCS.y} l`
      + "\nf"
      + "\nQ"; // pop the graphics state back from the stack

    let textStream = "\nq 0 g 0 G"; // push the graphics state onto the stack and set text color
    const fontSize = 9;
    for (const line of textData.lines) {
      if (!line.text) {
        continue;
      }      
      const lineStart = new Vec2(line.relativeRect[0], line.relativeRect[1]).add(pivotPoint);
      let lineHex = "";
      for (const char of line.text) {
        const code = font.encoding.codeMap.get(char);
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
      
    return textBgRectStream + textStream;
  }

  protected async generateApStreamAsync() {
    if (!this.L) {
      return;
    }

    const bbox = await this.calculateStreamBboxAsync();
    const matrix = this.calculateStreamMatrix();
    this.updateRect(bbox, matrix);

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
    const [apStart, apEnd] = this.getLineEndsStreamCoords(matrix);  

    // get stream parts   
    const lineStreamPart = this.getLineStreamPart(apStart, apEnd);
    const leftEndingStreamPart = this.getLineEndingStreamPart(apStart, this.LE[0], strokeWidth, "left");
    const rightEndingStreamPart = this.getLineEndingStreamPart(apEnd, this.LE[1], strokeWidth, "right");
    const textStreamPart = await this.getTextStreamPartAsync(
      Vec2.add(apStart, apEnd).multiplyByScalar(0.5), font);

    // combine stream parts
    const streamTextData = 
      `q ${colorString} /GS0 gs` // push the graphics state onto the stack
      + lineStreamPart // draw line itself with leader lines
      + leftEndingStreamPart // draw line left ending 
      + rightEndingStreamPart // draw line right ending
      + textStreamPart // draw text if present
      + "\nQ"; // pop the graphics state back from the stack
    apStream.setTextStreamData(streamTextData);    

    this.apStream = apStream;
  }
  //#endregion
  
  //#region overriding handles
  protected override renderHandles(): SVGGraphicsElement[] {   
    return [...this.renderLineEndHandles(), this.renderRotationHandle()];
  } 
  
  protected renderLineEndHandles(): SVGGraphicsElement[] {
    const startHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    startHandle.classList.add("annotation-handle", "scale");
    startHandle.setAttribute("data-handle-name", "start");
    startHandle.setAttribute("cx", this.L[0] + "");
    startHandle.setAttribute("cy", this.L[1] + ""); 
    startHandle.addEventListener("pointerdown", this.onLineEndHandlePointerDown);
    
    const endHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    endHandle.classList.add("annotation-handle", "scale");
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
    
    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);
    target.addEventListener("pointerup", this.onLineEndHandlePointerUp);
    target.addEventListener("pointerout", this.onLineEndHandlePointerUp);

    const handleName = target.dataset.handleName;
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

    this._moved = false;

    // set timeout to prevent an accidental annotation scaling
    this._transformationTimer = setTimeout(() => {
      this._transformationTimer = null;       
      // append the svg element copy     
      this._svgTemp.insertAfter(this._renderedControls);
      target.addEventListener("pointermove", this.onLineEndHandlePointerMove);
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
    this._svgTemp.set("none", "blue", this.strokeWidth, [startTemp, endTemp]);

    this._moved = true;
  };
  
  protected onLineEndHandlePointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      // it's a secondary touch action
      return;
    }

    const target = e.target as HTMLElement;
    target.removeEventListener("pointermove", this.onLineEndHandlePointerMove);
    target.removeEventListener("pointerup", this.onLineEndHandlePointerUp);
    target.removeEventListener("pointerout", this.onLineEndHandlePointerUp);
    target.releasePointerCapture(e.pointerId);
    
    this._svgTemp.remove();    
    this.applyTempTransformAsync();
  };
  //#endregion
  
  protected override initProxy(): LineAnnotation {
    return <LineAnnotation>super.initProxy();
  }

  protected override getProxy(): LineAnnotation {
    return <LineAnnotation>super.getProxy();
  }
}
