import { BlendMode, blendModes, dictTypes, LineCapStyle, lineCapStyles, 
  LineJoinStyle, lineJoinStyles, RenderingIntent, renderingIntents, valueTypes } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { codes } from "../../codes";
import { SoftMaskDict } from "./soft-mask.dict";
import { GraphicsStateParams } from "../../render/graphics-state";

export class GraphicsStateDict extends PdfDict {
  /** 
   * (Optional; PDF 1.3+) Line width
   * */
  LW: number;
  /** 
   * (Optional; PDF 1.3+) Line cap style
   * */
  LC: LineCapStyle;
  /** 
   * (Optional; PDF 1.3+) Line join style
   * */
  LJ: LineJoinStyle;
  /** 
   * (Optional; PDF 1.3+) Miter limit
   * */
  ML: number;
  /** 
   * (Optional; PDF 1.3+) The line dash pattern, expressed 
   * as an array of the form [dashArray dashPhase],
   * where dashArray shall be itself an array and dashPhase shall be an integer
   * */
  D: [dashArray: [dash: number, gap: number], dashPhase: number];
  /** 
   * (Optional; PDF 1.3+) Rendering intent
   * */
  RI: RenderingIntent;
  /** 
   * (Optional) A flag specifying whether to apply overprint. 
   * In PDF 1.2 and earlier, there is a single overprint parameter 
   * that applies to all painting operations. Beginning with PDF 1.3, 
   * there shall be two separate overprint parameters: one for stroking 
   * and one for all other painting operations. Specifying an OP entry 
   * shall set both parameters unless there is also an op entry 
   * in the same graphics state parameter dictionary, in which case 
   * the OP entry shall set only the overprint parameter for stroking
   * */
  OP: boolean;
  /** 
   * (Optional; PDF 1.3+) A flag specifying whether to apply overprint 
   * for painting operations other than stroking. If this entry is absent, 
   * the OP entry, if any, shall also set this parameter
   * */
  op: boolean;
  /** 
   * (Optional; PDF 1.3+) Overprint mode
   * */
  OPM: 0 | 1;
  /** 
   * (Optional; PDF 1.3+) An array of the form [font size], 
   * where font shall be an indirect reference to a font dictionary 
   * and size shall be a number expressed in text space units. 
   * These two objects correspond to the operands of the Tf operator; 
   * however, the first operand shall be an indirect object reference 
   * instead of a resource name
   * */
  Font: [font: ObjectId, size: number];
  /** 
   * (Optional; PDF 1.3+) Flatness tolerance
   * */
  FL: number;
  /** 
   * (Optional; PDF 1.3+) Smoothness tolerance
   * */
  SM: number;
  /** 
   * (Optional) A flag specifying whether to apply automatic stroke adjustment
   * */
  SA: boolean;
  /** 
   * (Optional; PDF 1.4+) The current blend mode 
   * to be used in the transparent imaging model
   * */
  BM: BlendMode;
  /** 
   * (Optional; PDF1.4+) The current soft mask, specifying the mask shape 
   * or mask opacity values to be used in the transparent imaging model
   * */
  SMask: string | SoftMaskDict;
  /** 
   * (Optional; PDF 1.4+) The current stroking alpha constant, 
   * specifying the constant shape or constant opacity value 
   * that shall be used for stroking operations in the transparent imaging model
   * */
  CA: number;
  /** 
   * (Optional; PDF 1.4+) Same as CA, but for nonstroking operations
   * */
  ca: number;
  /** 
   * (Optional; PDF 1.4+) The alpha source flag (“alpha is shape”), 
   * specifying whether the current soft mask and alpha constant 
   * shall be interpreted as shape values (true) or opacity values (false)
   * */
  AIS: boolean;
  /** 
   * (Optional; PDF 1.4+) The text knockout flag, shall determine 
   * the behavior of overlapping glyphs within a text object in the transparent imaging model
   * */
  TK: boolean;

  // TODO: add remaining properties
  // BG BG2 UCR UCR2 TR TR2 HT

  constructor() {
    super(dictTypes.GRAPHICS_STATE);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<GraphicsStateDict> {    
    const graphicsState = new GraphicsStateDict();
    const parseResult = graphicsState.parseProps(parseInfo);

    return parseResult
      ? {value: graphicsState, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  
    
    if (this.LW) {
      bytes.push(...encoder.encode("/LW "), ...encoder.encode(" " + this.LW));
    }
    if (this.LC) {
      bytes.push(...encoder.encode("/LC "), ...encoder.encode(" " + this.LC));
    }
    if (this.LJ) {
      bytes.push(...encoder.encode("/LJ "), ...encoder.encode(" " + this.LJ));
    }
    if (this.ML) {
      bytes.push(...encoder.encode("/ML "), ...encoder.encode(" " + this.ML));
    }
    if (this.D) {
      bytes.push(
        ...encoder.encode("/D "), 
        codes.L_BRACKET,
        codes.L_BRACKET,
        ...encoder.encode("" + this.D[0][0]),
        ...encoder.encode(" " + this.D[0][1]),
        codes.R_BRACKET,
        ...encoder.encode(" " + this.D[1]),
        codes.R_BRACKET,
      );
    }      
    if (this.RI) {
      bytes.push(...encoder.encode("/RI "), ...encoder.encode(this.RI));
    }
    if (this.OP) {
      bytes.push(...encoder.encode("/OP "), ...encoder.encode(" " + this.OP));
    }
    if (this.op) {
      bytes.push(...encoder.encode("/op "), ...encoder.encode(" " + this.op));
    }
    if (this.OPM) {
      bytes.push(...encoder.encode("/OPM "), ...encoder.encode(" " + this.OPM));
    }
    if (this.Font) {
      bytes.push(
        ...encoder.encode("/Font "), 
        codes.L_BRACKET,
        ...this.Font[0].toArray(cryptInfo),
        ...encoder.encode(" " + this.Font[1]),
        codes.R_BRACKET,
      );
    }       
    if (this.FL) {
      bytes.push(...encoder.encode("/FL "), ...encoder.encode(" " + this.FL));
    }
    if (this.SM) {
      bytes.push(...encoder.encode("/SM "), ...encoder.encode(" " + this.SM));
    }
    if (this.SA) {
      bytes.push(...encoder.encode("/SA "), ...encoder.encode(" " + this.SA));
    }
    if (this.BM) {
      bytes.push(...encoder.encode("/BM "), ...encoder.encode(this.BM));
    }
    if (this.SMask) {
      if (this.SMask instanceof SoftMaskDict) {        
        bytes.push(...encoder.encode("/SMask "), ...this.SMask.toArray(cryptInfo));
      } else {
        bytes.push(...encoder.encode("/SMask "), ...encoder.encode(this.SMask));
      }
    }
    if (this.CA) {
      bytes.push(...encoder.encode("/CA "), ...encoder.encode(" " + this.CA));
    }
    if (this.ca) {
      bytes.push(...encoder.encode("/ca "), ...encoder.encode(" " + this.ca));
    }
    if (this.AIS) {
      bytes.push(...encoder.encode("/AIS "), ...encoder.encode(" " + this.AIS));
    }
    if (this.TK) {
      bytes.push(...encoder.encode("/AIS "), ...encoder.encode(" " + this.TK));
    }
    
    //TODO: handle remaining properties

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }

  toParams(): GraphicsStateParams {
    const params: GraphicsStateParams = {};
    if (!isNaN(this.LW)) {
      params.strokeWidth = this.LW;
    }
    if (!isNaN(this.LC)) {
      switch (this.LC) {
        case lineCapStyles.BUTT:
          params.strokeLineCap = "butt";
          break;
        case lineCapStyles.ROUND:
          params.strokeLineCap = "round";
          break;
        case lineCapStyles.SQUARE:
          params.strokeLineCap = "square";
          break;
      }
    }
    if (!isNaN(this.LJ)) {
      switch (this.LJ) {
        case lineJoinStyles.BEVEL:
          params.strokeLineJoin = "bevel";
          break;
        case lineJoinStyles.ROUND:
          params.strokeLineJoin = "round";
          break;
        case lineJoinStyles.MITER:
          params.strokeLineJoin = "miter";
          break;
      }
    }
    if (this.ML) {
      params.strokeMiterLimit = this.ML;
    }
    if (this.D) {
      params.strokeDashArray = `${this.D[0][0]} ${this.D[0][1]}`;
      params.strokeDashOffset = this.D[1];
    }
    if (this.Font) {
      // TODO: implement
    }
    if (this.BM) {
      params.strokeMiterLimit = this.ML;
    }
    if (this.SMask) {
      // TODO: implement
    }
    if (this.CA) {
      params.strokeAlpha = this.CA;
    }
    if (this.ca) {
      params.fillAlpha = this.ca;
    }
    if (this.AIS) {
      // TODO: implement
    }

    return params;
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected parseProps(parseInfo: ParseInfo): boolean {
    const superIsParsed = super.parseProps(parseInfo);
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
          case "/LC":
            const lineCap = parser.parseNumberAt(i, true);
            if (lineCap && (<number[]>Object.values(lineCapStyles))
              .includes(lineCap.value)) {
              this.LC = <LineCapStyle>lineCap.value;
              i = lineCap.end + 1;              
            } else {              
              throw new Error("Can't parse /LC property value");
            }
            break;  
          case "/OPM":
            const overprintMode = parser.parseNumberAt(i, true);
            if (overprintMode && ([0, 1].includes(overprintMode.value))) {
              this.OPM = <0 | 1>overprintMode.value;
              i = overprintMode.end + 1;              
            } else {              
              throw new Error("Can't parse /OPM property value");
            }
            break; 
          case "/LJ":
            const lineJoin = parser.parseNumberAt(i, true);
            if (lineJoin && (<number[]>Object.values(lineJoinStyles))
              .includes(lineJoin.value)) {
              this.LJ = <LineJoinStyle>lineJoin.value;
              i = lineJoin.end + 1;              
            } else {              
              throw new Error("Can't parse /LJ property value");
            }
            break;
          case "/RI":
            const intent = parser.parseNameAt(i, true);
            if (intent && (<string[]>Object.values(renderingIntents))
              .includes(intent.value)) {
              this.RI = <RenderingIntent>intent.value;
              i = intent.end + 1;              
            } else {              
              throw new Error("Can't parse /RI property value");
            }
            break;           
          case "/BM":
            const blendMode = parser.parseNameAt(i, true);
            if (blendMode && (<string[]>Object.values(blendModes))
              .includes(blendMode.value)) {
              this.BM = <BlendMode>blendMode.value;
              i = blendMode.end + 1;              
            } else {              
              throw new Error("Can't parse /BM property value");
            }
            break;             
          case "/SMask":
            const sMaskEntryType = parser.getValueTypeAt(i);
            if (sMaskEntryType === valueTypes.NAME) {  
              const sMaskName = parser.parseNameAt(i);  
              if (sMaskName) {
                this.SMask = sMaskName.value;
                i = sMaskName.end + 1;
                break;
              }
              throw new Error("Can't parse /SMask property name");
            } else if (sMaskEntryType === valueTypes.DICTIONARY) { 
              const sMaskDictBounds = parser.getDictBoundsAt(i); 
              if (sMaskDictBounds) {
                const sMaskDict = SoftMaskDict.parse({parser, bounds: sMaskDictBounds});
                if (sMaskDict) {
                  this.SMask = sMaskDict.value;
                  i = sMaskDict.end + 1;
                  break;
                }
              }  
              throw new Error("Can't parse /SMask value dictionary");  
            }
            throw new Error(`Unsupported /SMask property value type: ${sMaskEntryType}`);
          case "/Font":
            const fontEntryType = parser.getValueTypeAt(i);
            if (fontEntryType === valueTypes.ARRAY) {
              const fontArrayBounds = parser.getArrayBoundsAt(i);
              if (fontArrayBounds) {
                const fontRef = ObjectId.parse(parser, fontArrayBounds.start + 1);
                if (fontRef) {
                  const fontSize = parser.parseNumberAt(fontRef.end + 1);
                  if (fontSize) {
                    this.Font = [fontRef.value, fontSize.value];
                    i = fontArrayBounds.end + 1;
                    break;
                  }
                }
              }
            } else {
              throw new Error(`Unsupported /Font property value type: ${fontEntryType}`);
            }
            throw new Error("Can't parse /Font property value");
          case "/D":
            const dashEntryType = parser.getValueTypeAt(i);
            if (dashEntryType === valueTypes.ARRAY) {
              const dashArrayBounds = parser.getArrayBoundsAt(i);
              if (dashArrayBounds) {
                const dashArray = parser.parseNumberArrayAt(dashArrayBounds.start + 1);
                if (dashArray) {
                  const dashPhase = parser.parseNumberAt(dashArray.end + 1);
                  if (dashPhase) {
                    this.D = [[dashArray.value[0], dashArray.value[1]], dashPhase.value];
                    i = dashArrayBounds.end + 1;
                    break;
                  }
                }
              }
            } else {
              throw new Error(`Unsupported /D property value type: ${dashEntryType}`);
            }
            throw new Error("Can't parse /D property value");
          
          // bool values
          case "/OP":
          case "/op":
          case "/SA":
          case "/AIS":
          case "/TK":
            i = this.parseBoolProp(name, parser, i);
            break;
          
          // number values
          case "/LW":
          case "/ML":
          case "/FL":
          case "/SM":
          case "/CA":
          case "/ca":
            i = this.parseNumberProp(name, parser, i);
            break;

          // TODO: add cases for remaining properties
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
