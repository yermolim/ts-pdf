import { codes, keywordCodes } from "../../codes";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { ObjectMapDict } from "../misc/object-map-dict";
import { ImageStream } from "../streams/image-stream";
import { XFormStream } from "../streams/x-form-stream";
import { FontDict } from "./font-dict";
import { GraphicsStateDict } from "./graphics-state-dict";

export class ResourceDict extends PdfDict {
  /** 
   * (Optional) A dictionary that maps resource names 
   * to graphics state parameter dictionaries 
   * */
  ExtGState: ObjectMapDict;
  /** 
   * (Optional) A dictionary that maps each resource name 
   * to either the name of a device-dependent colour space 
   * or an array describing a colour space
   * */
  ColorSpace: ObjectMapDict;
  /** 
   * (Optional) A dictionary that maps resource names to pattern objects
   * */
  Pattern: ObjectMapDict;
  /** 
   * (Optional; PDF 1.3+) A dictionary that maps resource names to shading dictionaries
   * */
  Shading: ObjectMapDict;
  /** 
   * (Optional) A dictionary that maps resource names to external objects
   * */
  XObject: ObjectMapDict;
  /** 
   * (Optional) A dictionary that maps resource names to font dictionaries
   * */
  Font: ObjectMapDict;
  /** 
   * (Optional; PDF 1.2+) A dictionary that maps resource names 
   * to property list dictionaries for marked content
   * */
  Properties: ObjectMapDict;
  /** 
   * (Optional) An array of predefined procedure set names
   * */
  ProcSet: string[];
  
  protected _gsMap = new Map<string, GraphicsStateDict>();
  protected _fontsMap = new Map<string, FontDict>();
  protected _xObjectsMap = new Map<string, XFormStream | ImageStream>();
  
  constructor() {
    super(null);
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<ResourceDict> {    
    const resourceDict = new ResourceDict();
    const parseResult = resourceDict.tryParseProps(parseInfo);

    return parseResult
      ? {value: resourceDict, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this._gsMap.size) {  
      bytes.push(...encoder.encode("/ExtGState"));    
      bytes.push(...keywordCodes.DICT_START);
      for (const [name, gsDict] of this._gsMap) {
        bytes.push(...encoder.encode(name.slice(10))); // remove '/ExtGState' prefix
        bytes.push(...gsDict.toArray(cryptInfo));
      }
      bytes.push(...keywordCodes.DICT_END);
    }
    if (this._xObjectsMap.size) {
      bytes.push(...encoder.encode("/XObject"));
      bytes.push(...keywordCodes.DICT_START);      
      for (const [name, xObject] of this._xObjectsMap) {
        const ref = xObject.ref;
        if (!ref) {
          throw new Error("XObject has no reference");
        }
        bytes.push(...encoder.encode(name.slice(8))); // remove '/XObject' prefix
        bytes.push(...new ObjectId(ref.id, ref.generation) .toArray(cryptInfo));
      }
      bytes.push(...keywordCodes.DICT_END);
    }

    // if (this.ExtGState) {
    //   bytes.push(...encoder.encode("/ExtGState"), ...this.ExtGState.toArray(cryptInfo));
    // }
    // if (this.XObject) {
    //   bytes.push(...encoder.encode("/XObject"), ...this.XObject.toArray(cryptInfo));
    // }

    if (this.ColorSpace) {
      bytes.push(...encoder.encode("/ColorSpace"), ...this.ColorSpace.toArray(cryptInfo));
    }
    if (this.Pattern) {
      bytes.push(...encoder.encode("/Pattern"), ...this.Pattern.toArray(cryptInfo));
    }
    if (this.Shading) {
      bytes.push(...encoder.encode("/Shading"), ...this.Shading.toArray(cryptInfo));
    }
    if (this.Font) {
      bytes.push(...encoder.encode("/Font"), ...this.Font.toArray(cryptInfo));
    }
    if (this.Properties) {
      bytes.push(...encoder.encode("/Properties"), ...this.Properties.toArray(cryptInfo));
    }
    if (this.ProcSet) {
      bytes.push(...encoder.encode("/ProcSet"), codes.L_BRACKET);
      this.ProcSet.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(x))); 
      bytes.push(codes.R_BRACKET);
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }

  getGraphicsState(name: string): GraphicsStateDict {
    return this._gsMap.get(name);
  }

  *getGraphicsStates(): Iterable<[string, GraphicsStateDict]> {
    for (const pair of this._gsMap) {
      yield pair;
    }
    return;
  }

  setGraphicsState(name: string, state: GraphicsStateDict) {
    this._gsMap.set(`/ExtGState${name}`, state);
  }
  
  getFont(name: string): FontDict {
    return this._fontsMap.get(name);
  }

  *getFonts(): Iterable<[string, FontDict]> {
    for (const pair of this._fontsMap) {
      yield pair;
    }
    return;
  }
  
  getXObject(name: string): XFormStream | ImageStream {
    return this._xObjectsMap.get(name);
  }

  *getXObjects(): Iterable<[string, XFormStream | ImageStream]> {
    for (const pair of this._xObjectsMap) {
      yield pair;
    }
    return;
  }
  
  setXObject(name: string, xObject: XFormStream | ImageStream) {
    this._xObjectsMap.set(`/XObject${name}`, xObject);
  }
  
  // getFormXObject(name: string): XFormStream {
  //   const xObj = this._xObjectsMap.get(name);
  //   if (xObj instanceof XFormStream) {
  //     return xObj;
  //   } else {
  //     return null;
  //   }
  // }

  // *getFormXObjects(): Iterable<[string, XFormStream]> {
  //   for (const pair of this._xObjectsMap) {
  //     if (pair[1] instanceof XFormStream) {
  //       yield <[string, XFormStream]>pair;
  //     }
  //   }
  //   return;
  // }
  
  // getImageXObject(name: string): ImageStream {
  //   const xObj = this._xObjectsMap.get(name);
  //   if (xObj instanceof ImageStream) {
  //     return xObj;
  //   } else {
  //     return null;
  //   }
  // }

  // *getImageXObjects(): Iterable<[string, ImageStream]> {
  //   for (const pair of this._xObjectsMap) {
  //     if (pair[1] instanceof ImageStream) {
  //       yield <[string, ImageStream]>pair;
  //     }
  //   }
  //   return;
  // }
  
  protected fillMaps(parseInfoGetter: (id: number) => ParseInfo, cryptInfo?: CryptInfo) {
    this._gsMap.clear();
    this._fontsMap.clear();
    this._xObjectsMap.clear();

    if (this.ExtGState) {
      for (const [name, objectId] of this.ExtGState.getObjectIds()) {
        const streamParseInfo = parseInfoGetter(objectId.id);
        if (!streamParseInfo) {
          continue;
        }
        const stream = GraphicsStateDict.parse(streamParseInfo);
        if (stream) {
          this._gsMap.set(`/ExtGState${name}`, stream.value);
        }
      }
      for (const [name, parseInfo] of this.ExtGState.getDictParsers()) {        
        const dict = GraphicsStateDict.parse(parseInfo);
        if (dict) {
          this._gsMap.set(`/ExtGState${name}`, dict.value);
        }
      }
    }

    if (this.XObject) {
      for (const [name, objectId] of this.XObject.getObjectIds()) {
        const streamParseInfo = parseInfoGetter(objectId.id);
        if (!streamParseInfo) {
          continue;
        }
        const stream = XFormStream.parse(streamParseInfo) 
          ?? ImageStream.parse(streamParseInfo);
        if (stream) {
          this._xObjectsMap.set(`/XObject${name}`, stream.value);
        }
      }
    }
    
    if (this.Font) {
      for (const [name, objectId] of this.Font.getObjectIds()) {
        const dictParseInfo = parseInfoGetter(objectId.id);
        if (!dictParseInfo) {
          continue;
        }
        const dict = FontDict.parse(dictParseInfo);
        if (dict) {
          this._fontsMap.set(`/Font${name}`, dict.value);
        }
      }
    }
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
          case "/ExtGState": 
          case "/ColorSpace": 
          case "/Pattern": 
          case "/Shading": 
          case "/XObject": 
          case "/Font": 
          case "/Properties":
            const mapBounds = parser.getDictBoundsAt(i);
            if (mapBounds) {
              const map = ObjectMapDict.parse({parser, bounds: mapBounds});              
              if (map) {
                this[name.substring(1)] = map.value;
                i = mapBounds.end + 1;
                break;
              }
            }            
            throw new Error(`Can't parse ${name} property value`);
          case "/ProcSet":                     
            const procedureNames = parser.parseNameArrayAt(i);
            if (procedureNames) {
              this.ProcSet = procedureNames.value;
              i = procedureNames.end + 1;
              break;
            } 
            throw new Error("Can't parse /ProcSet property value");
          default:
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };

    if (parseInfo.parseInfoGetter) {
      this.fillMaps(parseInfo.parseInfoGetter, parseInfo.cryptInfo);
    }

    return true;
  }
}
