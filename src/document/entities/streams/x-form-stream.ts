import { ObjectId } from "../common/object-id";
import { PdfStream } from "../core/pdf-stream";
import { Matrix, Rect, streamTypes, valueTypes } from "../../common/const";
import { ParseInfo, ParseResult } from "../../parser/data-parser";
import { OcMembershipDict } from "../optional-content/oc-membership-dict";
import { OcGroupDict } from "../optional-content/oc-group-dict";
import { DateString } from "../common/date-string";
import { ResourceDict } from "../misc/resource-dict";

export class XFormStream extends PdfStream {
  /**
   * (Required) The type of XObject that this dictionary describes
   */
  readonly Subtype: "/Form" = "/Form";
  /**
   * (Optional) A code identifying the type of form XObject that this dictionary describes. 
   * The only valid value is 1
   */
  readonly FormType: 1 = 1;
  /**
   * (Required) An array of four numbers in the form coordinate system (see above), 
   * giving the coordinates of the left, bottom, right, and top edges, respectively, 
   * of the form XObject’s bounding box
   */
  BBox: Rect;
  /**
   * (Optional) An array of six numbers specifying the form matrix, 
   * which maps form space into user space
   */
  Matrix: Matrix = [1,0,0,1,0,0];
  /**
   * (Optional but strongly recommended; PDF 1.2+) A dictionary specifying any resources 
   * (such as fonts and images) required by the form
   */
  Resources: ResourceDict;
  /**
   * (Optional; PDF 1.4+) A metadata stream containing metadata for the form XObject
   */
  Metadata: ObjectId;
  /**
   * (Required if PieceInfo is present; optional otherwise; PDF 1.3+) 
   * The date and time when the form XObject’s contents were most recently modified. 
   * If a page-piece dictionary (PieceInfo) is present, the modification date 
   * shall be used to ascertain which of the application data dictionaries 
   * it contains correspond to the current content of the form
   */
  LastModified: DateString;
  /** 
   * (Required if the form XObject is a structural content item; PDF 1.3+) 
   * The integer key of the form XObject’s entry in the structural parent tree
   * */
  StructParent: number;
  /** 
   * (Required if the form XObject contains marked-content sequences 
   * that are structural content items; PDF 1.3+) 
   * The integer key of the form XObject’s entry in the structural parent tree
   * */
  StructParents: number;
  /** (Optional; PDF 1.5+) An optional content group or optional content membership dictionary
   *  specifying the optional content properties for the annotation */
  OC: OcMembershipDict | OcGroupDict;

  //TODO: add remaining properties
  //Group
  //OPI
  
  constructor() {
    super(streamTypes.FORM_XOBJECT);
  }  

  static parse(parseInfo: ParseInfo): ParseResult<XFormStream> {    
    const trailer = new XFormStream();
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

    if (this.Type !== streamTypes.FORM_XOBJECT) {
      return false;
    }

    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const dictBounds = parser.getDictBoundsAt(start);
    
    let i = parser.skipToNextName(start, dictBounds.contentEnd);
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
          case "/FormType":
            const formType = parser.parseNumberAt(i, false);
            if (formType) {
              if (formType.value !== 1) {
                // wrong form type
                return false;
              }
            } else {
              throw new Error("Can't parse /Subtype property value");
            }
            break;          
          case "/BBox":
            const boundingBox = parser.parseNumberArrayAt(i, true);
            if (boundingBox) {
              this.BBox = [
                boundingBox.value[0],
                boundingBox.value[1],
                boundingBox.value[2],
                boundingBox.value[3],
              ];
              i = boundingBox.end + 1;
            } else {              
              throw new Error("Can't parse /BBox property value");
            }
            break;          
          case "/Matrix":
            const matrix = parser.parseNumberArrayAt(i, true);
            if (matrix) {
              this.Matrix = [
                matrix.value[0],
                matrix.value[1],
                matrix.value[2],
                matrix.value[3],
                matrix.value[4],
                matrix.value[5],
              ];
              i = matrix.end + 1;
            } else {              
              throw new Error("Can't parse /Matrix property value");
            }
            break;          
          case "/Resources":
            const resEntryType = parser.getValueTypeAt(i);
            if (resEntryType === valueTypes.REF) {              
              const resDictId = ObjectId.parseRef(parser, i);
              if (resDictId && parseInfo.parseInfoGetter) {
                const resParseInfo = parseInfo.parseInfoGetter(resDictId.value.id);
                if (resParseInfo) {
                  const resDict = ResourceDict.parse(resParseInfo);
                  if (resDict) {
                    this.Resources = resDict.value;
                    i = resDict.end + 1;
                    break;
                  }
                }
              }              
              throw new Error("Can't parse /Resources value reference");
            } else if (resEntryType === valueTypes.DICTIONARY) { 
              const resDictBounds = parser.getDictBoundsAt(i); 
              if (resDictBounds) {
                const resDict = ResourceDict.parse({parser, bounds: resDictBounds});
                if (resDict) {
                  this.Resources = resDict.value;
                  i = resDict.end + 1;
                  break;
                }
              }  
              throw new Error("Can't parse /Resources value dictionary");  
            }
            throw new Error(`Unsupported /Resources property value type: ${resEntryType}`);         
          case "/Metadata":
            const metaId = ObjectId.parseRef(parser, i);
            if (metaId) {
              this.Metadata = metaId.value;
              i = metaId.end + 1;
            } else {              
              throw new Error("Can't parse /Metadata property value");
            }
            break;
          case "/LastModified":
            const date = DateString.parse(parser, i, false);
            if (date) {
              this.LastModified = date.value;
              i = date.end + 1;
            } else {              
              throw new Error("Can't parse /LastModified property value");
            }
            break;  
          case "/StructParent":
            const parentKey = parser.parseNumberAt(i, false);
            if (parentKey) {
              this.StructParent = parentKey.value;
              i = parentKey.end + 1;
            } else {              
              throw new Error("Can't parse /StructParent property value");
            }
            break;          
          case "/StructParents":
            const parentsKey = parser.parseNumberAt(i, false);
            if (parentsKey) {
              this.StructParents = parentsKey.value;
              i = parentsKey.end + 1;
            } else {              
              throw new Error("Can't parse /StructParents property value");
            }
            break;
          // TODO: handle remaining cases
          case "/OC":
          case "/Group":
          case "/OPI":
          default:
            // skip to next name
            i = parser.skipToNextName(i, dictBounds.contentEnd);
            break;
        }
      } else {
        break;
      }
    };

    if (!this.BBox) {
      // not all required properties parsed
      return false;
    }

    return true;
  }
}
