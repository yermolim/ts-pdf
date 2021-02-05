import { ObjectId } from "../common/object-id";
import { PdfDict } from "../core/pdf-dict";
import { DateString } from "../common/date-string";
import { BorderStyleDict } from "../appearance/border-style-dict";
import { AppearanceDict } from "../appearance/appearance-dict";
import { OcGroupDict } from "../optional-content/oc-group-dict";
import { OcMembershipDict } from "../optional-content/oc-membership-dict";
import { BorderEffectDict } from "../appearance/border-effect-dict";
import { AnnotationType, dictTypes, Rect, valueTypes } from "../../common/const";
import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { LiteralString } from "../common/literal-string";
import { BorderArray } from "../appearance/border-array";

export abstract class AnnotationDict extends PdfDict {
  /** User defined annotation id */
  uuid: string;

  /** (Required) The type of annotation that this dictionary describes */
  readonly Subtype: AnnotationType;
  
  /** (Required) The annotation rectangle, 
   * defining the location of the annotation on the page in default user space units */
  Rect: Rect;

  /** (Optional) Text to be displayed for the annotation */
  Contents: LiteralString;

  /** (Optional; PDF1.3+) An indirect reference to the page object 
   * with which this annotation is associated */
  P: ObjectId;
  /** (Optional; PDF1.4+) The annotation name,  
   * a text string uniquely identifying it among all the annotations on its page */
  NM: LiteralString;
  /** (Optional; PDF1.1+) The date and time when the annotation was most recently modified */
  M: DateString | LiteralString;
  /** (Optional; PDF1.1+) A set of flags. 
   * Is an integer interpreted as one-bit flags 
   * specifying various characteristics of the annotation. 
   * Bit positions within the flag word shall be numbered from low-order to high-order, 
   * with the lowest-order bit numbered 1 */
  F = 0;
  
  /** (Optional; PDF1.2+) An appearance dictionary 
   * specifying how the annotation is presented visually on the page */
  AP: AppearanceDict;
  /** (Required if AP contains one or more subdictionaries; PDF1.2+)   
   * The annotation’s appearance state name, 
   * which selects the applicable appearance stream from an appearance subdictionary */
  AS: string;

  /** (Optional) An array specifying the characteristics of the annotation’s border.  
   * The border is specified as a rounded rectangle. [rx, ry, w, [dash gap]] */
  Border: BorderArray = new BorderArray(0, 0, 1);
  /** (Optional; PDF1.2+) Specifies a border style dictionary 
   * that has more settings than the array specified for the Border entry. 
   * If an annotation dictionary includes the BS entry, then the Border entry is ignored
   */
  BS: BorderStyleDict;
  /** (Optional; PDF1.5+) Specifies a border effect dictionary 
   * that specifies an effect that shall be applied to the border of the annotations
  */
  BE: BorderEffectDict;

  /** (Optional; PDF1.1+) An array of numbers in the range 0.0 to 1.0, 
   * representing a color of icon background, title bar and link border.
   * The number of array elements determines the color space in which the color is defined: 
   * 0 - transparent; 1 - gray; 3 - RGB; 4 - CMYK */
  C: number[];

  /** (Required if the annotation is a structural content item; PDF 1.3+) 
   * The integer key of the annotation’s entry in the structural parent tree */
  StructParent: number;
  /** (Optional; PDF 1.5+) An optional content group or optional content membership dictionary
   *  specifying the optional content properties for the annotation */
  OC: OcMembershipDict | OcGroupDict;

  protected constructor(subType: AnnotationType) {
    super(dictTypes.ANNOTATION);

    this.Subtype = subType;
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
          case "/Subtype":
            const subtype = parser.parseNameAt(i);
            if (subtype) {
              if (this.Subtype && this.Subtype !== subtype.value) {
                // wrong object subtype
                return false;
              }
            } else {
              throw new Error("Can't parse /Subtype property value");
            }
            break;       
          case "/Contents":
            const contents = LiteralString.parse(parser, i);
            if (contents) {
              this.Contents = contents.value;
              i = contents.end + 1;
            } else {              
              throw new Error("Can't parse /Contents property value");
            }
            break;
          case "/Rect":
            const rect = parser.parseNumberArrayAt(i, true);
            if (rect) {
              this.Rect = [
                rect.value[0],
                rect.value[1],
                rect.value[2],
                rect.value[3],
              ];
              i = rect.end + 1;
            } else {              
              throw new Error("Can't parse /Rect property value");
            }
            break;
          case "/P":
            const pageId = ObjectId.parseRef(parser, i);
            if (pageId) {
              this.P = pageId.value;
              i = pageId.end + 1;
            } else {              
              throw new Error("Can't parse /P property value");
            }
            break;
          case "/NM":
            const uniqueName = LiteralString.parse(parser, i);
            if (uniqueName) {
              this.NM = uniqueName.value;
              i = uniqueName.end + 1;
            } else {              
              throw new Error("Can't parse /NM property value");
            }
            break;
          case "/M":
            const date = DateString.parse(parser, i);
            if (date) {
              this.M = date.value;
              i = date.end + 1;    
              break;      
            } else {   
              const dateLiteral = LiteralString.parse(parser, i);
              if (dateLiteral) {
                this.M = dateLiteral.value;
                i = dateLiteral.end + 1; 
                break;   
              } 
            }
            throw new Error("Can't parse /M property value"); 
          case "/F":
            const flags = parser.parseNumberAt(i, false);
            if (flags) {
              this.F = flags.value;
              i = flags.end + 1;
            } else {              
              throw new Error("Can't parse /F property value");
            }
            break;          
          case "/C":
            const color = parser.parseNumberArrayAt(i, true);
            if (color) {
              this.C = color.value;
              i = color.end + 1;
            } else {              
              throw new Error("Can't parse /C property value");
            }
            break;
          case "/StructParent":
            const structureKey = parser.parseNumberAt(i, false);
            if (structureKey) {
              this.StructParent = structureKey.value;
              i = structureKey.end + 1;
            } else {              
              throw new Error("Can't parse /StructParent property value");
            }
            break;
          case "/Border":
            const borderArray = BorderArray.parse(parser, i);
            if (borderArray) {
              this.Border = borderArray.value;
              i = borderArray.end + 1;
            } else {              
              throw new Error("Can't parse /Border property value");
            }
            break;
          case "/BS":            
            const bsEntryType = parser.getValueTypeAt(i);
            if (bsEntryType === valueTypes.REF) {              
              const bsDictId = ObjectId.parseRef(parser, i);
              if (bsDictId && parseInfo.parseInfoGetter) {
                const bsParseInfo = parseInfo.parseInfoGetter(bsDictId.value.id);
                if (bsParseInfo) {
                  const bsDict = BorderStyleDict.parse(bsParseInfo);
                  if (bsDict) {
                    this.BS = bsDict.value;
                    i = bsDict.end + 1;
                    break;
                  }
                }
              }              
              throw new Error("Can't parse /BS value reference");
            } else if (bsEntryType === valueTypes.DICTIONARY) { 
              const bsDictBounds = parser.getDictBoundsAt(i); 
              if (bsDictBounds) {
                const bsDict = BorderStyleDict.parse({parser, bounds: bsDictBounds});
                if (bsDict) {
                  this.BS = bsDict.value;
                  i = bsDict.end + 1;
                  break;
                }
              }  
              throw new Error("Can't parse /BS value dictionary");  
            }
            throw new Error(`Unsupported /BS property value type: ${bsEntryType}`);
          case "/BE":
            const beEntryType = parser.getValueTypeAt(i);
            if (beEntryType === valueTypes.REF) {              
              const bsDictId = ObjectId.parseRef(parser, i);
              if (bsDictId && parseInfo.parseInfoGetter) {
                const bsParseInfo = parseInfo.parseInfoGetter(bsDictId.value.id);
                if (bsParseInfo) {
                  const bsDict = BorderEffectDict.parse(bsParseInfo);
                  if (bsDict) {
                    this.BE = bsDict.value;
                    i = bsDict.end + 1;
                    break;
                  }
                }
              }              
              throw new Error("Can't parse /BE value reference");
            } else if (beEntryType === valueTypes.DICTIONARY) { 
              const bsDictBounds = parser.getDictBoundsAt(i); 
              if (bsDictBounds) {
                const bsDict = BorderEffectDict.parse({parser, bounds: bsDictBounds});
                if (bsDict) {
                  this.BE = bsDict.value;
                  i = bsDict.end + 1;
                  break;
                }
              }  
              throw new Error("Can't parse /BE value dictionary");  
            }
            throw new Error(`Unsupported /BE property value type: ${beEntryType}`);
          case "/AP":          
            const apEntryType = parser.getValueTypeAt(i);
            if (apEntryType === valueTypes.REF) {              
              const apDictId = ObjectId.parseRef(parser, i);
              if (apDictId && parseInfo.parseInfoGetter) {
                const apParseInfo = parseInfo.parseInfoGetter(apDictId.value.id);
                if (apParseInfo) {
                  const apDict = AppearanceDict.parse(apParseInfo);
                  if (apDict) {
                    this.AP = apDict.value;
                    i = apDict.end + 1;
                    break;
                  }
                }
              }              
              throw new Error("Can't parse /AP value reference");
            } else if (apEntryType === valueTypes.DICTIONARY) { 
              const apDictBounds = parser.getDictBoundsAt(i); 
              if (apDictBounds) {
                const apDict = AppearanceDict.parse({parser, bounds: apDictBounds});
                if (apDict) {
                  this.AP = apDict.value;
                  i = apDict.end + 1;
                  break;
                }
              }  
              throw new Error("Can't parse /AP value dictionary");  
            }
            throw new Error(`Unsupported /AP property value type: ${apEntryType}`);
          case "/AS":
            const stateName = parser.parseNameAt(i, true);
            if (stateName) {
              this.AS = stateName.value;
              i = stateName.end + 1;
            } else {              
              throw new Error("Can't parse /AS property value");
            }
            break;
          // TODO: handle remaining properties
          case "/OC":
          default:
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
    
    if (!this.Subtype || !this.Rect) {
      // not all required properties parsed
      return false;
    }

    return true;
  }
}
