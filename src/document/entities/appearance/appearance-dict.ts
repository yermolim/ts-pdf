import { valueTypes } from "../../spec-constants";
import { CryptInfo } from "../../encryption/interfaces";
import { ParserResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";
import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { ObjectMapDict } from "../misc/object-map-dict";
import { XFormStream } from "../streams/x-form-stream";

export class AppearanceDict extends PdfDict {
  /**
   * (Required) The annotation’s normal appearance 
   */
  N: ObjectMapDict | ObjectId;
  /**
   * (Optional) The annotation’s rollover appearance
   */
  R: ObjectMapDict | ObjectId; 
  /**
   * (Optional) The annotation’s down appearance
   */
  D: ObjectMapDict | ObjectId; 

  protected _streamsMap = new Map<string, XFormStream>();
  
  constructor() {
    super(null);
  } 
  
  static async parseAsync(parseInfo: ParserInfo): Promise<ParserResult<AppearanceDict>> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new AppearanceDict();
      await pdfObject.parsePropsAsync(parseInfo);
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
  
  getStream(key: string): XFormStream {
    return this._streamsMap.get(key);
  }

  *getStreams(): Iterable<XFormStream> {
    for (const pair of this._streamsMap) {
      yield pair[1];
    }
    return;
  }
  
  setStream(key: string, stream: XFormStream) {
    this._streamsMap.set(key, stream);
    this._edited = true;
  }
  
  clearStreams() {
    this._streamsMap.clear();
    this._edited = true;
  }

  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];

    const nStream = this._streamsMap.get("/N");
    if (nStream) {   
      bytes.push(...encoder.encode("/N "));  
      bytes.push(...ObjectId.fromRef(nStream.ref).toArray(cryptInfo));
    } else if (this.N) {
      bytes.push(...encoder.encode("/N "));
      if (this.N instanceof ObjectMapDict) {        
        bytes.push(...this.N.toArray(cryptInfo));
      } else {               
        bytes.push(...this.N.toArray(cryptInfo));
      }
    }

    const rStream = this._streamsMap.get("/R");
    if (rStream) {   
      bytes.push(...encoder.encode("/R "));  
      bytes.push(...ObjectId.fromRef(rStream.ref).toArray(cryptInfo));
    } else if (this.R) {
      bytes.push(...encoder.encode("/R "));
      if (this.R instanceof ObjectMapDict) {        
        bytes.push(...this.R.toArray(cryptInfo));
      } else {               
        bytes.push(...this.R.toArray(cryptInfo));
      }
    }
    
    const dStream = this._streamsMap.get("/D");
    if (dStream) {   
      bytes.push(...encoder.encode("/D "));  
      bytes.push(...ObjectId.fromRef(dStream.ref).toArray(cryptInfo));
    } else if (this.D) {
      bytes.push(...encoder.encode("/D "));
      if (this.D instanceof ObjectMapDict) {        
        bytes.push(...this.D.toArray(cryptInfo));
      } else {               
        bytes.push(...this.D.toArray(cryptInfo));
      }
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }

  protected async fillStreamsMapAsync(parseInfoGetterAsync: (id: number) => Promise<ParserInfo>) {
    this._streamsMap.clear();

    for (const prop of ["N", "R", "D"]) {
      if (this[prop]) {
        if (this[prop] instanceof ObjectId) {
          const streamParseInfo = await parseInfoGetterAsync(this[prop].id);
          if (!streamParseInfo) {
            continue;
          }
          const stream = await XFormStream.parseAsync(streamParseInfo);
          if (!stream) {
            continue;
          }
          if (stream) {
            this._streamsMap.set(`/${prop}`, stream.value);
          }
        } else {
          for (const [name, objectId] of this[prop].getProps()) {
            const streamParseInfo = await parseInfoGetterAsync(objectId.id);
            if (!streamParseInfo) {
              continue;
            }
            const stream = await XFormStream.parseAsync(streamParseInfo);
            if (stream) {
              this._streamsMap.set(`/${prop}${name}`, stream.value);
            }
          }
        }
      }
    }
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
          case "/N":
            const nEntryType = await parser.getValueTypeAtAsync(i);
            if (nEntryType === valueTypes.REF) {              
              const nRefId = await ObjectId.parseRefAsync(parser, i);
              if (nRefId) {
                this.N = nRefId.value;
                i = nRefId.end + 1;
                break;
              }
            } else if (nEntryType === valueTypes.DICTIONARY) {     
              const nDictBounds = parser.getDictBoundsAt(i);
              if (nDictBounds) {
                const nSubDict = await ObjectMapDict.parseAsync({parser, bounds: nDictBounds});
                if (nSubDict) {
                  this.N = nSubDict.value;
                  i = nSubDict.end + 1;
                  break;
                }
              }
            } else {
              throw new Error(`Unsupported /N property value type: ${nEntryType}`);
            }
            throw new Error("Can't parse /N property value");
            
          case "/R":
            const rEntryType = await parser.getValueTypeAtAsync(i);
            if (rEntryType === valueTypes.REF) {              
              const rRefId = await ObjectId.parseRefAsync(parser, i);
              if (rRefId) {
                this.R = rRefId.value;
                i = rRefId.end + 1;
                break;
              }
            } else if (rEntryType === valueTypes.DICTIONARY) {     
              const rDictBounds = parser.getDictBoundsAt(i);
              if (rDictBounds) {
                const rSubDict = await ObjectMapDict.parseAsync({parser, bounds: rDictBounds});
                if (rSubDict) {
                  this.R = rSubDict.value;
                  i = rSubDict.end + 1;
                  break;
                }
              }
            } else {
              throw new Error(`Unsupported /R property value type: ${rEntryType}`);
            }
            throw new Error("Can't parse /R property value");

          case "/D":
            const dEntryType = await parser.getValueTypeAtAsync(i);
            if (dEntryType === valueTypes.REF) {              
              const dRefId = await ObjectId.parseRefAsync(parser, i);
              if (dRefId) {
                this.D = dRefId.value;
                i = dRefId.end + 1;
                break;
              }
            } else if (dEntryType === valueTypes.DICTIONARY) {     
              const dDictBounds = parser.getDictBoundsAt(i);
              if (dDictBounds) {
                const dSubDict = await ObjectMapDict.parseAsync({parser, bounds: dDictBounds});
                if (dSubDict) {
                  this.D = dSubDict.value;
                  i = dSubDict.end + 1;
                  break;
                }
              }
            } else {
              throw new Error(`Unsupported /D property value type: ${dEntryType}`);
            }
            throw new Error("Can't parse /D property value");
          default:
            // skip to next name
            i = await parser.skipToNextNameAsync(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
    
    if (!this.N) {
      throw new Error("Not all required properties parsed");
    }

    if (parseInfo.parseInfoGetterAsync) {
      await this.fillStreamsMapAsync(parseInfo.parseInfoGetterAsync);
    }
  }
  
  protected override initProxy(): AppearanceDict {
    return <AppearanceDict>super.initProxy();
  }

  protected override getProxy(): AppearanceDict {
    return <AppearanceDict>super.getProxy();
  }
}
