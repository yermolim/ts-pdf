import { ObjectId } from "../core/object-id";
import { PdfStream } from "../core/pdf-stream";
import { colorSpaces, streamFilters, streamTypes, valueTypes } from "../../const";
import { DataParser, ParseInfo, ParseResult } from "../../data-parser";
import { OcMembershipDict } from "../optional-content/oc-membership-dict";
import { OcGroupDict } from "../optional-content/oc-group-dict";
import { codes } from "../../codes";
import { CryptInfo } from "../../common-interfaces";
import { DecodeParamsDict } from "../encoding/decode-params-dict";

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
   * (Optional) A flag indicating whether the image is to be treated as an image mask. 
   * If this flag is true, the value of BitsPerComponent must be 1 and Mask and ColorSpace 
   * should not be specified; unmasked areas are painted using the current non-stroking color
   * */
  ImageMask = false;
  /** 
   * (Optional) An array of numbers describing how to map image samples 
   * into the range of values appropriate for the image’s color space. If ImageMask is true, 
   * the array must be either [0 1] or [1 0]; otherwise, its length must be twice 
   * the number of color components required by ColorSpace. If the image uses
   * the JPXDecode filter and ImageMask is false, Decode is ignored
   * */
  Mask: number[];
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
   * (Optional; PDF1.4+) A subsidiary image XObject defining a soft-mask image 
   * to be used as a source of mask shape or mask opacity values in the transparent imaging model. 
   * The alpha source parameter in the graphics state determines whether the mask values 
   * are interpreted as shape or opacity. If present, this entry overrides the current soft mask 
   * in the graphics state, as well as the image’s Mask entry, if any. 
   * (However, the other transparency-related graphics state parameters—blend mode 
   * and alpha constant—remain in effect.) 
   * If SMask is absent, the image has no associated soft mask 
   * (although the current soft mask in the graphics state may still apply)
   */
  SMask: ObjectId;
  /**
   * (Optional for images that use the JPXDecode filter, meaningless otherwise; PDF1.5+) 
   * A code specifying how soft-mask information encoded with image samples should be used:
   * [0] If present, encoded soft-mask image information should be ignored.
   * [1] The image’s data stream includes encoded soft-mask values. 
   * An application can create a soft-mask image from the information to be used 
   * as a source of mask shape or mask opacity in the transparency imaging model.
   * [2] The image’s data stream includes color channels that have been preblended with a background; 
   * the image data also includes an opacity channel. 
   * An application can create a soft-mask image with a Matte entry from the opacity 
   * channel information to be used as a source of mask shape or mask opacity in the transparency model. 
   * If this entry has a nonzero value, SMask should not be specified.
   */
  SMaskInData = 0;
  
  /**
   * (Optional; PDF1.4+) An array of component values specifying the matte color 
   * with which the image data in the parent image has been preblended. 
   * The array consists of n numbers, where n is the number of components in the color space 
   * specified by the ColorSpace entry in the parent image’s image dictionary; 
   * the numbers must be valid color components in that color space. 
   * If this entry is absent, the image data is not preblended
   */
  Matte: number[];  
  
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
  //Alternates
  //ID
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
      bytes.push(...encoder.encode("/Subtype "), ...encoder.encode(this.Subtype));
    }
    if (this.Width) {
      bytes.push(...encoder.encode("/Width "), ...encoder.encode(" " + this.Width));
    }
    if (this.Height) {
      bytes.push(...encoder.encode("/Width "), ...encoder.encode(" " + this.Height));
    }
    if (this.ColorSpace) {
      bytes.push(...encoder.encode("/ColorSpace "), ...encoder.encode(this.ColorSpace));
    }
    if (this.BitsPerComponent) {
      bytes.push(...encoder.encode("/BitsPerComponent "), ...encoder.encode(" " + this.BitsPerComponent));
    }
    bytes.push(...encoder.encode("/ImageMask "), ...encoder.encode(" " + !!this.ImageMask));
    if (this.Mask) {
      bytes.push(...encoder.encode("/Mask "), codes.L_BRACKET);
      this.Mask.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
    }
    if (this.Decode) {
      bytes.push(...encoder.encode("/Decode "), codes.L_BRACKET);
      this.Decode.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
    }    
    bytes.push(...encoder.encode("/Interpolate "), ...encoder.encode(" " + !!this.Interpolate));
    if (this.SMask) {
      bytes.push(...encoder.encode("/SMask "), ...this.SMask.toArray(cryptInfo));
    }
    if (this.SMaskInData) {
      bytes.push(...encoder.encode("/SMaskInData "), ...encoder.encode(" " + this.SMaskInData));
    }
    if (this.Matte) {
      bytes.push(...encoder.encode("/Matte "), codes.L_BRACKET);
      this.Matte.forEach(x => bytes.push(codes.WHITESPACE, ...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
    }
    if (this.StructParent) {
      bytes.push(...encoder.encode("/StructParent "), ...encoder.encode(" " + this.StructParent));
    }
    if (this.Metadata) {
      bytes.push(...encoder.encode("/Metadata "), codes.WHITESPACE, ...this.Metadata.toArray(cryptInfo));
    }
    
    //TODO: handle remaining properties
    //OC
    //Intent
    //Alternates
    //ID
    //OPI

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
          case "/Height":
          case "/BitsPerComponent":
          case "/SMaskInData":
          case "/StructParent":
            i = this.parseNumberProp(name, parser, i, false);
            break; 
            
          case "/Decode":
            i = this.parseNumberArrayProp(name, parser, i, false);
            break; 

          case "/Matte":
            i = this.parseNumberArrayProp(name, parser, i, true);
            break; 

          case "/Interpolate":
            i = this.parseBoolProp(name, parser, i);
            break; 

          case "/SMask":
          case "/Metadata":
            i = this.parseRefProp(name, parser, i);
            break;
             
          case "/ColorSpace":
            const colorSpaceEntryType = parser.getValueTypeAt(i);
            if (colorSpaceEntryType === valueTypes.NAME) {  
              const colorSpaceName = parser.parseNameAt(i);  
              if (colorSpaceName) {
                this.ColorSpace = colorSpaceName.value;
                i = colorSpaceName.end + 1;
                break;
              }
              throw new Error("Can't parse /ColorSpace property name");
            } else if (colorSpaceEntryType === valueTypes.ARRAY) { 
              const colorSpaceArrayBounds = parser.getArrayBoundsAt(i); 
              if (colorSpaceArrayBounds) {
                // TODO: implement array-defined color spaces
                i = colorSpaceArrayBounds.end + 1;
                break;
              }  
              throw new Error("Can't parse /ColorSpace value dictionary");  
            }
            throw new Error(`Unsupported /ColorSpace property value type: ${colorSpaceEntryType}`);
           
          case "/ImageMask":
            const imageMask = parser.parseBoolAt(i, false);
            if (imageMask) {
              this.ImageMask = imageMask.value;
              i = imageMask.end + 1;
              if (this.ImageMask) {
                this.BitsPerComponent = 1;
              }
            } else {
              throw new Error("Can't parse /ImageMask property value");
            }
            break; 
          
          case "/Mask":
            const maskEntryType = parser.getValueTypeAt(i);            
            if (maskEntryType === valueTypes.REF) {                  
              const maskStreamId = ObjectId.parseRef(parser, i);
              if (!maskStreamId) {                
                throw new Error("Can't parse /Mask value reference: failed to parse ref");
              }
              const maskParseInfo = parseInfo.parseInfoGetter(maskStreamId.value.id);
              if (!maskParseInfo) {
                throw new Error("Can't parse /Mask value reference: failed to get image parse info");
              }
              const maskStream = ImageStream.parse(maskParseInfo);
              if (!maskStream) {
                throw new Error("Can't parse /Mask value reference: failed to parse image stream");
              }
              const maskStreamParser = new DataParser(new Uint8Array([
                codes.L_BRACKET,
                ...maskStream.value.decodedStreamData,
                codes.R_BRACKET,
              ]));
              if (!maskStreamParser) {
                throw new Error("Can't parse /Mask value reference: failed to get decoded image data");
              }
              const maskArray = maskStreamParser.parseNumberArrayAt(0, false);
              if (!maskArray) {
                throw new Error("Can't parse /Mask value reference: failed to parse decoded image data");
              }       
              this.Mask = maskArray.value;
              i = maskStreamId.end + 1;
              break; 
            } else if (maskEntryType === valueTypes.ARRAY) {               
              const maskArray = parser.parseNumberArrayAt(i, false);
              if (maskArray) {
                this.Mask = maskArray.value;
                i = maskArray.end + 1;
                break;
              }
              throw new Error("Can't parse /Mask property value");
            }
            throw new Error(`Unsupported /Mask property value type: ${maskEntryType}`);
              
          // TODO: handle remaining cases
          case "/OC": 
          case "/Intent":
          case "/Alternates":
          case "/ID":
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

    if (this.ImageMask && (this.BitsPerComponent !== 1 || this.ColorSpace)) {
      /*
      If ImageMask is true, the value of BitsPerComponent must be 1 
      and Mask and ColorSpace should not be specified
      */
      return false;
    }

    // If the image uses the JPXDecode filter and ImageMask is false, Decode is ignored
    if (!this.Decode && !(this.Filter === streamFilters.JPX && !this.ImageMask)) {      
      switch (this.ColorSpace) {
        case colorSpaces.GRAYSCALE:        
        // case colorSpaces.CIE_GRAYSCALE:        
        // case colorSpaces.SPECIAL_SEPARATION:        
          this.Decode = [0,1];
          break;
        case colorSpaces.RGB:        
        // case colorSpaces.CIE_RGB:        
          this.Decode = [0,1, 0,1, 0,1];
          break;
        case colorSpaces.CMYK: 
          this.Decode = [0,1, 0,1, 0,1, 0,1];
          break;
        // case colorSpaces.SPECIAL_INDEXED: 
        //   this.Decode = [0, Math.pow(2, this.BitsPerComponent || 1) - 1];
        //   break;
        // case colorSpaces.SPECIAL_PATTERN: 
        //   throw new Error("Pattern color space is not permitted with images");
        // case colorSpaces.CIE_LAB: 
        // case colorSpaces.CIE_ICC: 
        // case colorSpaces.SPECIAL: 
        default:
          break;
      }
    }

    if (!this.DecodeParms) {
      this.DecodeParms = new DecodeParamsDict();
    }
    this.DecodeParms.setIntProp("/BitsPerComponent", this.BitsPerComponent);
    this.DecodeParms.setIntProp("/Columns", this.Width);
    switch (this.ColorSpace) {
      case colorSpaces.GRAYSCALE:        
      // case colorSpaces.CIE_GRAYSCALE: 
      // case colorSpaces.SPECIAL_INDEXED:        
      // case colorSpaces.SPECIAL_SEPARATION:        
        this.DecodeParms.setIntProp("/Colors", 1);
        break;
      case colorSpaces.RGB:        
      // case colorSpaces.CIE_RGB:        
      // case colorSpaces.CIE_LAB:        
        this.DecodeParms.setIntProp("/Colors", 3);
        break;
      case colorSpaces.CMYK:        
        this.DecodeParms.setIntProp("/Colors", 4);
        break;
      // case colorSpaces.SPECIAL_PATTERN: 
      //   throw new Error("Pattern color space is not permitted with images");
      // case colorSpaces.CIE_ICC: 
      // case colorSpaces.SPECIAL: 
      default:
        break;
    }

    return true;
  }
  
  // protected setStreamData(data: Uint8Array) {
  //   // TODO: implement
  // }
  
  // protected decodeStreamData() {    
  //   // TODO: implement
  // }
}
