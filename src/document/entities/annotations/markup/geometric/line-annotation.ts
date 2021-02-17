import { codes } from "../../../../codes";
import { LineEndingType, lineEndingTypes, annotationTypes, Rect, valueTypes, Pair } from "../../../../const";
import { DataCryptor } from "../../../../crypto";
import { ParseInfo, ParseResult } from "../../../../parser/data-parser";
import { ObjectId } from "../../../common/object-id";
import { MeasureDict } from "../../../misc/measure-dict";
import { GeometricAnnotation } from "./geometric-annotation";

export const lineIntents = {
  ARROW: "/LineArrow",
  DIMESION: "/LineDimension",
} as const;
export type LineIntent = typeof lineIntents[keyof typeof lineIntents];

export const captionPositions = {
  INLINE: "/Inline",
  TOP: "/Top",
} as const;
export type CaptionPosition = typeof captionPositions[keyof typeof captionPositions];

export class LineAnnotation extends GeometricAnnotation {
  /**
   * (Required) An array of four numbers, [x1y1x2y2], 
   * specifying the starting and ending coordinates of the line in default user space. 
   * If the LL entry is present, this value shall represent the endpoints 
   * of the leader lines rather than the endpoints of the line itself
   */
  L: Rect;
  /**
   * (Optional; PDF 1.4+) An array of two names specifying the line ending styles 
   * that shall be used in drawing the line. The first and second elements 
   * of the array shall specify the line ending styles for the endpoints defined, 
   * respectively, by the first and second pairs of coordinates, 
   * (x1, y1)and (x2, y2), in the L array
   */
  LE: LineEndingType[] = [lineEndingTypes.NONE, lineEndingTypes.NONE];
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
   * (Optional; PDF 1.6+) A non-negative number that shall represents the length 
   * of leader line extensions that extend from the line proper 180 degrees from the leader lines
   */
  LLE = 0;
  /** 
   * (Optional; PDF 1.6+) If true, the text specified by the Contents or RC entries 
   * shall be replicated as a caption in the appearance of the line
   */
  Cap = false;
  /**
   * (Optional; PDF 1.6+) A name describing the intent of the line annotation
   */
  IT: LineIntent;
  /** 
   * (Optional; PDF 1.7+) A non-negative number that shall represent the length 
   * of the leader line offset, which is the amount of empty space 
   * between the endpoints of the annotation and the beginning of the leader lines
   */
  LLO = 0;
  /** 
   * (Optional; meaningful only if Cap is true; PDF 1.7+) 
   * A name describing the annotation’s caption positioning. Valid values are 
   * Inline, meaning the caption shall be centered inside the line, 
   * and Top, meaning the caption shall be on top of the line
   */
  CP: CaptionPosition = captionPositions.INLINE;
  /** 
   * (Optional; PDF 1.7+) A measure dictionary that shall specify the scale and units 
   * that apply to the line annotation
   */
  Measure: MeasureDict;
  /** 
   * (Optional; meaningful only if Cap is true; PDF 1.7+) 
   * An array of two numbers that shall specify the offset of the caption text 
   * from its normal position. The first value shall be the horizontal offset 
   * along the annotation line from its midpoint, with a positive value 
   * indicating offset to the right and a negative value indicating offset to the left.
   * The second value shall be the vertical offset perpendicular to the annotation line, 
   * with a positive value indicating a shift up and a negative value indicating a shift down
   */
  CO: Pair = [0, 0];
  
  constructor() {
    super(annotationTypes.LINE);
  }

  static parse(parseInfo: ParseInfo): ParseResult<LineAnnotation> {    
    const text = new LineAnnotation();
    const parseResult = text.tryParseProps(parseInfo);

    return parseResult
      ? {value: text, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }  
  
  toArray(cryptor?: DataCryptor): Uint8Array {
    const superBytes = super.toArray();  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.L) {
      bytes.push(
        ...encoder.encode("/L"), codes.L_BRACKET, 
        ...encoder.encode(this.L[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.L[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.L[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.L[3] + ""), codes.R_BRACKET,
      );
    }
    if (this.LE) {
      bytes.push(...encoder.encode("/LE"), codes.L_BRACKET);
      this.LE.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(x)));
      bytes.push(codes.R_BRACKET);
    }
    if (this.LL) {
      bytes.push(...encoder.encode("/LL"), ...encoder.encode(" " + this.LL));
    }
    if (this.LLE) {
      bytes.push(...encoder.encode("/LLE"), ...encoder.encode(" " + this.LLE));
    }
    if (this.Cap) {
      bytes.push(...encoder.encode("/Cap"), ...encoder.encode(" " + this.Cap));
    }
    if (this.IT) {
      bytes.push(...encoder.encode("/IT"), ...encoder.encode(this.IT));
    }
    if (this.LLO) {
      bytes.push(...encoder.encode("/LLO"), ...encoder.encode(" " + this.LLO));
    }
    if (this.CP) {
      bytes.push(...encoder.encode("/CP"), ...encoder.encode(this.CP));
    }
    if (this.Measure) {
      bytes.push(...encoder.encode("/Measure"), ...this.Measure.toArray());
    }
    if (this.CO) {
      bytes.push(
        ...encoder.encode("/CO"), codes.L_BRACKET, 
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
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected tryParseProps(parseInfo: ParseInfo): boolean {
    const superIsParsed = super.tryParseProps(parseInfo);
    if (!superIsParsed) {
      return false;
    }

    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    let i = parser.skipToNextName(start, end - 1);
    if (i === -1) {
      // no required props found
      return false;
    }
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/L":
            const lineCoords = parser.parseNumberArrayAt(i, true);
            if (lineCoords) {
              this.L = [
                lineCoords.value[0],
                lineCoords.value[1],
                lineCoords.value[2],
                lineCoords.value[3],
              ];
              i = lineCoords.end + 1;
            } else {              
              throw new Error("Can't parse /L property value");
            }
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
          case "/LL":
            const leaderLineLength = parser.parseNumberAt(i, false);
            if (leaderLineLength) {
              this.LL = leaderLineLength.value;
              i = leaderLineLength.end + 1;
            } else {              
              throw new Error("Can't parse /LL property value");
            }
            break;           
          case "/LLE":
            const leaderLineExtLength = parser.parseNumberAt(i, false);
            if (leaderLineExtLength) {
              this.LLE = leaderLineExtLength.value;
              i = leaderLineExtLength.end + 1;
            } else {              
              throw new Error("Can't parse /LLE property value");
            }
            break;      
          case "/Cap":
            const cap = parser.parseBoolAt(i, false);
            if (cap) {
              this.Cap = cap.value;
              i = cap.end + 1;
            } else {              
              throw new Error("Can't parse /Cap property value");
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
          case "/LLO":
            const leaderLineOffset = parser.parseNumberAt(i, false);
            if (leaderLineOffset) {
              this.LLO = leaderLineOffset.value;
              i = leaderLineOffset.end + 1;
            } else {              
              throw new Error("Can't parse /LLO property value");
            }
            break;   
          case "/CP":
            const captionPosition = parser.parseNameAt(i, true);
            if (captionPosition && (<string[]>Object.values(captionPositions))
              .includes(captionPosition.value[0])) {
              this.CP = <CaptionPosition>captionPosition.value;
              i = captionPosition.end + 1;
            } else {              
              throw new Error("Can't parse /CP property value");
            }
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
          case "/CO":
            const captionOffset = parser.parseNumberArrayAt(i, true);
            if (captionOffset) {
              this.CO = [
                captionOffset.value[0],
                captionOffset.value[1],
              ];
              i = captionOffset.end + 1;
            } else {              
              throw new Error("Can't parse /CO property value");
            }
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

    return true;
  }
}
