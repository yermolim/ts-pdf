import { Quadruple } from "../../../common/types";
import { codes } from "../../codes";
import { dictTypes, valueTypes } from "../../const";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";

import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";

import { HexString } from "../strings/hex-string";
import { DateString } from "../strings/date-string";

/**PDF document page dictionary */
export class PageDict extends PdfDict {
  /**
   * (Required; shall be an indirect reference) 
   * The page tree node that is the immediate parent of this page object
   */
  Parent: ObjectId;
  /**
   * (Required if PieceInfo is present; optional otherwise; PDF 1.3+) 
   * The date and time when the page’s contents were most recently modified. 
   * If a page-piece dictionary (PieceInfo) is present, 
   * the modification date shall be used to ascertain 
   * which of the application data dictionaries 
   * that it contains correspond to the current content of the page
   */
  LastModified: DateString;
  /**
   * (Required; inheritable) A dictionary containing any resources required by the page. 
   * If the page requires no resources, the value of this entry should be an empty dictionary. 
   * Omitting the entry entirely indicates that the resources are to be inherited 
   * from an ancestor node in the page tree
   */
  Resources: Uint8Array;
  /**
   * (Required; inheritable) A rectangle , expressed in default user space units, 
   * that shall define the boundaries of the physical medium 
   * on which the page shall be displayed or printed
   */
  MediaBox: Quadruple;
  /**
   * (Optional; inheritable) A rectangle, expressed in default user space units, 
   * defining the visible region of default user space. When the page is dis-played or printed, 
   * its contents are to be clipped (cropped) to this rectangle and then imposed 
   * on the output medium in some implementation-defined manner. 
   * Default value: the value of MediaBox
   */
  CropBox: Quadruple;
  /**
   * (Optional; PDF1.3+) A rectangle, expressed in default user space units, 
   * defining the region to which the contents of the page should be clipped 
   * when output in a production environment. 
   * Default value: the value of CropBox
   */
  BleedBox: Quadruple;
  /**
   * (Optional; PDF1.3+) A rectangle, expressed in default user space units, 
   * defining the intended dimensions of the finished page after trimming. 
   * Default value: the value of CropBox
   */
  TrimBox: Quadruple;
  /**
   * (Optional; PDF1.3+) A rectangle, expressed in default user space units, 
   * defining the extent of the page’s meaningful content 
   * (including potential white space) as intended by the page’s creator. 
   * Default value: the value of CropBox
   */
  ArtBox: Quadruple;
  /**
   * (Optional) A content stream describing the contents of this page. 
   * If this entry is absent, the page is empty. The value may be 
   * either a single stream or an array of streams. If the value is an array, 
   * the effect is as if all of the streams in the array were concatenated, 
   * in order, to form a single stream. This allows PDF producers 
   * to create image objects and other resources as they occur, 
   * even though they interrupt the content stream. The division between streams 
   * may occur only at the boundaries between lexical tokens but is unrelated 
   * to the page’s logical content or organization. Applications that consume
   * or produce PDF files are not required to preserve the existing structure of the Contents array.
   */
  Contents: ObjectId | ObjectId[]; 
  /**
   * (Optional; inheritable) The number of degrees by which the page shall be rotated 
   * clockwise when displayed or printed. The value shall be a multiple of 90
   */
  Rotate = 0;
  /**
   * (Optional) A stream object defining the page’s thumbnail image
   */
  Thumb: ObjectId;
  /**
   * (Optional; PDF1.1+; recommended if the page contains article beads) 
   * An array of indirect references to article beads appearing on the page. 
   * The beads are listed in the array in natural reading order
   */
  B: ObjectId | ObjectId[];  
  /**
   * (Optional; PDF1.1+) The page’s display duration (also called its advance timing): 
   * the maximum length of time, in seconds, that the page is displayed during presentations 
   * before the viewer application automatically advances to the next page. 
   * By default, the viewer does not advance automatically
   */
  Dur: number;
  /**
   * (Optional) An array of annotation dictionaries that shall contain indirect 
   * references to all annotations associated with the page
   */
  Annots: ObjectId | ObjectId[];
  /**
   * (Optional; PDF 1.4+) A metadata stream containing metadata for the page
   */
  Metadata: ObjectId; 
  /**
   * (Required if the page contains structural content items; PDF1.3+) 
   * The integer key of the page’s entry in the structural parent tree
   */
  StructParent: number;
  /**
   * (Optional; PDF1.3+; indirect reference preferred) 
   * The digital identifier of the page’s parent Web Capture content set
   */
  ID: HexString;
  /**
   * (Optional; PDF1.3+) The page’s preferred zoom (magnification) factor: 
   * the factor by which it should be scaled to achieve the natural display magnification
   */
  PZ: number;
  /**
   * (Optional; PDF 1.5+) A name specifying the tab order to be used for annotations on the page. 
   * The possible values are R (row order), C (column order), and S (structure order).
   */
  Tabs: string;
  /**
   * (Required if this page was created from a named page object; PDF 1.5+) 
   * The name of the originating page object
   */
  TemplateInstantiated: string;
  /**
   * (Optional; PDF 1.6+) A positive number giving the size of default user space units, 
   * in multiples of 1⁄72 inch. The range of supported values is implementation-dependent. 
   * Default value: 1.0 (user unit is 1⁄72 inch)
   */
  UserUnit: number;

  // TODO: Add other properties
  // BoxColorInfo, Group, Trans, AA, PieceInfo, SeparationInfo, PresSteps, VP
  
  constructor() {
    super(dictTypes.PAGE);
  }  
  
  static parse(parseInfo: ParseInfo): ParseResult<PageDict> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new PageDict();
      pdfObject.parseProps(parseInfo);
      return {value: pdfObject, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }  
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Parent) {
      bytes.push(...encoder.encode("/Parent "), codes.WHITESPACE, ...this.Parent.toArray(cryptInfo));
    }
    if (this.LastModified) {
      bytes.push(...encoder.encode("/LastModified "), ...this.LastModified.toArray(cryptInfo));
    }
    if (this.Resources) {
      bytes.push(...encoder.encode("/Resources "), ...this.Resources);
    }
    if (this.MediaBox) {
      bytes.push(
        ...encoder.encode("/MediaBox "), codes.L_BRACKET, 
        ...encoder.encode(this.MediaBox[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.MediaBox[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.MediaBox[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.MediaBox[3] + ""), codes.R_BRACKET,
      );
    }
    if (this.CropBox) {
      bytes.push(
        ...encoder.encode("/CropBox "), codes.L_BRACKET, 
        ...encoder.encode(this.CropBox[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.CropBox[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.CropBox[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.CropBox[3] + ""), codes.R_BRACKET,
      );
    }
    if (this.BleedBox) {
      bytes.push(
        ...encoder.encode("/BleedBox "), codes.L_BRACKET, 
        ...encoder.encode(this.BleedBox[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.BleedBox[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.BleedBox[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.BleedBox[3] + ""), codes.R_BRACKET,
      );
    }
    if (this.TrimBox) {
      bytes.push(
        ...encoder.encode("/TrimBox "), codes.L_BRACKET, 
        ...encoder.encode(this.TrimBox[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.TrimBox[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.TrimBox[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.TrimBox[3] + ""), codes.R_BRACKET,
      );
    }
    if (this.ArtBox) {
      bytes.push(
        ...encoder.encode("/ArtBox "), codes.L_BRACKET, 
        ...encoder.encode(this.ArtBox[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.ArtBox[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.ArtBox[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.ArtBox[3] + ""), codes.R_BRACKET,
      );
    }
    if (this.Contents) {
      if (this.Contents instanceof ObjectId) {        
        bytes.push(...encoder.encode("/Contents "), codes.WHITESPACE, ...this.Contents.toArray(cryptInfo));
      } else {
        bytes.push(...encoder.encode("/Contents "), codes.L_BRACKET);
        this.Contents.forEach(x => bytes.push(codes.WHITESPACE, ...x.toArray(cryptInfo)));
        bytes.push(codes.R_BRACKET);
      }
    }
    if (this.Rotate) {
      bytes.push(...encoder.encode("/Rotate "), ...encoder.encode(" " + this.Rotate));
    }
    if (this.Thumb) {
      bytes.push(...encoder.encode("/Thumb "), codes.WHITESPACE, ...this.Thumb.toArray(cryptInfo));
    }    
    if (this.B) {
      if (this.B instanceof ObjectId) {        
        bytes.push(...encoder.encode("/B "), codes.WHITESPACE, ...this.B.toArray(cryptInfo));
      } else {
        bytes.push(...encoder.encode("/B "), codes.L_BRACKET);
        this.B.forEach(x => bytes.push(codes.WHITESPACE, ...x.toArray(cryptInfo)));
        bytes.push(codes.R_BRACKET);
      }
    }
    if (this.Dur) {
      bytes.push(...encoder.encode("/Dur "), ...encoder.encode(" " + this.Dur));
    }
    if (this.Annots) {
      if (this.Annots instanceof ObjectId) {        
        bytes.push(...encoder.encode("/Annots "), codes.WHITESPACE, ...this.Annots.toArray(cryptInfo));
      } else {
        bytes.push(...encoder.encode("/Annots "), codes.L_BRACKET);
        this.Annots.forEach(x => bytes.push(codes.WHITESPACE, ...x.toArray(cryptInfo)));
        bytes.push(codes.R_BRACKET);
      }
    }
    if (this.Metadata) {
      bytes.push(...encoder.encode("/Metadata "), codes.WHITESPACE, ...this.Metadata.toArray(cryptInfo));
    } 
    if (this.StructParent) {
      bytes.push(...encoder.encode("/StructParent "), ...encoder.encode(" " + this.StructParent));
    }
    if (this.ID) {
      bytes.push(...encoder.encode("/ID "), codes.WHITESPACE, ...this.ID.toArray(cryptInfo));
    }
    if (this.PZ) {
      bytes.push(...encoder.encode("/PZ "), ...encoder.encode(" " + this.PZ));
    }
    if (this.Tabs) {
      bytes.push(...encoder.encode("/Tabs "), ...encoder.encode(this.Tabs));
    }
    if (this.TemplateInstantiated) {
      bytes.push(...encoder.encode("/TemplateInstantiated "), ...encoder.encode(this.TemplateInstantiated));
    }
    if (this.UserUnit) {
      bytes.push(...encoder.encode("/UserUnit "), ...encoder.encode(" " + this.UserUnit));
    }

    // TODO: handle remaining properties

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  protected parseProps(parseInfo: ParseInfo) {
    super.parseProps(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 

    // DEBUG
    // console.log(parser.sliceChars(start, end));    
    
    let i = parser.skipToNextName(start, end - 1);
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/Parent":
          case "/Thumb":
          case "/Metadata":
            i = this.parseRefProp(name, parser, i);
            break;
          
          case "/LastModified":
            i = this.parseDateProp(name, parser, i, parseInfo.cryptInfo);
            break;           
          
          // there is no need to parse page resources
          // so just save the resource property source bytes
          // the source bytes will be used when converting the page to bytes
          case "/Resources":  
            const resEntryType = parser.getValueTypeAt(i);
            if (resEntryType === valueTypes.REF) {              
              const resDictId = ObjectId.parseRef(parser, i);
              if (resDictId && parseInfo.parseInfoGetter) {
                this.Resources = parser.sliceCharCodes(resDictId.start, resDictId.end);
                i = resDictId.end + 1;
                break;
              }              
              throw new Error("Can't parse /Resources value reference");
            } else if (resEntryType === valueTypes.DICTIONARY) { 
              const resDictBounds = parser.getDictBoundsAt(i); 
              if (resDictBounds) {
                this.Resources = parser.sliceCharCodes(resDictBounds.start, resDictBounds.end);
                i = resDictBounds.end + 1;
                break;
              }
              throw new Error("Can't parse /Resources dictionary bounds"); 
            }
            throw new Error(`Unsupported /Resources property value type: ${resEntryType}`);              
          
          case "/MediaBox":
          case "/CropBox":
          case "/BleedBox":
          case "/TrimBox":
          case "/ArtBox":
            i = this.parseNumberArrayProp(name, parser, i, true);
            break;          
          
          case "/Contents":
          case "/B":
          case "/Annots":
            const refEntryType = parser.getValueTypeAt(i);
            if (refEntryType === valueTypes.REF) {              
              const refArrayId = ObjectId.parseRef(parser, i);
              if (refArrayId) {
                this[name.slice(1)] = refArrayId.value;
                i = refArrayId.end + 1;
                break;
              }
            } else if (refEntryType === valueTypes.ARRAY) {              
              const refIds = ObjectId.parseRefArray(parser, i);
              if (refIds) {
                this[name.slice(1)] = refIds.value;
                i = refIds.end + 1;
                break;
              }
            }
            throw new Error(`Unsupported ${name} property value type: ${refEntryType}`);
          
          case "/Rotate":
          case "/Dur":
          case "/StructParent":
          case "/PZ":
          case "/UserUnit":
            i = this.parseNumberProp(name, parser, i, false);
            break;

          case "/ID":
            const webCaptureIdEntryType = parser.getValueTypeAt(i);
            if (webCaptureIdEntryType === valueTypes.REF) {              
              const webCaptureRefId = ObjectId.parseRef(parser, i);
              if (webCaptureRefId) {
                if (webCaptureRefId && parseInfo.parseInfoGetter) {
                  const webCaptureIdParseInfo = parseInfo.parseInfoGetter(webCaptureRefId.value.id);
                  if (webCaptureIdParseInfo) {
                    const webCaptureId = HexString.parse(
                      webCaptureIdParseInfo.parser, 
                      webCaptureIdParseInfo.bounds.start,
                      webCaptureIdParseInfo.cryptInfo);
                    if (webCaptureId) {
                      this.ID = webCaptureId.value;
                      i = webCaptureRefId.end + 1;
                      break;
                    }
                  }
                }
              }              
              throw new Error("Can't parse /ID property value");
            } else if (webCaptureIdEntryType === valueTypes.STRING_HEX) {              
              const webCaptureId = HexString.parse(parser, i, parseInfo.cryptInfo);
              if (webCaptureId) {
                this.ID = webCaptureId.value;
                i = webCaptureId.end + 1;
                break;
              }
            }
            throw new Error(`Unsupported /ID property value type: ${webCaptureIdEntryType}`);

          case "/Tabs":
          case "/TemplateInstantiated":
            i = this.parseNameProp(name, parser, i);
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
    
    if (!this.Parent) {
      throw new Error("Not all required properties parsed");
    }
  }
}
