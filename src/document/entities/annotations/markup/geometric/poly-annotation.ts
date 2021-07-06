import { AnnotationType, valueTypes, polyIntents, PolyIntent } from "../../../../spec-constants";
import { CryptInfo } from "../../../../encryption/interfaces";
import { ParserResult } from "../../../../data-parse/data-parser";
import { ParserInfo } from "../../../../data-parse/parser-info";
import { ObjectId } from "../../../core/object-id";
import { MeasureDict } from "../../../appearance/measure-dict";
import { GeometricAnnotation, GeometricAnnotationDto } from "./geometric-annotation";

export interface PolyAnnotationDto extends GeometricAnnotationDto {
  vertices: number[];
}

export abstract class PolyAnnotation extends GeometricAnnotation {
  /**
   * (Required) An array of numbers representing the alternating horizontal and vertical coordinates, 
   * respectively, of each vertex, in default user space
   */
  Vertices: number[];
  /**
   * (Optional; PDF 1.6+) A name describing the intent of the poly annotation
   */
  IT: PolyIntent;
  /** 
   * (Optional; PDF 1.7+) A measure dictionary that shall specify the scale and units 
   * that apply to the line annotation
   */
  Measure: MeasureDict;
  
  protected constructor(type: AnnotationType) {
    super(type);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Vertices) {
      bytes.push(...encoder.encode("/Vertices "), ...this.encodePrimitiveArray(this.Vertices, encoder));
    }
    if (this.IT) {
      bytes.push(...encoder.encode("/IT "), ...encoder.encode(this.IT));
    }
    if (this.Measure) {
      bytes.push(...encoder.encode("/Measure "), ...this.Measure.toArray(cryptInfo));
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
  protected override async parsePropsAsync(parseInfo: ParserInfo) {
    await super.parsePropsAsync(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    let i = await parser.skipToNextNameAsync(start, end - 1);
    let name: string;
    let parseResult: ParserResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/Vertices":
            i = await this.parseNumberArrayPropAsync(name, parser, i, true);
            break;

          case "/IT":
            const intent = parser.parseNameAt(i, true);
            if (intent) {
              if ((<string[]>Object.values(polyIntents)).includes(intent.value)) {
                this.IT = <PolyIntent>intent.value;
                i = intent.end + 1;    
                break;          
              }
            }
            throw new Error("Can't parse /IT property value");

          case "/Measure":            
            const measureEntryType = parser.getValueTypeAt(i);
            if (measureEntryType === valueTypes.REF) {              
              const measureDictId = await ObjectId.parseRefAsync(parser, i);
              if (measureDictId && parseInfo.parseInfoGetterAsync) {
                const measureParseInfo = await parseInfo.parseInfoGetterAsync(measureDictId.value.id);
                if (measureParseInfo) {
                  const measureDict = await MeasureDict.parseAsync(measureParseInfo);
                  if (measureDict) {
                    this.Measure = measureDict.value;
                    i = measureDict.end + 1;
                    break;
                  }
                }
              }              
              throw new Error("Can't parse /Measure value reference");
            } else if (measureEntryType === valueTypes.DICTIONARY) { 
              const measureDictBounds = parser.getDictBoundsAt(i); 
              if (measureDictBounds) {
                const measureDict = await MeasureDict.parseAsync({parser, bounds: measureDictBounds});
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
            i = await parser.skipToNextNameAsync(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
        
    if (!this.Vertices) {
      throw new Error("Not all required properties parsed");
    }
  }
}
