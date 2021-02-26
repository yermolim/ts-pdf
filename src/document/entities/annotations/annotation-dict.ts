import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { DateString } from "../strings/date-string";
import { BorderStyleDict } from "../appearance/border-style-dict";
import { AppearanceDict } from "../appearance/appearance-dict";
import { OcGroupDict } from "../optional-content/oc-group-dict";
import { OcMembershipDict } from "../optional-content/oc-membership-dict";
import { BorderEffectDict } from "../appearance/border-effect-dict";
import { AnnotationType, dictTypes, Matrix, Rect, valueTypes } from "../../const";
import { ParseInfo, ParseResult } from "../../data-parser";
import { LiteralString } from "../strings/literal-string";
import { BorderArray } from "../appearance/border-array";
import { codes } from "../../codes";
import { CryptInfo } from "../../common-interfaces";
import { AppearanceStreamRenderer } from "../../render/appearance-stream-renderer";
import { BBox, getRandomUuid, RenderToSvgResult } from "../../../common";
import { Mat3, mat3From4Vec2, Vec2, Vec3, vecMinMax } from "../../../math";
import { XFormStream } from "../streams/x-form-stream";

export abstract class AnnotationDict extends PdfDict {
  isDeleted: boolean;
  name: string;
  pageRect: Rect;

  get apStream(): XFormStream {
    return this.AP?.getStream("/N");
  }

  //#region PDF properties

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

  //#endregion
  
  //#region svg render properties
  protected readonly _svgId = getRandomUuid();
  protected _svg: SVGGraphicsElement;
  protected _svgCopy: SVGGraphicsElement;
  protected _svgCopyUse: SVGUseElement;
  protected _svgContent: SVGGraphicsElement;
  protected _svgClipPaths: SVGClipPathElement[];
  protected _svgMatrix = new Mat3();
  protected _bBox: BBox;
  
  protected _moveStartTimer: number;
  protected _moveStartPoint = new Vec2();
  protected _moveMatrix = new Mat3();
  //#endregion

  protected constructor(subType: AnnotationType) {
    super(dictTypes.ANNOTATION);

    this.Subtype = subType;
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Subtype) {
      bytes.push(...encoder.encode("/Subtype"), ...encoder.encode(this.Subtype));
    }
    if (this.Rect) {
      bytes.push(
        ...encoder.encode("/Rect"), codes.L_BRACKET, 
        ...encoder.encode(this.Rect[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.Rect[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.Rect[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.Rect[3] + ""), codes.R_BRACKET,
      );
    }
    if (this.Contents) {
      bytes.push(...encoder.encode("/Contents"), ...this.Contents.toArray(cryptInfo));
    }
    if (this.P) {
      bytes.push(...encoder.encode("/P"), codes.WHITESPACE, ...this.P.toArray(cryptInfo));
    }
    if (this.NM) {
      bytes.push(...encoder.encode("/NM"), ...this.NM.toArray(cryptInfo));
    }
    if (this.M) {
      bytes.push(...encoder.encode("/M"), ...this.M.toArray(cryptInfo));
    }
    if (this.F) {
      bytes.push(...encoder.encode("/F"), ...encoder.encode(" " + this.F));
    }
    if (this.AP) {
      bytes.push(...encoder.encode("/AP"), ...this.AP.toArray(cryptInfo));
    }
    if (this.AS) {
      bytes.push(...encoder.encode("/AS"), ...encoder.encode(this.AS));
    }
    if (this.Border) {
      bytes.push(...encoder.encode("/Border"), ...this.Border.toArray(cryptInfo));
    }
    if (this.BS) {
      bytes.push(...encoder.encode("/BS"), ...this.BS.toArray(cryptInfo));
    }
    if (this.BE) {
      bytes.push(...encoder.encode("/BE"), ...this.BE.toArray(cryptInfo));
    }
    if (this.C) {
      bytes.push(...encoder.encode("/C"), codes.L_BRACKET);
      this.C.forEach(x => bytes.push(...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
    }
    if (this.StructParent) {
      bytes.push(...encoder.encode("/StructParent"), ...encoder.encode(" " + this.StructParent));
    }
    // TODO: handle remaining properties

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }  

  render(): RenderToSvgResult {
    if (!this._svg) {
      const rect = this.renderRect();   
      const {copy, use} = this.renderRectCopy(); 
      this._svg = rect;
      this._svgCopy = copy;
      this._svgCopyUse = use; 
    }

    this.updateRender();    

    return {
      svg: this._svg,
      clipPaths: this._svgClipPaths,
    };
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
              i = subtype.end + 1;
            } else {
              throw new Error("Can't parse /Subtype property value");
            }
            break;        
          case "/Contents":
            const contents = LiteralString.parse(parser, i, parseInfo.cryptInfo);
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
            const uniqueName = LiteralString.parse(parser, i, parseInfo.cryptInfo);
            if (uniqueName) {
              this.NM = uniqueName.value;
              i = uniqueName.end + 1;
            } else {              
              throw new Error("Can't parse /NM property value");
            }
            break;
          case "/M":
            const date = DateString.parse(parser, i, parseInfo.cryptInfo);
            if (date) {
              this.M = date.value;
              i = date.end + 1;    
              break;      
            } else {   
              const dateLiteral = LiteralString.parse(parser, i, parseInfo.cryptInfo);
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
                const apDict = AppearanceDict.parse({
                  parser, 
                  bounds: apDictBounds, 
                  parseInfoGetter: parseInfo.parseInfoGetter,
                });
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

    this.name = this.NM?.literal || getRandomUuid();
    this.pageRect = parseInfo.rect;

    return true;
  }

  //#region protected render methods
  protected renderRectCopy(): {copy: SVGGraphicsElement; use: SVGUseElement} {
    const copy = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    const copyDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const copySymbol = document.createElementNS("http://www.w3.org/2000/svg", "symbol");
    copySymbol.id = this._svgId + "_symbol";
    const copySymbolUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
    copySymbolUse.setAttribute("href", `#${this._svgId}`);
    copySymbolUse.setAttribute("viewBox", 
      `${this.pageRect[0]} ${this.pageRect[1]} ${this.pageRect[2]} ${this.pageRect[3]}`);
    copySymbol.append(copySymbolUse);
    copyDefs.append(copySymbol);

    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#${this._svgId}_symbol`);
    use.setAttribute("opacity", "0.2");
    
    copy.append(copyDefs, use);

    return {copy, use};
  }

  protected renderRect(): SVGGraphicsElement {    
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "g");
    rect.id = this._svgId;
    rect.classList.add("svg-annotation-rect");
    rect.setAttribute("data-annotation-name", this.name);    
    rect.addEventListener("pointerdown", this.onRectPointerDown);

    return rect;
  }

  protected renderRectBg(): SVGGraphicsElement {
    const bg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    bg.classList.add("svg-rect-bg");
    bg.setAttribute("data-annotation-name", this.name);
    bg.setAttribute("x", this.Rect[0] + "");
    bg.setAttribute("y", this.Rect[1] + "");
    bg.setAttribute("width", this.Rect[2] - this.Rect[0] + "");
    bg.setAttribute("height", this.Rect[3] - this.Rect[1] + "");
    bg.setAttribute("fill", "transparent");  

    return bg;
  }

  protected renderAP(): RenderToSvgResult {
    const stream = this.apStream;
    if (stream) {
      try {
        const renderer = new AppearanceStreamRenderer(stream, this.Rect, this.name);
        return renderer.render();
      }
      catch (e) {
        console.log(`Annotation stream render error: ${e.message}`);
      }
    }
    return null;    
  }

  protected renderContent(): RenderToSvgResult {
    return null;
  } 

  protected renderHandles(): SVGGraphicsElement[] {    
    const minRectHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    minRectHandle.classList.add("svg-rect-handle");
    minRectHandle.setAttribute("data-handle-name", "min");
    minRectHandle.setAttribute("cx", this.Rect[0] + "");
    minRectHandle.setAttribute("cy", this.Rect[1] + "");    
    const maxRectHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    maxRectHandle.classList.add("svg-rect-handle");
    minRectHandle.setAttribute("data-handle-name", "max");
    maxRectHandle.setAttribute("cx", this.Rect[2] + "");
    maxRectHandle.setAttribute("cy", this.Rect[3] + "");

    return [minRectHandle, maxRectHandle];
  } 

  protected updateRender() {
    this._svg.innerHTML = "";

    const content = this.renderContent() || this.renderAP();
    if (!content) { 
      this._svgContent = null;
      this._svgClipPaths = null;
      return;
    }    
    
    const bg = this.renderRectBg();
    const handles = this.renderHandles(); 

    this._svg.append(bg, content.svg, ...handles);  
    this._svgContent = content.svg;
    this._svgClipPaths = content.clipPaths;
  }

  protected applyRectTransform(matrix: Mat3) {  
    // DEBUG   
    // matrix = Mat3.buildRotation(-30 * Math.PI / 180);

    // get current bounding box (not axis-aligned)
    let bBoxLL: Vec2;
    let bBoxLR: Vec2;
    let bBoxUR: Vec2;
    let bBoxUL: Vec2;
    if (this._bBox) {
      // use the saved bounding box if present
      bBoxLL = this._bBox.ll;
      bBoxLR = this._bBox.lr;
      bBoxUR = this._bBox.ur;
      bBoxUL = this._bBox.ul;
    } else if (this.apStream) {
      // or calculate a bounding box using the appearance stream data if present
      // get the transformed bounding box from the appearance stream
      const {ll: apTrBoxLL, lr: apTrBoxLR, ur: apTrBoxUR, ul: apTrBoxUL} =
        this.apStream.transformedBBox;  
      // compare it with the Rect
      const {min: boxMin, max: boxMax} = 
        vecMinMax(apTrBoxLL, apTrBoxLR, apTrBoxUR, apTrBoxUL);
      const rectMin = new Vec2(this.Rect[0], this.Rect[1]);
      const rectMax = new Vec2(this.Rect[2], this.Rect[3]);    
      // transform the appearance stream bounding box to match the Rect scale and position
      const mat = mat3From4Vec2(boxMin, boxMax, rectMin, rectMax, true);
      console.log(mat);
      bBoxLL = apTrBoxLL.applyMat3(mat);
      bBoxLR = apTrBoxLR.applyMat3(mat);
      bBoxUR = apTrBoxUR.applyMat3(mat);
      bBoxUL = apTrBoxUL.applyMat3(mat);
    } else {  
      // else use the Rect property data
      bBoxLL = new Vec2(this.Rect[0], this.Rect[1]);
      bBoxLR = new Vec2(this.Rect[2], this.Rect[1]);
      bBoxUR = new Vec2(this.Rect[2], this.Rect[3]);
      bBoxUL = new Vec2(this.Rect[0], this.Rect[3]);
    }

    // translate the bounding box to origin, apply the transformation and translate it back
    const bBoxCenter = Vec2.add(bBoxLL, bBoxUR).multiplyByScalar(0.5);
    const bBoxMatrix = new Mat3()
      .applyTranslation(-bBoxCenter.x, -bBoxCenter.y)
      .multiply(matrix)
      .applyTranslation(bBoxCenter.x, bBoxCenter.y);    
    const trBBoxLL = Vec2.applyMat3(bBoxLL, bBoxMatrix);
    const trBBoxLR = Vec2.applyMat3(bBoxLR, bBoxMatrix);  
    const trBBoxUR = Vec2.applyMat3(bBoxUR, bBoxMatrix);
    const trBBoxUL = Vec2.applyMat3(bBoxUL, bBoxMatrix);

    // store the new bounding box
    this._bBox = {
      ll: trBBoxLL,
      lr: trBBoxLR,
      ur: trBBoxUR,
      ul: trBBoxUL,
    };

    // get an axis-aligned bounding box and assign it to the Rect property
    const {min: newRectMin, max: newRectMax} = 
      vecMinMax(trBBoxLL, trBBoxLR, trBBoxUR, trBBoxUL);
    this.Rect = [newRectMin.x, newRectMin.y, newRectMax.x, newRectMax.y];
    
    // if the annotation has a content stream, update its matrix
    const stream = this.apStream;
    if (stream) {  
      // get transformed appearance stream bounding box  
      const { ll: apQuadLL, ur: apQuadUR} = stream.transformedBBox;
      // translate the stream content to origin, apply the transformation and translate it back
      const apQuadCenter = Vec2.add(apQuadLL, apQuadUR).multiplyByScalar(0.5);
      const newApMatrix = stream.matrix
        .applyTranslation(-apQuadCenter.x, -apQuadCenter.y)
        .multiply(matrix)
        .applyTranslation(apQuadCenter.x, apQuadCenter.y);
      this.apStream.matrix = newApMatrix;
    }

    this.updateRender();
  }

  protected applyHandleTransform(mat: Mat3, name: string) {
    // TODO: implement
  }
  //#endregion

  //#region event handlers 
  protected onRectPointerDown = (e: PointerEvent) => {    
    document.addEventListener("pointerup", this.onRectPointerUp);
    document.addEventListener("pointerout", this.onRectPointerUp);    

    // set timeout to prevent an accidental annotation translation
    this._moveStartTimer = setTimeout(() => {
      this._moveStartTimer = null;
      
      this._svg.after(this._svgCopy);
      this._moveStartPoint.set(e.clientX, e.clientY);
      document.addEventListener("pointermove", this.onRectPointerMove);
    }, 200);
  };

  protected onRectPointerMove = (e: PointerEvent) => {
    this._moveMatrix.reset()
      .applyTranslation(e.clientX - this._moveStartPoint.x, -1 * (e.clientY - this._moveStartPoint.y));
    this._svgCopyUse.setAttribute("transform", 
      `matrix(${this._moveMatrix.toFloatShortArray().join(" ")})`);
  };
  
  protected onRectPointerUp = () => {
    document.removeEventListener("pointermove", this.onRectPointerMove);
    document.removeEventListener("pointerup", this.onRectPointerUp);
    document.removeEventListener("pointerout", this.onRectPointerUp);

    if (this._moveStartTimer) {
      clearTimeout(this._moveStartTimer);
      this._moveStartTimer = null;
      return;
    }
    
    this._svgCopy.remove();
    this._svgCopyUse.setAttribute("transform", "matrix(1 0 0 1 0 0)");

    this.applyRectTransform(this._moveMatrix);
    this._moveMatrix.reset();
  };
  
  protected onHandlePointerDown = (e: PointerEvent) => {

  };

  protected onHandlePointerMove = (e: PointerEvent) => {

  };
  
  protected onHandlePointerUp = (e: PointerEvent) => {

  };
  //#endregion
}
