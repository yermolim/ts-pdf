import { ObjectId } from "../core/object-id";
import { PdfStream } from "../core/pdf-stream";
import { colorSpaces, streamFilters, streamTypes, valueTypes } from "../../spec-constants";
import { DataParser, ParseResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";
import { codes } from "../../encoding/char-codes";
import { CryptInfo } from "../../encryption/interfaces";
import { DecodeParamsDict } from "../encoding/decode-params-dict";
import { IndexedColorSpaceArray } from "../appearance/indexed-color-space-array";

// TODO: add separate logic for decoding images
export class ImageStream extends PdfStream {
  //#region PDF properties

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
   * samples that the filter delivers. In particular, a CCITTFaxDecode or JBIG2Decode filter always 
   * delivers 1-bit samples, a RunLengthDecode or DCTDecode filter delivers 8-bit samples, 
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

  // /** 
  //  * (Optional; PDF1.5+) An optional content group or optional content membership dictionary, 
  //  * specifying the optional content properties for this image XObject. 
  //  * Before the image is processed, its visibility is determined based on this entry. 
  //  * If it is deter-mined to be invisible, the entire image is skipped,
  //  * as if there were no Do operator to invoke it
  //  * */
  // OC: OcMembershipDict | OcGroupDict;

  //TODO: add remaining properties
  //Intent
  //Alternates
  //ID
  //OPI

  //#endregion
  
  protected _sMask: ImageStream;
  get sMask(): ImageStream {
    return this._sMask;
  }
  set sMask(value: ImageStream) {
    this._sMask = value;
  }

  protected _indexedColorSpace: IndexedColorSpaceArray;
  
  protected _imageUrl: string;
  
  constructor() {
    super(streamTypes.FORM_XOBJECT);
  }  

  static parse(parseInfo: ParserInfo): ParseResult<ImageStream> { 
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new ImageStream();
      pdfObject.parseProps(parseInfo);
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

    if (this.Subtype) {
      bytes.push(...encoder.encode("/Subtype "), ...encoder.encode(this.Subtype));
    }
    if (this.Width) {
      bytes.push(...encoder.encode("/Width "), ...encoder.encode(" " + this.Width));
    }
    if (this.Height) {
      bytes.push(...encoder.encode("/Height "), ...encoder.encode(" " + this.Height));
    }
    if (this.ColorSpace) {
      if (this._indexedColorSpace) {
        bytes.push(...encoder.encode("/ColorSpace "), ...this._indexedColorSpace.toArray(cryptInfo));
      } else {
        bytes.push(...encoder.encode("/ColorSpace "), ...encoder.encode(this.ColorSpace));
      }
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

  async getImageUrlAsync(): Promise<string> {
    if (this._imageUrl) {
      // revoke old url
      URL.revokeObjectURL(this._imageUrl);
    }

    if (this.Filter === streamFilters.DCT
      || this.Filter === streamFilters.JBIG2
      || this.Filter === streamFilters.JPX) {
      // JPEG image. no additional operations needed          
      const blob = new Blob([this.decodedStreamData], {
        type: "application/octet-binary",
      });
      const imageUrl = URL.createObjectURL(blob);
      this._imageUrl = imageUrl;
      return imageUrl;
      // DEBUG
      // const img = new Image();
      // img.onload = () => {
      //   URL.revokeObjectURL(url);
      //   console.log(img);
      //   document.body.append(img);
      // };
      // img.onerror = (e: string | Event) => {
      //   console.log(this.Filter);
      //   console.log(e);
      // };
      // img.src = url;
    }

    if (this.Filter === streamFilters.FLATE) {
      // PNG image.
      const length = this.Width * this.Height; 
      // get alpha value
      let alpha: Uint8Array;
      if (this.sMask) {
        // use sMask values as alpha
        alpha = this.sMask.decodedStreamData;
        if (alpha.length !== length) {
          throw new Error(`Invalid alpha mask data length: ${alpha.length} (must be ${length})`);
        }
      } else {
        // fill alpha with max values
        alpha = new Uint8Array(length).fill(255);
      }
      // fill data array with RGBA values

      const imageBytes = new Uint8ClampedArray(length * 4);
      const colors = this.getRgbColors();
      let j: number;
      let k: number;
      for (let i = 0; i < length; i++) {
        j = i * 4;
        k = i * 3;
        imageBytes[j] = colors[k];
        imageBytes[j + 1] = colors[k + 1];
        imageBytes[j + 2] = colors[k + 2];
        imageBytes[j + 3] = alpha[i];
      }      
      const imageData = new ImageData(imageBytes, this.Width, this.Height);

      // convert RGBA array to url using canvas
      const urlPromise = new Promise<string>((resolve, reject) => {
        const canvas = document.createElement("canvas");
        canvas.width = this.Width;
        canvas.height = this.Height;
        canvas.getContext("2d").putImageData(imageData, 0, 0);
        canvas.toBlob((blob: Blob) => {
          const url = URL.createObjectURL(blob);  
          resolve(url);          
          //DEBUG
          // const img = document.createElement("img");
          // img.onload = () => {
          //   URL.revokeObjectURL(url);
          // };
          // img.src = url;
          // document.body.appendChild(img);  
        });
      });
      const imageUrl = await urlPromise; 
      this._imageUrl = imageUrl; 
      return imageUrl;
    }
    
    throw new Error(`Unsupported image filter type: ${this.Filter}`);
  }

  /**
   * fill public properties from data using info/parser if available
   */
  protected override parseProps(parseInfo: ParserInfo) {
    super.parseProps(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const dictBounds = parser.getDictBoundsAt(start);
    
    let i = parser.skipToNextName(dictBounds.contentStart, dictBounds.contentEnd);
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
                throw new Error(`Ivalid dict subtype: '${subtype.value}' instead of '${this.Subtype}'`);
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
              throw new Error("Can't parse /ColorSpace name");
            } else if (colorSpaceEntryType === valueTypes.ARRAY) { 
              const colorSpaceArrayBounds = parser.getArrayBoundsAt(i); 
              if (colorSpaceArrayBounds) {
                const indexedColorSpace = IndexedColorSpaceArray.parse({
                  parser, 
                  bounds: colorSpaceArrayBounds,
                  cryptInfo: parseInfo.cryptInfo,
                  parseInfoGetter: parseInfo.parseInfoGetter,
                });
                if (indexedColorSpace) {
                  this.ColorSpace = colorSpaces.SPECIAL_INDEXED;
                  this._indexedColorSpace = indexedColorSpace.value;
                  i = colorSpaceArrayBounds.end + 1;
                  break;
                }
                // TODO: add support for other special color spaces
                throw new Error("Can't parse /ColorSpace object:" +
                  parser.sliceChars(colorSpaceArrayBounds.start, colorSpaceArrayBounds.end)); 
              }  
              throw new Error("Can't parse /ColorSpace value array");  
            } else if (colorSpaceEntryType === valueTypes.REF) { 
              const colorSpaceRef = ObjectId.parseRef(parser, i); 
              if (colorSpaceRef) {
                const colorSpaceParseInfo = parseInfo.parseInfoGetter(colorSpaceRef.value.id);
                if (colorSpaceParseInfo) {
                  const indexedColorSpace = IndexedColorSpaceArray.parse(colorSpaceParseInfo);
                  if (indexedColorSpace) {
                    this.ColorSpace = colorSpaces.SPECIAL_INDEXED;
                    this._indexedColorSpace = indexedColorSpace.value;
                    i = colorSpaceRef.end + 1;
                    break;
                  }
                  // TODO: add support for other special color spaces
                  throw new Error("Can't parse /ColorSpace object:" +
                    colorSpaceParseInfo.parser.sliceChars(
                      colorSpaceParseInfo.bounds.start, 
                      colorSpaceParseInfo.bounds.end)); 
                }
              }  
              throw new Error("Can't parse /ColorSpace ref");  
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
      throw new Error("Not all required properties parsed");
    }

    if (this.ImageMask && (this.BitsPerComponent !== 1 || this.ColorSpace)) {
      /*
      If ImageMask is true, the value of BitsPerComponent must be 1 
      and Mask and ColorSpace should not be specified
      */
      throw new Error("Mutually exclusive properties found");
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
        case colorSpaces.SPECIAL_INDEXED: 
          this.Decode = [0, Math.pow(2, this.BitsPerComponent || 1) - 1];
          break;
        // case colorSpaces.SPECIAL_PATTERN: 
        //   throw new Error("Pattern color space is not permitted with images");
        // case colorSpaces.CIE_LAB: 
        // case colorSpaces.CIE_ICC: 
        // case colorSpaces.SPECIAL: 
        default:  
          this.Decode = [0,1];
          break;
      }
    }

    if (!this.DecodeParms) {
      this.DecodeParms = new DecodeParamsDict();
    }
    if (!this.DecodeParms.getIntProp("/BitsPerComponent")) {
      this.DecodeParms.setIntProp("/BitsPerComponent", this.BitsPerComponent);
    }
    if (!this.DecodeParms.getIntProp("/Columns")) {
      this.DecodeParms.setIntProp("/Columns", this.Width);
    }
    if (!this.DecodeParms.getIntProp("/Colors")) {
      switch (this.ColorSpace) {
        case colorSpaces.GRAYSCALE:  
        case colorSpaces.SPECIAL_INDEXED:     
        // case colorSpaces.CIE_GRAYSCALE:       
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
          this.DecodeParms.setIntProp("/Colors", 1);
          break;
      }
    }
    
    if (this.SMask) {
      const sMaskParseInfo = parseInfo.parseInfoGetter(this.SMask.id);
      if (!sMaskParseInfo) {
        throw new Error(`Can't get parse info for ref: ${this.SMask.id} ${this.sMask.generation} R`);
      }
      const sMask = ImageStream.parse(sMaskParseInfo);
      if (!sMask) {
        throw new Error(`Can't parse SMask: ${this.SMask.id} ${this.sMask.generation} R`);
      }
      this._sMask = sMask.value;
    }
  }
  
  protected getRgbColor(index: number): [r: number, g: number, b: number] {
    const data = this.decodedStreamData;
    switch (this.ColorSpace) {
      case colorSpaces.GRAYSCALE:    
        const gray = data[index];        
        return [gray, gray, gray];
      case colorSpaces.RGB:      
        return [
          data[index * 3], 
          data[index * 3 + 1], 
          data[index * 3 + 2],
        ];
      case colorSpaces.CMYK:  
        const c = data[index * 4] / 255;
        const m = data[index * 4 + 1] / 255;   
        const y = data[index * 4 + 2] / 255;   
        const k = data[index * 4 + 3] / 255;      
        return [
          255 * (1 - c) * (1 - k),
          255 * (1 - m) * (1 - k),
          255 * (1 - y) * (1 - k),  
        ];
      case colorSpaces.SPECIAL_INDEXED:
        return this._indexedColorSpace?.getColor(index) || [0, 0, 0];
    }
  }
  
  protected getRgbColors(): Uint8ClampedArray {
    const data = this.decodedStreamData;
    const pixels = this.Width * this.Height; 
    const length = pixels * 3; 
    const result = new Uint8ClampedArray(length);
    let i: number;
    let j: number;
    let n: number;
    switch (this.ColorSpace) {
      case colorSpaces.GRAYSCALE:
        let gray: number;
        for (i = 0; i < pixels; i++) {
          gray = data[i];
          j = i * 3;

          result[j] = gray;
          result[j + 1] = gray;
          result[j + 2] = gray;
        }
        break;

      case colorSpaces.RGB:  
        for (i = 0; i < length; i++) {
          result[i] = data[i];
        }
        break;

      case colorSpaces.CMYK: 
        let c: number;
        let m: number;
        let y: number;
        let k: number; 
        for (i = 0; i < pixels; i++) {
          j = i * 3;
          n = i * 4;

          c = data[n] / 255;
          m = data[n + 1] / 255;   
          y = data[n + 2] / 255;   
          k = data[n + 3] / 255; 

          result[j] = 255 * (1 - c) * (1 - k);
          result[j + 1] = 255 * (1 - m) * (1 - k);
          result[j + 2] = 255 * (1 - y) * (1 - k);
        }
        break;

      case colorSpaces.SPECIAL_INDEXED: 
        let r: number;
        let g: number;
        let b: number;
        for (i = 0; i < pixels; i++) {
          [r, g, b] = this._indexedColorSpace?.getColor(i) || [0, 0, 0];
          j = i * 3;
          result[j] = r;
          result[j + 1] = g;
          result[j + 2] = b;
        }
        break;
    }
    return result;
  }
}
