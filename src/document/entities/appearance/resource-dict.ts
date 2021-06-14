import { codes, keywordCodes } from "../../char-codes";
import { CryptInfo } from "../../common-interfaces";
import { valueTypes } from "../../spec-constants";
import { ParseInfo, ParseResult } from "../../data-parser";

import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { PdfStream } from "../core/pdf-stream";
import { ObjectMapDict } from "../misc/object-map-dict";

import { FontDict } from "./font-dict";
import { GraphicsStateDict } from "./graphics-state-dict";

interface ResourceStreamParsers {
  xform: (info: ParseInfo) => ParseResult<PdfStream>;
  image: (info: ParseInfo) => ParseResult<PdfStream>;
}

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
  
  protected readonly _streamParsers: ResourceStreamParsers;

  protected _gsMap = new Map<string, GraphicsStateDict>();
  protected _fontsMap = new Map<string, FontDict>();
  protected _xObjectsMap = new Map<string, PdfStream>();
  
  constructor(streamParsers?: ResourceStreamParsers) {
    super(null);
    this._streamParsers = streamParsers;
  }
  
  static parse(parseInfo: ParseInfo, streamParsers?: ResourceStreamParsers): ParseResult<ResourceDict> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    } 
    try {
      const pdfObject = new ResourceDict(streamParsers);
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

    if (this._gsMap.size) {  
      bytes.push(...encoder.encode("/ExtGState "));    
      bytes.push(...keywordCodes.DICT_START);
      for (const [name, gsDict] of this._gsMap) {
        bytes.push(...encoder.encode(name.slice(10)), codes.WHITESPACE); // remove '/ExtGState' prefix
        if (gsDict.ref) {          
          bytes.push(...ObjectId.fromRef(gsDict.ref).toArray(cryptInfo));
        } else {
          bytes.push(...gsDict.toArray(cryptInfo));
        }
      }
      bytes.push(...keywordCodes.DICT_END);
    }

    if (this._fontsMap.size) {      
      // TODO: test if it can be not an indirect reference
      bytes.push(...encoder.encode("/Font "));    
      bytes.push(...keywordCodes.DICT_START);
      for (const [name, fontDict] of this._fontsMap) {
        bytes.push(...encoder.encode(name.slice(5)), codes.WHITESPACE); // remove '/Font' prefix
        if (fontDict.ref) {          
          bytes.push(...ObjectId.fromRef(fontDict.ref).toArray(cryptInfo));
        } else {
          bytes.push(...fontDict.toArray(cryptInfo));
        }
      }
      bytes.push(...keywordCodes.DICT_END);
    }

    if (this._xObjectsMap.size) {
      bytes.push(...encoder.encode("/XObject "), ...keywordCodes.DICT_START);
      for (const [name, xObject] of this._xObjectsMap) {
        const ref = xObject.ref;
        if (!ref) {
          throw new Error("XObject has no reference");
        }
        bytes.push(...encoder.encode(name.slice(8)), codes.WHITESPACE); // remove '/XObject' prefix
        bytes.push(...ObjectId.fromRef(ref).toArray(cryptInfo));
      }
      bytes.push(...keywordCodes.DICT_END);
    }

    if (this.ColorSpace) {
      bytes.push(...encoder.encode("/ColorSpace "), ...this.ColorSpace.toArray(cryptInfo));
    }
    if (this.Pattern) {
      bytes.push(...encoder.encode("/Pattern "), ...this.Pattern.toArray(cryptInfo));
    }
    if (this.Shading) {
      bytes.push(...encoder.encode("/Shading "), ...this.Shading.toArray(cryptInfo));
    }
    if (this.Properties) {
      bytes.push(...encoder.encode("/Properties "), ...this.Properties.toArray(cryptInfo));
    }
    if (this.ProcSet) {
      bytes.push(...encoder.encode("/ProcSet "), codes.L_BRACKET);
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
    this._edited = true;
  }
  
  getFont(name: string): FontDict {
    return this._fontsMap.get("/Font" + name);
  }
  *getFonts(): Iterable<[string, FontDict]> {
    for (const pair of this._fontsMap) {
      yield pair;
    }
    return;
  }  
  setFont(name: string, font: FontDict) {
    this._fontsMap.set(`/Font${name}`, font);
    this._edited = true;
  }
  
  getXObject(name: string): PdfStream {
    return this._xObjectsMap.get(name);
  }
  *getXObjects(): Iterable<[string, PdfStream]> {
    for (const pair of this._xObjectsMap) {
      yield pair;
    }
    return;
  }  
  setXObject(name: string, xObject: PdfStream) {
    this._xObjectsMap.set(`/XObject${name}`, xObject);
    this._edited = true;
  }
  
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

    if (this.XObject && this._streamParsers) {
      for (const [name, objectId] of this.XObject.getObjectIds()) {
        const streamParseInfo = parseInfoGetter(objectId.id);
        if (!streamParseInfo) {
          continue;
        }
        const stream = streamParseInfo.parser
          .findSubarrayIndex(keywordCodes.FORM, {
            direction: true,
            minIndex: streamParseInfo.bounds.start,
            maxIndex: streamParseInfo.bounds.end,
          })
          ? this._streamParsers.xform(streamParseInfo)
          : this._streamParsers.image(streamParseInfo);
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
          case "/ExtGState": 
          case "/ColorSpace": 
          case "/Pattern": 
          case "/Shading": 
          case "/XObject": 
          case "/Font": 
          case "/Properties":
            const mapEntryType = parser.getValueTypeAt(i);
            if (mapEntryType === valueTypes.REF) {              
              const mapDictId = ObjectId.parseRef(parser, i);
              if (mapDictId && parseInfo.parseInfoGetter) {
                const mapParseInfo = parseInfo.parseInfoGetter(mapDictId.value.id);
                if (mapParseInfo) {
                  const mapDict = ObjectMapDict.parse(mapParseInfo);
                  if (mapDict) {
                    this[name.slice(1)] = mapDict.value;
                    i = mapDict.end + 1;
                    break;
                  }
                }
              }
              throw new Error(`Can't parse ${name} value reference`);
            } else if (mapEntryType === valueTypes.DICTIONARY) { 
              const mapBounds = parser.getDictBoundsAt(i);
              if (mapBounds) {
                const map = ObjectMapDict.parse({parser, bounds: mapBounds});              
                if (map) {
                  this[name.slice(1)] = map.value;
                  i = mapBounds.end + 1;
                  break;
                } else {
                  throw new Error(`Can't parse ${name} value dictionary`);  
                }
              }
              throw new Error(`Can't parse ${name} dictionary bounds`); 
            }
            throw new Error(`Unsupported /Resources property value type: ${mapEntryType}`);    

          case "/ProcSet":                     
            i = this.parseNameArrayProp(name, parser, i);
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

    if (parseInfo.parseInfoGetter) {
      this.fillMaps(parseInfo.parseInfoGetter, parseInfo.cryptInfo);
    }
  }
  
  protected override initProxy(): ResourceDict {
    return <ResourceDict>super.initProxy();
  }

  protected override getProxy(): ResourceDict {
    return <ResourceDict>super.getProxy();
  }
}
