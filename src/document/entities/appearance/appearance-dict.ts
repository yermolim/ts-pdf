import { valueTypes } from "../../common/const";
import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { ObjectId } from "../common/object-id";
import { PdfDict } from "../core/pdf-dict";
import { AppearanceSubDict } from "./appearance-sub-dict";

export class AppearanceDict extends PdfDict {
  /**
   * (Required) The annotation’s normal appearance 
   */
  N: AppearanceSubDict | ObjectId;
  /**
   * (Optional) The annotation’s rollover appearance
   */
  R: AppearanceSubDict | ObjectId; 
  /**
   * (Optional) The annotation’s down appearance
   */
  D: AppearanceSubDict | ObjectId; 
  
  constructor() {
    super(null);
  } 
  
  static parse(parseInfo: ParseInfo): ParseResult<AppearanceDict> {    
    const trailer = new AppearanceDict();
    const parseResult = trailer.tryParseProps(parseInfo);

    return parseResult
      ? {value: trailer, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
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
          case "/N":
            const nEntryType = parser.getValueTypeAt(i);
            if (nEntryType === valueTypes.REF) {              
              const nRefId = ObjectId.parseRef(parser, i);
              if (nRefId) {
                this.N = nRefId.value;
                i = nRefId.end + 1;
                break;
              }
            } else if (nEntryType === valueTypes.DICTIONARY) {     
              const nDictBounds = parser.getDictBoundsAt(i);
              if (nDictBounds) {
                const nSubDict = AppearanceSubDict.parse({parser, bounds: nDictBounds});
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
            const rEntryType = parser.getValueTypeAt(i);
            if (rEntryType === valueTypes.REF) {              
              const rRefId = ObjectId.parseRef(parser, i);
              if (rRefId) {
                this.R = rRefId.value;
                i = rRefId.end + 1;
                break;
              }
            } else if (rEntryType === valueTypes.DICTIONARY) {     
              const rDictBounds = parser.getDictBoundsAt(i);
              if (rDictBounds) {
                const rSubDict = AppearanceSubDict.parse({parser, bounds: rDictBounds});
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
            const dEntryType = parser.getValueTypeAt(i);
            if (dEntryType === valueTypes.REF) {              
              const dRefId = ObjectId.parseRef(parser, i);
              if (dRefId) {
                this.D = dRefId.value;
                i = dRefId.end + 1;
                break;
              }
            } else if (dEntryType === valueTypes.DICTIONARY) {     
              const dDictBounds = parser.getDictBoundsAt(i);
              if (dDictBounds) {
                const dSubDict = AppearanceSubDict.parse({parser, bounds: dDictBounds});
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
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
    
    if (!this.N) {
      // not all required properties parsed
      return false;
    }

    return true;
  }
}
