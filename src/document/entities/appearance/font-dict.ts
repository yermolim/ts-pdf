import { Quadruple } from "../../../common/types";
import { cyrillicEncodingDifferences, dictTypes, valueTypes } from "../../const";
import { getBit } from "../../byte-functions";
import { CryptInfo } from "../../common-interfaces";
import { ParseInfo, ParseResult } from "../../data-parser";
import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { codes } from "../../codes";

import { UnicodeCmapStream } from "../streams/unicode-cmap-stream";
import { EncodingDict } from "./encoding-dict";
import { FontDescriptorDict } from "./font-descriptor-dict";

export class FontDict extends PdfDict {
  //#region PDF properties
  /** 
   * (Required) The type of font
   * */
  Subtype: string;
  /** 
   * (Required for Type 0, Type 1, TTF) The PostScript name of the font. 
   * 
   * For Type 1 and TrueType fonts, this is usually the value of the FontName entry in the font program. 
   * The Post-Script name of the font can be used to find the font’s definition 
   * in the consumer application or its environment. It is also the name that is used 
   * when printing to a PostScript output device.
   * 
   * Fore Type 0 fonts, this is an arbitrary name, 
   * since there is no font program associated directly with a Type 0 font dictionary. 
   * The conventions described here ensure maximum compatibility with existing Acrobat products.
   * If the descendant is a Type 0 CIDFont, 
   * this name should be the concatenation of the CIDFont’s BaseFont name, a hyphen, 
   * and the CMap name given in the Encoding entry (or the CMapName entry in the CMap). 
   * If the descendant is a Type 2 CIDFont, this name should be the same as the CIDFont’s BaseFontname. 
   * */
  BaseFont: string;
  /** 
   * For Type 1 and TrueType: 
   * (Optional) A specification of the font’s character encoding 
   * if different from its built-in encoding. 
   * The value of Encoding is either the name of a predefined encoding 
   * (MacRomanEncoding, MacExpertEncoding, or WinAnsiEncoding) 
   * or an encoding dictionary that specifies differences from 
   * the font’s built-in encoding or from a specified predefined encoding
   * 
   * For Type 0: 
   * (Required) The name of a predefined CMap, or a stream containing a CMap 
   * that maps character codes to font numbers and CIDs. If the descendant is a Type 2 CIDFont 
   * whose associated TrueType font program is not embedded in the PDF file, 
   * the Encoding entry must be a predefined CMap name
   * */
  Encoding: string | ObjectId;
  /**
   * For Type 1 and TrueType: 
   * (Required except for the standard 14 fonts; shall be an indirect reference) 
   * A font descriptor describing the font’s metrics other than its glyph widths. 
   * For the standard 14 fonts, the entries FirstChar, LastChar, Widths, and FontDescriptor 
   * shall either all be present or all be absent. Ordinarily, these dictionary keys may be absent, 
   * specifying them enables a standard font to be overridden. 
   * Beginning with PDF 1.5, the special treatment given to the standard 14 fonts is deprecated. 
   * Conforming writers should represent all fonts using a complete font descriptor. 
   * For backwards capability, conforming readers shall still provide the special treatment 
   * identified for the standard 14 fonts.
   */
  FontDescriptor: ObjectId;
  /**
   * (Optional; PDF1.2+) A stream containing a CMap file 
   * that maps character codes to Unicode values
   */
  ToUnicode: ObjectId;
  /**
   * For Type 1, Type 3, TrueType:
   * (Required) The first character code defined in the font’s Widths array. 
   * 
   * Old behaviour: required except for the standard 14 fonts.
   * Beginning with PDF 1.5, the special treatment given to the standard 14 fonts is deprecated. 
   * Conforming writers should represent all fonts using a complete font descriptor. 
   * For backwards capability, conforming readers shall still provide the special treatment 
   * identified for the standard 14 fonts. 
   */
  FirstChar: number;
  /**
   * For Type 1, Type 3, TrueType:
   * (Required) The last character code defined in the font’s Widths array. 
   * 
   * Old behaviour: required except for the standard 14 fonts.
   * Beginning with PDF 1.5, the special treatment given to the standard 14 fonts is deprecated. 
   * Conforming writers should represent all fonts using a complete font descriptor. 
   * For backwards capability, conforming readers shall still provide the special treatment 
   * identified for the standard 14 fonts. 
   */
  LastChar: number;
  /**
   * For Type 1 and TrueType:
   * (Required) An array of (LastChar−FirstChar+ 1) widths, each element being the glyph width 
   * for the character code that equals FirstChar plus the array index. 
   * For character codes outside the range FirstChar to LastChar, the value of MissingWidth 
   * from the FontDescriptor entry for this font shall be used. 
   * The glyph widths shall be measured in units in which 1000 units correspond to 1 unit in text space. 
   * These widths shall be consistent with the actual widths given in the font program. 
   * 
   * For Type 3:
   * (Required; should be an indirect reference) 
   * An array of (LastChar−FirstChar+ 1) widths, each element being the glyph width 
   * for the character code that equals FirstChar plus the array index. 
   * For character codes outside the range FirstChar to LastChar, the width shall be 0. 
   * These widths shall be interpreted in glyph space as specified by FontMatrix 
   * (unlike the widths of a Type 1 font, which are in thousandths of a unit of text space). 
   * If FontMatrix specifies a rotation, only the horizontal component of the transformed 
   * width shall be used. That is, the resulting displacement shall be horizontal in text space, 
   * as is the case for all simple fonts. 
   * 
   * Old behaviour: required except for the standard 14 fonts.
   * Beginning with PDF 1.5, the special treatment given to the standard 14 fonts is deprecated. 
   * Conforming writers should represent all fonts using a complete font descriptor. 
   * For backwards capability, conforming readers shall still provide the special treatment 
   * identified for the standard 14 fonts.
   */
  Widths: number[] | ObjectId;
  /** 
   * For Type 3: 
   * (Required) A rectangle expressed in the glyph coordinate system, 
   * specifying the font bounding box. This is the smallest rectangle enclosing 
   * the shape that would result if all of the glyphs of the font were placed 
   * with their origins coincident and then filled. If all four elements 
   * of the rectangle are zero, a conforming reader shall make no assumptions 
   * about glyph sizes based on the font bounding box. If any element is nonzero, 
   * the font bounding box shall be accurate. 
   * If any glyph’s marks fall outside this bounding box, incorrect behavior may result.
   */
  FontBBox: Quadruple;
  /** 
   * For Type 3: 
   * (Required) An array of six numbers specifying the font matrix, 
   * mapping glyph space to text space. 
   * A common practice is to define glyphs in terms 
   * of a 1000-unit glyph coordinate system, 
   * in which case the font matrix is [ 0.001 0 0 0.001 0 0 ].
   */
  FontMatrix: Quadruple;
  /**
   * For Type 3:
   * (Optional but should be used; PDF 1.2) 
   * A list of the named resources, such as fonts and images, 
   * required by the glyph descriptions in this font. 
   * If any glyph descriptions refer to named resources 
   * but this dictionary is absent, the names shall be looked up 
   * in the resource dictionary of the page on which the font is used. 
   */
  Resources: Uint8Array; // don't parse, just keep an unchanged byte array  
  /**
   * For Type 3:
   * (Required) A dictionary in which each key shall be a glyph name and the value 
   * associated with that key shall be a content stream that constructs and paints 
   * the glyph for that character. The stream shall include as its first operator 
   * either d0 or d1, followed by operators describing one or more graphics objects, 
   * which may include path, text, or image objects.
   */
  CharProcs: Uint8Array; // don't parse, just keep an unchanged byte array. TODO: Implement
  /**
   * For Type 0:
   * (Required) A one-element array specifying the CIDFont dictionary 
   * that is the descendant of this Type 0 font
   * 
   * For Type 3:
   * (Required) A dictionary in which each key shall be a glyph name and the value 
   * associated with that key shall be a content stream that constructs and paints 
   * the glyph for that character. The stream shall include as its first operator 
   * either d0 or d1, followed by operators describing one or more graphics objects, 
   * which may include path, text, or image objects.
   */
  DescendantFonts: Uint8Array; // don't parse, just keep an unchanged byte array. TODO: Implement

  // TODO: add remaining properties if needed
  //#endregion
  
  protected _encoding: EncodingDict;
  get encoding(): EncodingDict {
    return this._encoding;
  }
  set encoding(value: EncodingDict) {
    this._encoding = value;
    this.Encoding = value.ref
      ? new ObjectId(value.ref.id, value.ref.generation)
      : null;
  }
  get encodingValue(): ObjectId | string {  
    if (!this.Encoding && this._encoding?.ref) {
      this.Encoding = new ObjectId(this._encoding.ref.id, this._encoding.ref.generation);
    }
    return this.Encoding;
  }
  
  protected _descriptor: FontDescriptorDict;
  get descriptor(): FontDescriptorDict {
    return this._descriptor;
  }
  set descriptor(value: FontDescriptorDict) {
    this._descriptor = value;
    this.FontDescriptor = value.ref
      ? new ObjectId(value.ref.id, value.ref.generation)
      : null;
  }
  get descriptorValue(): ObjectId {  
    if (!this.FontDescriptor && this._descriptor?.ref) {
      this.FontDescriptor = new ObjectId(this._descriptor.ref.id, this._descriptor.ref.generation);
    }
    return this.FontDescriptor;
  }

  protected _toUtfCmap: UnicodeCmapStream;
  get toUtfCmap(): UnicodeCmapStream {
    return this._toUtfCmap;
  }

  /** 'true' if the current font has same width for all chars ('font-family: monospace;'), 
   * 'false' otherwise */
  get isMonospace(): boolean {
    if (!this._descriptor) {
      return false;
    }
    const flags = this._descriptor?.Flags;
    return !!getBit(flags, 0);
  }
  /** 'true' if the current font has serifs ('font-family: serif;'), 
   * 'false' otherwise ('font-family: sans-serif;') */
  get isSerif(): boolean {
    if (!this._descriptor) {
      return false;
    }
    const flags = this._descriptor?.Flags;
    return !!getBit(flags, 1);
  }
  /** 'true' if the current font is script-like ('font-family: cursive;'), 
   * 'false' otherwise */
  get isScript(): boolean {
    if (!this._descriptor) {
      return false;
    }
    const flags = this._descriptor?.Flags;
    return !!getBit(flags, 3);
  }
  /** 'true' if the current font is 'italic', 'false' otherwise */
  get isItalic(): boolean {
    if (!this._descriptor) {
      return false;
    }
    const flags = this._descriptor?.Flags;
    return !!getBit(flags, 6);
  }

  constructor() {
    super(dictTypes.FONT);
  }

  static newFontMap(): Map<string, FontDict> {
    const map = new Map<string, FontDict>();

    const encoding = new EncodingDict();
    encoding.BaseEncoding = "/WinAnsiEncoding";
    encoding.Differences = cyrillicEncodingDifferences.slice();

    map.set("arial", FontDict.createArialFont(encoding));
    map.set("calibri", FontDict.createCalibriFont(encoding));
    map.set("cambria", FontDict.createCambriaFont(encoding));
    map.set("courier", FontDict.createCourierFont(encoding));
    map.set("tnr", FontDict.createTnrFont(encoding));
    map.set("verdana", FontDict.createVerdanaFont(encoding));

    return map;
  }
  
  static parse(parseInfo: ParseInfo): ParseResult<FontDict> {    
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new FontDict();
      pdfObject.parseProps(parseInfo);
      const proxy = new Proxy<FontDict>(pdfObject, pdfObject.onChange);
      pdfObject._proxy = proxy;
      return {value: proxy, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }

  private static createArialFont(encoding: EncodingDict): FontDict {
    const descriptor = new FontDescriptorDict();
    descriptor.FontName = "/ArialMT";
    descriptor.Flags = 32;
    descriptor.ItalicAngle = 0;
    descriptor.Ascent = 905;
    descriptor.Descent = -211;
    descriptor.FontBBox = [-664, -324, 2000, 1039];
    descriptor.CapHeight = 716;
    descriptor.StemV = 0;

    const font = new FontDict();
    font.encoding = encoding;
    font.descriptor = descriptor;
    font.Subtype = "/TrueType";
    font.BaseFont = "/ArialMT";
    font.FirstChar = 32;
    font.LastChar = 255;
    font.Widths = [277, 277, 354, 556, 556, 889, 666, 190, 333, 333, 389, 583, 277, 333, 
      277, 277, 556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 277, 277, 583, 583, 
      583, 556, 925, 666, 666, 722, 722, 666, 610, 777, 722, 277, 500, 666, 556, 833, 
      722, 777, 666, 777, 722, 666, 610, 722, 666, 943, 666, 666, 610, 277, 277, 277, 
      469, 556, 333, 556, 556, 500, 556, 556, 277, 556, 556, 222, 222, 500, 222, 833, 
      556, 556, 556, 556, 333, 500, 277, 556, 500, 722, 500, 500, 500, 333, 259, 333, 
      583, 750, 864, 541, 222, 364, 333, 1000, 556, 556, 556, 1000, 1014, 333, 893, 
      582, 854, 718, 556, 222, 222, 333, 333, 350, 556, 1000, 750, 1000, 906, 333, 
      812, 437, 556, 552, 277, 635, 500, 500, 556, 488, 259, 556, 666, 736, 718, 556, 
      583, 333, 736, 277, 399, 548, 277, 222, 411, 576, 537, 333, 556, 953, 510, 556, 
      222, 666, 500, 277, 666, 656, 666, 541, 677, 666, 923, 604, 718, 718, 582, 656, 
      833, 722, 777, 718, 666, 722, 610, 635, 760, 666, 739, 666, 916, 937, 791, 885, 
      656, 718, 879, 722, 556, 572, 531, 364, 583, 556, 668, 458, 558, 558, 437, 583, 
      687, 552, 556, 541, 556, 500, 458, 500, 822, 500, 572, 520, 802, 822, 625, 718, 
      520, 510, 750, 541,];

    return font;
  }  
  
  private static createCalibriFont(encoding: EncodingDict): FontDict {
    const descriptor = new FontDescriptorDict();
    descriptor.FontName = "/Calibri";
    descriptor.Flags = 32;
    descriptor.ItalicAngle = 0;
    descriptor.Ascent = 750;
    descriptor.Descent = -250;
    descriptor.FontBBox = [-502, -312, 1240, 1026];
    descriptor.CapHeight = 631;
    descriptor.StemV = 0;

    const font = new FontDict();
    font.encoding = encoding;
    font.descriptor = descriptor;
    font.Subtype = "/TrueType";
    font.BaseFont = "/Calibri";
    font.FirstChar = 32;
    font.LastChar = 255;
    font.Widths = [226, 325, 400, 498, 506, 714, 682, 220, 303, 303, 498, 498, 249, 306, 
      252, 386, 506, 506, 506, 506, 506, 506, 506, 506, 506, 506, 267, 267, 498, 498, 498, 
      463, 894, 578, 543, 533, 615, 488, 459, 630, 623, 251, 318, 519, 420, 854, 645, 662, 
      516, 672, 542, 459, 487, 641, 567, 889, 519, 487, 468, 306, 386, 306, 498, 498, 291, 
      479, 525, 422, 525, 497, 305, 470, 525, 229, 239, 454, 229, 798, 525, 527, 525, 525, 
      348, 391, 334, 525, 451, 714, 433, 452, 395, 314, 460, 314, 498, 506, 624, 429, 249, 
      345, 418, 690, 498, 498, 506, 967, 872, 338, 876, 542, 618, 619, 540, 249, 249, 418, 
      418, 498, 498, 905, 0, 705, 750, 338, 769, 463, 532, 524, 226, 527, 452, 318, 498, 
      432, 498, 498, 488, 834, 547, 512, 498, 306, 506, 251, 338, 498, 251, 229, 354, 549, 
      585, 252, 497, 890, 443, 512, 239, 459, 391, 229, 578, 537, 543, 429, 644, 488, 800, 
      473, 641, 641, 542, 610, 854, 623, 662, 621, 516, 533, 487, 527, 697, 519, 638, 555, 
      868, 889, 614, 761, 531, 547, 878, 555, 479, 532, 479, 345, 558, 497, 688, 422, 540, 
      540, 463, 510, 676, 534, 527, 520, 525, 422, 387, 452, 624, 433, 541, 468, 728, 749, 
      536, 666, 469, 442, 721, 474,];

    return font;
  }
  
  private static createCambriaFont(encoding: EncodingDict): FontDict {
    const descriptor = new FontDescriptorDict();
    descriptor.FontName = "/Cambria";
    descriptor.Flags = 32;
    descriptor.ItalicAngle = 0;
    descriptor.Ascent = 950;
    descriptor.Descent = -222;
    descriptor.FontBBox = [-1474, -2463, 2867, 3116];
    descriptor.CapHeight = 666;
    descriptor.StemV = 0;

    const font = new FontDict();
    font.encoding = encoding;
    font.descriptor = descriptor;
    font.Subtype = "/TrueType";
    font.BaseFont = "/Cambria";
    font.FirstChar = 32;
    font.LastChar = 255;
    font.Widths = [220, 285, 393, 619, 505, 889, 687, 236, 381, 381, 427, 553, 205, 332, 
      205, 490, 553, 553, 553, 553, 553, 553, 553, 553, 553, 553, 263, 263, 553, 553, 
      553, 422, 885, 623, 611, 562, 661, 575, 536, 610, 686, 324, 306, 629, 536, 815, 
      680, 653, 567, 653, 621, 496, 592, 647, 603, 921, 571, 570, 537, 350, 490, 350, 
      553, 370, 284, 488, 547, 440, 554, 487, 302, 494, 551, 277, 266, 524, 271, 832, 
      558, 530, 556, 546, 413, 429, 338, 552, 503, 774, 483, 503, 454, 387, 316, 387, 
      712, 658, 738, 534, 205, 446, 360, 751, 516, 516, 628, 1160, 935, 302, 932, 649, 
      752, 666, 538, 221, 221, 375, 375, 443, 500, 1000, 0, 679, 763, 302, 797, 540, 
      551, 566, 220, 600, 503, 306, 543, 501, 316, 500, 575, 850, 569, 487, 553, 332, 
      850, 324, 375, 553, 324, 277, 416, 543, 587, 282, 487, 927, 470, 487, 266, 496, 
      429, 277, 623, 599, 611, 534, 654, 575, 922, 542, 691, 691, 649, 677, 815, 686, 
      653, 674, 567, 562, 592, 600, 778, 571, 671, 625, 926, 926, 731, 850, 597, 573, 
      920, 630, 488, 541, 522, 446, 558, 487, 713, 458, 589, 589, 540, 559, 672, 588, 
      530, 566, 556, 440, 511, 503, 685, 483, 569, 530, 800, 800, 617, 748, 
      514, 470, 767, 530,];

    return font;
  }
  
  private static createCourierFont(encoding: EncodingDict): FontDict {
    const descriptor = new FontDescriptorDict();
    descriptor.FontName = "/CourierNewPSMT";
    descriptor.Flags = 32;
    descriptor.ItalicAngle = 0;
    descriptor.Ascent = 832;
    descriptor.Descent = -300;
    descriptor.FontBBox = [-121, -679, 622, 1020];
    descriptor.CapHeight = 571;
    descriptor.StemV = 0;

    const font = new FontDict();
    font.encoding = encoding;
    font.descriptor = descriptor;
    font.Subtype = "/TrueType";
    font.BaseFont = "/CourierNewPSMT";
    font.FirstChar = 32;
    font.LastChar = 255;
    font.Widths = [600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 600, 
      600, 600, 600, 600,];

    return font;
  }
  
  private static createTnrFont(encoding: EncodingDict): FontDict {
    const descriptor = new FontDescriptorDict();
    descriptor.FontName = "/TimesNewRomanPSMT";
    descriptor.Flags = 32;
    descriptor.ItalicAngle = 0;
    descriptor.Ascent = 891;
    descriptor.Descent = -216;
    descriptor.FontBBox = [-568, -306, 2045, 1039];
    descriptor.CapHeight = 662;
    descriptor.StemV = 0;

    const font = new FontDict();
    font.encoding = encoding;
    font.descriptor = descriptor;
    font.Subtype = "/TrueType";
    font.BaseFont = "/TimesNewRomanPSMT";
    font.FirstChar = 32;
    font.LastChar = 255;
    font.Widths = [250, 333, 408, 500, 500, 833, 777, 180, 333, 333, 500, 563, 250, 333, 
      250, 277, 500, 500, 500, 500, 500, 500, 500, 500, 500, 500, 277, 277, 563, 563, 
      563, 443, 920, 722, 666, 666, 722, 610, 556, 722, 722, 333, 389, 722, 610, 889, 
      722, 722, 556, 722, 666, 556, 610, 722, 722, 943, 722, 722, 610, 333, 277, 333, 
      469, 500, 333, 443, 500, 443, 500, 443, 333, 500, 500, 277, 277, 500, 277, 777, 
      500, 500, 500, 500, 333, 389, 277, 500, 500, 722, 500, 500, 443, 479, 200, 479, 
      541, 777, 751, 578, 333, 410, 443, 1000, 500, 500, 500, 1000, 872, 333, 872, 666, 
      741, 722, 482, 333, 333, 443, 443, 350, 500, 1000, 777, 979, 727, 333, 723, 485, 
      500, 535, 250, 708, 500, 389, 500, 450, 200, 500, 610, 759, 660, 500, 563, 333, 
      759, 333, 399, 548, 333, 277, 351, 576, 453, 333, 443, 954, 429, 500, 277, 556, 
      389, 277, 722, 574, 666, 578, 682, 610, 895, 500, 722, 722, 666, 678, 889, 722, 
      722, 722, 556, 666, 610, 708, 790, 722, 722, 649, 953, 953, 706, 872, 574, 660, 
      973, 666, 443, 508, 472, 410, 508, 443, 690, 395, 535, 535, 485, 499, 632, 535, 
      500, 535, 500, 443, 437, 500, 647, 500, 535, 502, 770, 770, 517, 671, 
      456, 429, 747, 459,];

    return font;
  }
  
  private static createVerdanaFont(encoding: EncodingDict): FontDict {
    const descriptor = new FontDescriptorDict();
    descriptor.FontName = "/Verdana";
    descriptor.Flags = 32;
    descriptor.ItalicAngle = 0;
    descriptor.Ascent = 1005;
    descriptor.Descent = -209;
    descriptor.FontBBox = [-559, -303, 1522, 1050];
    descriptor.CapHeight = 727;
    descriptor.StemV = 0;

    const font = new FontDict();
    font.encoding = encoding;
    font.descriptor = descriptor;
    font.Subtype = "/TrueType";
    font.BaseFont = "/Verdana";
    font.FirstChar = 32;
    font.LastChar = 255;
    font.Widths = [351, 393, 458, 818, 635, 931, 726, 268, 454, 454, 635, 818, 363, 454, 
      363, 454, 635, 635, 635, 635, 635, 635, 635, 635, 635, 635, 454, 454, 818, 818, 818, 
      545, 1000, 683, 685, 698, 770, 632, 574, 775, 751, 420, 454, 692, 556, 842, 748, 787, 
      603, 787, 695, 683, 616, 731, 683, 988, 685, 615, 685, 454, 454, 454, 818, 635, 635, 
      600, 623, 520, 623, 595, 351, 623, 632, 274, 344, 591, 274, 972, 632, 606, 623, 623, 
      426, 520, 394, 632, 591, 818, 591, 591, 525, 634, 454, 634, 818, 1000, 792, 566, 268, 
      471, 458, 818, 635, 635, 635, 1374, 1071, 454, 966, 692, 817, 751, 632, 268, 268, 458, 
      458, 545, 635, 1000, 1000, 976, 914, 454, 914, 591, 632, 637, 351, 615, 591, 454, 635, 
      566, 454, 635, 632, 1000, 700, 644, 818, 454, 1000, 420, 541, 818, 420, 274, 471, 641, 
      635, 363, 595, 993, 546, 644, 344, 683, 520, 274, 683, 685, 685, 566, 745, 632, 973, 
      615, 750, 750, 692, 734, 842, 751, 787, 751, 603, 698, 616, 615, 818, 685, 761, 711, 
      835, 904, 783, 920, 680, 701, 881, 706, 600, 614, 594, 471, 621, 595, 797, 524, 640, 
      640, 591, 620, 696, 637, 606, 637, 623, 534, 496, 591, 840, 591, 644, 605, 875, 887, 
      640, 794, 570, 546, 838, 599,];

    return font;
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  
    
    if (this.Subtype) {
      bytes.push(...encoder.encode("/Subtype "), ...encoder.encode(" " + this.Subtype));
    }
    if (this.BaseFont) {
      bytes.push(...encoder.encode("/BaseFont "), ...encoder.encode(" " + this.BaseFont));
    }
    if (this.ToUnicode) {
      bytes.push(...encoder.encode("/G "), codes.WHITESPACE, ...this.ToUnicode.toArray(cryptInfo));
    }
    if (this.FirstChar) {
      bytes.push(...encoder.encode("/FirstChar "), ...encoder.encode(" " + this.FirstChar));
    }
    if (this.LastChar) {
      bytes.push(...encoder.encode("/LastChar "), ...encoder.encode(" " + this.LastChar));
    }
    if (this.Widths) {
      if (this.Widths instanceof ObjectId) {
        bytes.push(...encoder.encode("/Widths "), codes.WHITESPACE, ...this.Widths.toArray(cryptInfo));
      } else {
        bytes.push(...encoder.encode("/Widths "), codes.L_BRACKET);
        this.Widths.forEach(x => bytes.push(...encoder.encode(" " + x)));
        bytes.push(codes.R_BRACKET);
      }
    }
    
    if (this.Encoding || this.encodingValue) {
      if (this.Encoding instanceof ObjectId) {
        bytes.push(...encoder.encode("/Encoding "), codes.WHITESPACE, ...this.Encoding.toArray(cryptInfo));
      } else {
        bytes.push(...encoder.encode("/Encoding "), ...encoder.encode(" " + this.Encoding));
      }
    }

    if (this.descriptorValue) {
      bytes.push(...encoder.encode("/FontDescriptor "), codes.WHITESPACE, 
        ...this.descriptorValue.toArray(cryptInfo));
    }

    if (this.Resources) {
      bytes.push(...encoder.encode("/Resources "), ...this.Resources);
    }
    if (this.CharProcs) {
      bytes.push(...encoder.encode("/CharProcs "), ...this.CharProcs);
    }

    if (this.FontBBox) {
      bytes.push(...encoder.encode("/FontBBox "), codes.L_BRACKET);
      this.FontBBox.forEach(x => bytes.push(...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
    }
    if (this.FontMatrix) {
      bytes.push(...encoder.encode("/FontMatrix "), codes.L_BRACKET);
      this.FontBBox.forEach(x => bytes.push(...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
    }
    
    //TODO: handle remaining properties if needed

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }

  decodeText(bytes: Uint8Array): string {
    if (this.toUtfCmap) {
      // 'to unicode' mapper found
      return this.toUtfCmap.hexBytesToUtfString(bytes);
    } 

    if (this.encoding?.charMap) { 
      // 'code to character' mappings found
      const charMap = this.encoding.charMap;
      let text = "";
      bytes.forEach(byte => text += charMap.get(byte) ?? " ");
      return text;
    }
      
    // no mappings are found in the resource dictionary.
    // use the default text decoder as a fallback (though it might fail)
    const decoder = bytes[0] === 254 && bytes[1] === 255 // UTF-16 Big Endian
      ? new TextDecoder("utf-16be")
      : new TextDecoder();
    const literal = decoder.decode(bytes);
    return literal || "";
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
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
          case "/Subtype":
            const subtype = parser.parseNameAt(i, true);
            if (subtype) {
              this.Subtype = subtype.value;
              i = subtype.end + 1; 
              break;        
            }
            throw new Error("Can't parse /Subtype property value");       
          case "/BaseFont":
            i = this.parseNameProp(name, parser, i);
            break;          
          case "/Encoding":
            const encodingPropType = parser.getValueTypeAt(i);
            if (encodingPropType === valueTypes.NAME) {
              i = this.parseNameProp(name, parser, i);
            } else if (encodingPropType === valueTypes.REF) {              
              i = this.parseRefProp(name, parser, i);
            } else {
              throw new Error(`Unsupported '${name}' property value type: '${encodingPropType}'`);
            }
            break;
          
          case "/ToUnicode":
            i = this.parseRefProp(name, parser, i);
            break; 
            
          case "/FirstChar":
          case "/LastChar":
            i = this.parseNumberProp(name, parser, i, false);
            break; 
            
          case "/FontBBox":
          case "/FontMatrix":
            i = this.parseNumberArrayProp(name, parser, i, true);
            break; 

          case "/Widths":
            const widthPropType = parser.getValueTypeAt(i);
            if (widthPropType === valueTypes.ARRAY) {
              i = this.parseNumberArrayProp(name, parser, i, true);
            } else if (widthPropType === valueTypes.REF) {              
              i = this.parseRefProp(name, parser, i);
            } else {
              throw new Error(`Unsupported '${name}' property value type: '${encodingPropType}'`);
            }
            break;
            
          case "/FontDescriptor":
            i = this.parseRefProp(name, parser, i);
            break; 

          // there is no need to parse font resources and char to stream maps
          // so just save the resource property source bytes
          // the source bytes will be used when converting the dict to bytes
          case "/Resources":  
          case "/CharProcs":  
            const excludedEntryType = parser.getValueTypeAt(i);
            if (excludedEntryType === valueTypes.REF) {              
              const excludedDictId = ObjectId.parseRef(parser, i);
              if (excludedDictId && parseInfo.parseInfoGetter) {
                this[name.slice(1)] = parser.sliceCharCodes(excludedDictId.start, excludedDictId.end);
                i = excludedDictId.end + 1;
                break;
              }              
              throw new Error(`Can't parse ${name} value reference`);
            } else if (excludedEntryType === valueTypes.DICTIONARY) { 
              const excludedDictBounds = parser.getDictBoundsAt(i); 
              if (excludedDictBounds) {
                this[name.slice(1)] = parser.sliceCharCodes(excludedDictBounds.start, excludedDictBounds.end);
                i = excludedDictBounds.end + 1;
                break;
              }
              throw new Error(`Can't parse ${name} dictionary bounds`); 
            }
            throw new Error(`Unsupported ${name} property value type: ${excludedEntryType}`);   

          // TODO: add cases for remaining properties if needed
          default:
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };

    if (this.Encoding && this.Encoding instanceof ObjectId) {
      const encodingParseInfo = parseInfo.parseInfoGetter(this.Encoding.id);
      const encodingDict = EncodingDict.parse(encodingParseInfo);
      this._encoding = encodingDict?.value;
    }

    if (this.ToUnicode) {      
      const toUtfParseInfo = parseInfo.parseInfoGetter(this.ToUnicode.id);
      const cmap = UnicodeCmapStream.parse(toUtfParseInfo);
      this._toUtfCmap = cmap?.value;
    }
    
    if (this.FontDescriptor) {      
      const descriptorParseInfo = parseInfo.parseInfoGetter(this.FontDescriptor.id);
      const descriptor = FontDescriptorDict.parse(descriptorParseInfo);
      this._descriptor = descriptor?.value;
    }

    if (this.Subtype !== "/Type1" 
      && this.Subtype !== "/Type3"
      && this.Subtype !== "/TrueType"
      && !(this.Subtype === "/Type0" && this._toUtfCmap)) {
      // TODO: add more supported types
      // Type1, Type3, TTF, Type0 with defined 'to Unicode' CMap are supported
      throw new Error(`Font type is not supported: ${this.Subtype}`);
    }
    
    if (this.Subtype === "/Type3" 
      && (!this.FontBBox 
        || !this.FontMatrix 
        || !this.Encoding
        || !this.FirstChar
        || !this.LastChar
        || !this.Widths
        || !this.CharProcs)) {
      throw new Error("Not all required properties parsed");
    }
  }
}
