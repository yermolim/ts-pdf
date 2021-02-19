import { ObjectId } from "../core/object-id";
import { PdfStream } from "../core/pdf-stream";
import { streamTypes } from "../../const";
import { ParseInfo, ParseResult } from "../../data-parser";
import { OcMembershipDict } from "../optional-content/oc-membership-dict";
import { OcGroupDict } from "../optional-content/oc-group-dict";
import { codes } from "../../codes";
import { CryptInfo } from "../../common-interfaces";

// TODO: add separate logic for decoding images
export class ImageStream extends PdfStream {
  /**
   * (Required) The type of XObject that this dictionary describes; must be Image for an image XObject
   */
  readonly Subtype: "/Image" = "/Image";

  /**
   * (Required) The width of the image, in samples
   */
  Width: number;
  /**
   * (Required) The height of the image, in samples
   */
  Height: number;
  /**
   * (Required for images, except those that use the JPXDecode filter; not allowed for image masks) 
   * The color space in which image samples are specified; it can be any type of color space except Pattern. 
   * 
   * If the image uses the JPXDecode filter, this entry is optional. 
   * 
   * If ColorSpace is present, any color space specifications in the JPEG2000 data are ignored.
   * 
   * If ColorSpace is absent, the color space specifications in the JPEG2000 data are used. 
   * The Decode array is also ignored unless ImageMask is true
   */
  ColorSpace: string;
  /**
   * (Required except for image masks and images that use the JPXDecode filter) 
   * The number of bits used to represent each color component. Only a single value may be specified; 
   * the number of bits is the same for all color components. Valid values are 1, 2, 4, 8, and (in PDF 1.5+) 16. 
   * If ImageMask is true, this entry is optional, and if specified, its value must be 1. 
   * If the image stream uses a filter, the value of BitsPerComponent must be consistent with the size of the data 
   * samples that the filter delivers. In par-ticular, a CCITTFaxDecode or JBIG2Decode filter always 
   * delivers 1-bit sam-ples, a RunLengthDecode or DCTDecode filter delivers 8-bit samples, 
   * and an LZWDecode or FlateDecode filter delivers samples of a specified size if a predictor function is used. 
   * If the image stream uses the JPXDecode filter, this entry is optional and ignored if present. 
   * The bit depth is determined in the process of decoding the JPEG2000 image
   */
  BitsPerComponent: number;
  /** 
   * (Optional) An array of numbers describing how to map image samples 
   * into the range of values appropriate for the image’s color space. If ImageMask is true, 
   * the array must be either [0 1] or [1 0]; otherwise, its length must be twice 
   * the number of color components required by ColorSpace. If the image uses
   * the JPXDecode filter and ImageMask is false, Decode is ignored
   * */
  Decode: number[];
  /** 
   * (Optional) A flag indicating whether image interpolation is to be performed
   * */
  Interpolate = false;
  
  /** 
   * (Required if the image is a structural content item; PDF1.3+) 
   * The integer key of the image’s entry in the structural parent tree
   * */
  StructParent: number;
  /**
   * (Optional; PDF 1.4+) A metadata stream containing metadata for the image
   */
  Metadata: ObjectId;

  /** 
   * (Optional; PDF1.5+) An optional content group or optional content membership dictionary, 
   * specifying the optional content properties for this image XObject. 
   * Before the image is processed, its visibility is determined based on this entry. 
   * If it is deter-mined to be invisible, the entire image is skipped,
   * as if there were no Do operator to invoke it
   * */
  OC: OcMembershipDict | OcGroupDict;

  //TODO: add remaining properties
  //Intent
  //ImageMask
  //Mask
  //Alternates
  //SMask
  //SMaskInData
  //Group
  //OPI
  
  set streamData(data: Uint8Array) { 
    this.setStreamData(data);
  }
  get decodedStreamData(): Uint8Array {
    if (!this._decodedStreamData) {
      this.decodeStreamData();
    }
    return this._decodedStreamData;
  }
  
  constructor() {
    super(streamTypes.FORM_XOBJECT);
  }  

  static parse(parseInfo: ParseInfo): ParseResult<ImageStream> {    
    const xForm = new ImageStream();
    const parseResult = xForm.tryParseProps(parseInfo);

    return parseResult
      ? {value: xForm, start: parseInfo.bounds.start, end: parseInfo.bounds.end}
      : null;
  }

  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Subtype) {
      bytes.push(...encoder.encode("/Subtype"), ...encoder.encode(this.Subtype));
    }
    if (this.Width) {
      bytes.push(...encoder.encode("/Width"), ...encoder.encode(" " + this.Width));
    }
    if (this.Height) {
      bytes.push(...encoder.encode("/Width"), ...encoder.encode(" " + this.Height));
    }
    if (this.ColorSpace) {
      bytes.push(...encoder.encode("/ColorSpace"), ...encoder.encode(this.ColorSpace));
    }
    if (this.BitsPerComponent) {
      bytes.push(...encoder.encode("/BitsPerComponent"), ...encoder.encode(" " + this.BitsPerComponent));
    }
    if (this.Decode) {
      bytes.push(...encoder.encode("/Decode"), codes.L_BRACKET);
      this.Decode.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
    }
    bytes.push(...encoder.encode("/Interpolate"), ...encoder.encode(" " + !!this.Interpolate));
    if (this.StructParent) {
      bytes.push(...encoder.encode("/StructParent"), ...encoder.encode(" " + this.StructParent));
    }
    if (this.Metadata) {
      bytes.push(...encoder.encode("/Metadata"), codes.WHITESPACE, ...this.Metadata.toArray(cryptInfo));
    }
    
    //TODO: handle remaining properties

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
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
    
    let i = parser.skipToNextName(dictBounds.contentStart, dictBounds.contentEnd);
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
              i = subtype.end + 1;
            } else {
              throw new Error("Can't parse /Subtype property value");
            }
            break;
          case "/Width":
            const width = parser.parseNumberAt(i, false);
            if (width) {
              this.Width = width.value;
              i = width.end + 1;
            } else {
              throw new Error("Can't parse /Width property value");
            }
            break;    
          case "/Height":
            const height = parser.parseNumberAt(i, false);
            if (height) {
              this.Height = height.value;
              i = height.end + 1;
            } else {
              throw new Error("Can't parse /Height property value");
            }
            break;              
          case "/ColorSpace":
            const colorSpace = parser.parseNameAt(i, false);
            if (colorSpace) {
              this.ColorSpace = colorSpace.value;
              i = colorSpace.end + 1;
            } else {
              throw new Error("Can't parse /ColorSpace property value");
            }
            break; 
          case "/BitsPerComponent":
            const bitsPerComponent = parser.parseNumberAt(i, false);
            if (bitsPerComponent) {
              this.BitsPerComponent = bitsPerComponent.value;
              i = bitsPerComponent.end + 1;
            } else {
              throw new Error("Can't parse /BitsPerComponent property value");
            }
            break; 
          case "/Decode":
            const decode = parser.parseNumberArrayAt(i, false);
            if (decode) {
              this.Decode = decode.value;
              i = decode.end + 1;
            } else {
              throw new Error("Can't parse /Decode property value");
            }
            break;  
          case "/Interpolate":
            const interpolate = parser.parseBoolAt(i, false);
            if (interpolate) {
              this.Interpolate = interpolate.value;
              i = interpolate.end + 1;
            } else {
              throw new Error("Can't parse /Interpolate property value");
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
          case "/Metadata":
            const metaId = ObjectId.parseRef(parser, i);
            if (metaId) {
              this.Metadata = metaId.value;
              i = metaId.end + 1;
            } else {              
              throw new Error("Can't parse /Metadata property value");
            }
            break; 
            // TODO: handle remaining cases
          case "/OC":
          case "/Group":
          case "/OPI":  
          case "/Intent":
          case "/ImageMask":
          case "/Mask":
          case "/Alternates":
          case "/SMask":
          case "/SMaskInData":
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

    if (!this.Width && !this.Height) {
      // not all required properties parsed
      return false;
    }

    return true;
  }
  
  protected setStreamData(data: Uint8Array) {
    // TODO: implement
  }
  
  protected decodeStreamData() {    
    // TODO: implement
  }
}
