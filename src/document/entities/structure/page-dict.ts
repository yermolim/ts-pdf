import { Quadruple } from "../../../common/types";
import { dictTypes, valueTypes } from "../../spec-constants";
import { CryptInfo } from "../../encryption/interfaces";
import { ParserResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";

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
  Resources: Uint8Array; // don't parse, just keep an unchanged byte array
  /**
   * (Required; inheritable) A rectangle , expressed in default user space units, 
   * that shall define the boundaries of the physical medium 
   * on which the page shall be displayed or printed
   */
  MediaBox: Quadruple;
  /**
   * (Optional; inheritable) A rectangle, expressed in default user space units, 
   * defining the visible region of default user space. When the page is displayed or printed, 
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
  
  static async parseAsync(parseInfo: ParserInfo): Promise<ParserResult<PageDict>> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new PageDict();
      await pdfObject.parsePropsAsync(parseInfo);
      return {value: pdfObject, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }  
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Parent) {
      bytes.push(...encoder.encode("/Parent "), ...this.Parent.toArray(cryptInfo));
    }
    if (this.LastModified) {
      bytes.push(...encoder.encode("/LastModified "), ...this.LastModified.toArray(cryptInfo));
    }
    if (this.Resources) {
      bytes.push(...encoder.encode("/Resources "), ...this.Resources);
    }
    if (this.MediaBox) {
      bytes.push(...encoder.encode("/MediaBox "), ...this.encodePrimitiveArray(this.MediaBox, encoder));
    }
    if (this.CropBox) {
      bytes.push(...encoder.encode("/CropBox "), ...this.encodePrimitiveArray(this.CropBox, encoder));
    }
    if (this.BleedBox) {
      bytes.push(...encoder.encode("/BleedBox "), ...this.encodePrimitiveArray(this.BleedBox, encoder));
    }
    if (this.TrimBox) {
      bytes.push(...encoder.encode("/TrimBox "), ...this.encodePrimitiveArray(this.TrimBox, encoder));
    }
    if (this.ArtBox) {
      bytes.push(...encoder.encode("/ArtBox "), ...this.encodePrimitiveArray(this.ArtBox, encoder));
    }
    if (this.Contents) {
      if (this.Contents instanceof ObjectId) {        
        bytes.push(...encoder.encode("/Contents "), ...this.Contents.toArray(cryptInfo));
      } else {
        bytes.push(...encoder.encode("/Contents "), ...this.encodeSerializableArray(this.Contents, cryptInfo));
      }
    }
    if (this.Rotate) {
      bytes.push(...encoder.encode("/Rotate "), ...encoder.encode(" " + this.Rotate));
    }
    if (this.Thumb) {
      bytes.push(...encoder.encode("/Thumb "), ...this.Thumb.toArray(cryptInfo));
    }    
    if (this.B) {
      if (this.B instanceof ObjectId) {        
        bytes.push(...encoder.encode("/B "), ...this.B.toArray(cryptInfo));
      } else {
        bytes.push(...encoder.encode("/B "), ...this.encodeSerializableArray(this.B, cryptInfo));
      }
    }
    if (this.Dur) {
      bytes.push(...encoder.encode("/Dur "), ...encoder.encode(" " + this.Dur));
    }
    if (this.Annots) {
      if (this.Annots instanceof ObjectId) {        
        bytes.push(...encoder.encode("/Annots "), ...this.Annots.toArray(cryptInfo));
      } else {
        bytes.push(...encoder.encode("/Annots "), ...this.encodeSerializableArray(this.Annots, cryptInfo));
      }
    }
    if (this.Metadata) {
      bytes.push(...encoder.encode("/Metadata "), ...this.Metadata.toArray(cryptInfo));
    } 
    if (this.StructParent) {
      bytes.push(...encoder.encode("/StructParent "), ...encoder.encode(" " + this.StructParent));
    }
    if (this.ID) {
      bytes.push(...encoder.encode("/ID "), ...this.ID.toArray(cryptInfo));
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
  
  protected override async parsePropsAsync(parseInfo: ParserInfo) {
    await super.parsePropsAsync(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 

    // DEBUG
    // console.log(parser.sliceChars(start, end));    
    
    let i = parser.skipToNextName(start, end - 1);
    let name: string;
    let parseResult: ParserResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/Parent":
          case "/Thumb":
          case "/Metadata":
            i = await this.parseRefPropAsync(name, parser, i);
            break;
          
          case "/LastModified":
            i = await this.parseDatePropAsync(name, parser, i, parseInfo.cryptInfo);
            break;           
          
          // there is no need to parse page resources
          // so just save the resource property source bytes
          // the source bytes will be used when converting the page to bytes
          case "/Resources":  
            const resEntryType = parser.getValueTypeAt(i);
            if (resEntryType === valueTypes.REF) {              
              const resDictId = await ObjectId.parseRefAsync(parser, i);
              if (resDictId && parseInfo.parseInfoGetterAsync) {
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
              const refArrayId = await ObjectId.parseRefAsync(parser, i);
              if (refArrayId) {
                this[name.slice(1)] = refArrayId.value;
                i = refArrayId.end + 1;
                break;
              }
            } else if (refEntryType === valueTypes.ARRAY) {              
              const refIds = await ObjectId.parseRefArrayAsync(parser, i);
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
            i = await this.parseNumberPropAsync(name, parser, i, false);
            break;

          case "/ID":
            const webCaptureIdEntryType = parser.getValueTypeAt(i);
            if (webCaptureIdEntryType === valueTypes.REF) {              
              const webCaptureRefId = await ObjectId.parseRefAsync(parser, i);
              if (webCaptureRefId) {
                if (webCaptureRefId && parseInfo.parseInfoGetterAsync) {
                  const webCaptureIdParseInfo = await parseInfo.parseInfoGetterAsync(webCaptureRefId.value.id);
                  if (webCaptureIdParseInfo) {
                    const webCaptureId = await HexString.parseAsync(
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
              const webCaptureId = await HexString.parseAsync(parser, i, parseInfo.cryptInfo);
              if (webCaptureId) {
                this.ID = webCaptureId.value;
                i = webCaptureId.end + 1;
                break;
              }
            }
            throw new Error(`Unsupported /ID property value type: ${webCaptureIdEntryType}`);

          case "/Tabs":
          case "/TemplateInstantiated":
            i = await this.parseNamePropAsync(name, parser, i);
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
