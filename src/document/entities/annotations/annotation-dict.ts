import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { DateString } from "../strings/date-string";
import { BorderStyleDict } from "../appearance/border-style-dict";
import { AppearanceDict } from "../appearance/appearance-dict";
import { BorderEffectDict } from "../appearance/border-effect-dict";
import { AnnotationType, dictTypes, valueTypes } from "../../const";
import { ParseInfo, ParseResult } from "../../data-parser";
import { LiteralString } from "../strings/literal-string";
import { BorderArray } from "../appearance/border-array";
import { codes } from "../../codes";
import { CryptInfo, Rect } from "../../common-interfaces";
import { AppearanceStreamRenderer } from "../../render/appearance-stream-renderer";
import { BBox, getRandomUuid, RenderToSvgResult } from "../../../common";
import { Mat3, mat3From4Vec2, Vec2, vecMinMax } from "../../../math";
import { XFormStream } from "../streams/x-form-stream";
import { AnnotationDto } from "../../../annotator/serialization";

export abstract class AnnotationDict extends PdfDict {
  $name: string;
  $pageId: number;
  $pageRect: Rect;
  $translationEnabled: boolean;

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
  F = 4;
  
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
  C: readonly number[];

  /** (Required if the annotation is a structural content item; PDF 1.3+) 
   * The integer key of the annotation’s entry in the structural parent tree */
  StructParent: number;

  // /** (Optional; PDF 1.5+) An optional content group or optional content membership dictionary
  //  *  specifying the optional content properties for the annotation */
  // OC: OcMembershipDict | OcGroupDict;

  //#endregion

  protected _apStream: XFormStream;
  get apStream(): XFormStream {
    if (!this._apStream) {
      this._apStream = [...this.AP?.getStreams()][0];
    }
    return this._apStream;
  }
  set apStream(value: XFormStream)  {
    this._apStream = value;
    this._edited = true;
  }

  //#region edit-related properties
  protected _bBox: BBox;
  
  protected _transformationTimer: number; 
  protected _transformationMatrix = new Mat3(); 
  protected _transformationPoint = new Vec2();

  protected _currentAngle = 0; 
  protected _boxX = new Vec2();
  protected _boxY = new Vec2();
  protected _boxXLength: number;
  protected _boxYLength: number;
  //#endregion

  //#region render-related properties
  protected readonly _svgId = getRandomUuid();
  protected _svg: SVGGraphicsElement;
  protected _svgBox: SVGGraphicsElement;
  protected _svgContentCopy: SVGGraphicsElement;
  protected _svgContentCopyUse: SVGUseElement;
  protected _svgContent: SVGGraphicsElement;
  protected _svgClipPaths: SVGClipPathElement[];
  protected _lastRenderResult: RenderToSvgResult;
  get lastRenderResult(): RenderToSvgResult {
    return this._lastRenderResult;
  }
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
      bytes.push(...encoder.encode("/Subtype "), ...encoder.encode(this.Subtype));
    }
    if (this.Rect) {
      bytes.push(
        ...encoder.encode("/Rect "), codes.L_BRACKET, 
        ...encoder.encode(this.Rect[0] + ""), codes.WHITESPACE,
        ...encoder.encode(this.Rect[1] + ""), codes.WHITESPACE,
        ...encoder.encode(this.Rect[2] + ""), codes.WHITESPACE, 
        ...encoder.encode(this.Rect[3] + ""), codes.R_BRACKET,
      );
    }
    if (this.Contents) {
      bytes.push(...encoder.encode("/Contents "), ...this.Contents.toArray(cryptInfo));
    }
    if (this.P) {
      bytes.push(...encoder.encode("/P "), codes.WHITESPACE, ...this.P.toArray(cryptInfo));
    }
    if (this.NM) {
      bytes.push(...encoder.encode("/NM "), ...this.NM.toArray(cryptInfo));
    }
    if (this.M) {
      bytes.push(...encoder.encode("/M "), ...this.M.toArray(cryptInfo));
    }
    if (this.F) {
      bytes.push(...encoder.encode("/F "), ...encoder.encode(" " + this.F));
    }
    // if (this.AP) {
    //   bytes.push(...encoder.encode("/AP "), ...this.AP.toArray(cryptInfo));
    // }
    if (this.AS) {
      bytes.push(...encoder.encode("/AS "), ...encoder.encode(this.AS));
    }
    if (this.Border) {
      bytes.push(...encoder.encode("/Border "), ...this.Border.toArray(cryptInfo));
    }
    if (this.BS) {
      bytes.push(...encoder.encode("/BS "), ...this.BS.toArray(cryptInfo));
    }
    if (this.BE) {
      bytes.push(...encoder.encode("/BE "), ...this.BE.toArray(cryptInfo));
    }
    if (this.C) {
      bytes.push(...encoder.encode("/C "), codes.L_BRACKET);
      this.C.forEach(x => bytes.push(...encoder.encode(" " + x)));
      bytes.push(codes.R_BRACKET);
    }
    if (this.StructParent) {
      bytes.push(...encoder.encode("/StructParent "), ...encoder.encode(" " + this.StructParent));
    }

    if (this.apStream) {
      if (!this.AP) {
        this.AP = new AppearanceDict();
      }
      const apStreamRef = this.apStream.ref;
      if (!apStreamRef) {
        throw new Error("Appearance stream has no reference");
      }
      this.AP.N = ObjectId.fromRef(apStreamRef);
      this.AP.R = null;
      this.AP.D = null;
      this.AP.clearStreams();
      this.AP.setStream("/N", this.apStream);
      bytes.push(...encoder.encode("/AP "), ...this.AP.toArray(cryptInfo));
    }

    // TODO: handle remaining properties

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }  

  async renderAsync(): Promise<RenderToSvgResult> {
    if (!this._svg) {
      this._svg = this.renderMainElement();
    }

    await this.updateRenderAsync(); 

    const renderResult: RenderToSvgResult = {
      svg: this._svg,
      clipPaths: this._svgClipPaths,      
      tempCopy: this._svgContentCopy,
      tempCopyUse: this._svgContentCopyUse,
    };
    this._lastRenderResult = renderResult;
    return renderResult;
  }  
  
  applyCommonTransform(matrix: Mat3) {
    this.applyRectTransform(matrix);
    
    // if the annotation has a content stream, update its matrix
    const dict = <AnnotationDict>this._proxy || this;
    const stream = dict.apStream;
    if (stream) {
      const newApMatrix = stream.matrix.multiply(matrix);
      dict.apStream.matrix = newApMatrix;
    }

    dict.M = DateString.fromDate(new Date());
  }

  moveTo(pageX: number, pageY: number) {
    const width = this.Rect[2] - this.Rect[0];
    const height = this.Rect[3] - this.Rect[1];
    const x = pageX - width / 2;
    const y = pageY - height / 2;
    const mat = Mat3.buildTranslate(x, y);
    this.applyCommonTransform(mat);
  }

  toDto(): AnnotationDto {
    return {
      annotationType: "/Ink",
      uuid: this.$name,
      pageId: this.$pageId,

      dateCreated: this["CreationDate"].date.toISOString() || new Date().toISOString(),
      dateModified: this.M 
        ? this.M instanceof LiteralString
          ? this.M.literal
          : this.M.date.toISOString()
        : new Date().toISOString(),
      author: this["T"]?.literal,

      rect: this.Rect,
      matrix: this.apStream?.Matrix,
    };
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected parseProps(parseInfo: ParseInfo) {
    super.parseProps(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
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
          
          case "/Rect":
            i = this.parseNumberArrayProp(name, parser, i, true);
            break;
          
          case "/P":
            i = this.parseRefProp(name, parser, i);
            break;
          
          case "/Contents":
          case "/NM":
            i = this.parseLiteralProp(name, parser, i, parseInfo.cryptInfo);
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
       
          case "/C":
            i = this.parseNumberArrayProp(name, parser, i, true);
            break;
          
          case "/F":
          case "/StructParent":
            i = this.parseNumberProp(name, parser, i, false);
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
            i = this.parseNameProp(name, parser, i);
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
      throw new Error("Not all required properties parsed");
    }

    this.$name = this.NM?.literal || getRandomUuid();
    this.$pageRect = parseInfo.rect;
  }

  //#region protected render methods

  //#region common methods used for rendering purposes
  protected getCurrentRotation(): number {
    // TODO: try to implement getting rotation without using AP (if possible)
    const matrix = this.apStream?.matrix;
    if (!matrix) {
      return 0;
    }
    const {r} = matrix.getTRS();
    return r;
  }

  protected getLocalBB(): BBox {    
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
    
    this._bBox = {
      ll: bBoxLL,
      lr: bBoxLR,
      ur: bBoxUR,
      ul: bBoxUL,
    }; 

    return this._bBox;
  }  

  protected applyRectTransform(matrix: Mat3) {
    const dict = <AnnotationDict>this._proxy || this;

    // transform current bounding box (not axis-aligned)
    const bBox =  dict.getLocalBB();
    bBox.ll.applyMat3(matrix);
    bBox.lr.applyMat3(matrix);
    bBox.ur.applyMat3(matrix);
    bBox.ul.applyMat3(matrix);

    // get an axis-aligned bounding box and assign it to the Rect property
    const {min: newRectMin, max: newRectMax} = 
      vecMinMax(bBox.ll, bBox.lr, bBox.ur, bBox.ul);
    dict.Rect = [newRectMin.x, newRectMin.y, newRectMax.x, newRectMax.y];
  }

  /**
   * get 2D vector with a position of the specified point in page coords 
   * (0, 0 is lower-left corner of the page)
   * @param clientX 
   * @param clientY 
   */
  protected convertClientCoordsToPage(clientX: number, clientY: number): Vec2 {
    // html coords (0,0 is top-left corner)
    const {x, y, width, height} = this._svgBox.getBoundingClientRect();
    const rectMinScaled = new Vec2(x, y);
    const rectMaxScaled = new Vec2(x + width, y + height);
    const pageScale = (rectMaxScaled.x - rectMinScaled.x) / (this.Rect[2] - this.Rect[0]);
    // the lower-left corner of the page. keep in mind that PDF Rect uses inversed coords
    const pageLowerLeft = new Vec2(x - this.Rect[0] * pageScale, y + height + (this.Rect[1] * pageScale));
    // invert Y coord
    const position = new Vec2(
      (clientX - pageLowerLeft.x) / pageScale,
      (pageLowerLeft.y - clientY) / pageScale,
    );

    return position;
  }
  
  protected convertPageCoordsToClient(pageX: number, pageY: number): Vec2 {
    // html coords (0,0 is top-left corner)
    const {x, y, width, height} = this._svgBox.getBoundingClientRect();
    const rectMinScaled = new Vec2(x, y);
    const rectMaxScaled = new Vec2(x + width, y + height);
    const pageScale = (rectMaxScaled.x - rectMinScaled.x) / (this.Rect[2] - this.Rect[0]);
    // the lower-left corner of the page. keep in mind that PDF Rect uses inversed coords
    const pageLowerLeft = new Vec2(x - this.Rect[0] * pageScale, y + height + (this.Rect[1] * pageScale));
    // invert Y coord
    const position = new Vec2(
      pageLowerLeft.x + (pageX * pageScale),
      pageLowerLeft.y - (pageY * pageScale),
    );

    return position;
  }
  //#endregion

  //#region annotation container render
  protected renderRect(): SVGGraphicsElement {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.classList.add("svg-annot-rect");
    rect.setAttribute("data-annotation-name", this.$name);
    rect.setAttribute("x", this.Rect[0] + "");
    rect.setAttribute("y", this.Rect[1] + "");
    rect.setAttribute("width", this.Rect[2] - this.Rect[0] + "");
    rect.setAttribute("height", this.Rect[3] - this.Rect[1] + "");

    return rect;
  }
  
  protected renderBox(): SVGGraphicsElement {
    const {ll, lr, ur, ul} = this.getLocalBB();
    const boxPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    boxPath.classList.add("svg-annot-box");
    boxPath.setAttribute("data-annotation-name", this.$name);
    boxPath.setAttribute("d", `M ${ll.x} ${ll.y} L ${lr.x} ${lr.y} L ${ur.x} ${ur.y} L ${ul.x} ${ul.y} Z`);

    return boxPath;
  }

  protected renderMainElement(): SVGGraphicsElement {    
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "g");
    rect.classList.add("svg-annotation");
    rect.setAttribute("data-annotation-name", this.$name);    
    rect.addEventListener("pointerdown", this.onRectPointerDown);

    return rect;
  }
  //#endregion

  //#region annotation content render
  /**
   * default annotation content renderer using the appearance stream
   */
  protected async renderApAsync(): Promise<RenderToSvgResult> {
    const stream = this.apStream;
    if (stream) {
      try {
        const renderer = new AppearanceStreamRenderer(stream, this.Rect, this.$name);
        return await renderer.renderAsync();
      }
      catch (e) {
        console.log(`Annotation stream render error: ${e.message}`);
      }
    }
    return null;    
  }

  /**
   * override in subclass to apply a custom annotation content renderer
   */
  protected renderContent(): RenderToSvgResult {
    return null;
  }   

  protected renderContentCopy(): {copy: SVGGraphicsElement; use: SVGUseElement} {
    const copy = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    const copyDefs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const copySymbol = document.createElementNS("http://www.w3.org/2000/svg", "symbol");
    copySymbol.id = this._svgId + "_symbol";
    const copySymbolUse = document.createElementNS("http://www.w3.org/2000/svg", "use");
    copySymbolUse.setAttribute("href", `#${this._svgId}`);
    if (this.$pageRect) {
      copySymbolUse.setAttribute("viewBox", 
        `${this.$pageRect[0]} ${this.$pageRect[1]} ${this.$pageRect[2]} ${this.$pageRect[3]}`);
    }
    copySymbol.append(copySymbolUse);
    copyDefs.append(copySymbol);

    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttribute("href", `#${this._svgId}_symbol`);
    use.setAttribute("opacity", "0.2");
    
    copy.append(copyDefs, use);

    return {copy, use};
  }
  //#endregion

  //#region render of the annotation control handles 
  protected renderScaleHandles(): SVGGraphicsElement[] { 
    const bBox = this.getLocalBB();

    const handles: SVGGraphicsElement[] = [];
    ["ll", "lr", "ur", "ul"].forEach(x => {
      const handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      handle.classList.add("svg-annot-handle-scale");
      handle.setAttribute("data-handle-name", x);
      handle.setAttribute("cx", bBox[x].x + "");
      handle.setAttribute("cy", bBox[x].y + ""); 
      handle.addEventListener("pointerdown", this.onScaleHandlePointerDown); 
      handles.push(handle);   
    });

    return handles;
  } 
  
  protected renderRotationHandle(): SVGGraphicsElement { 
    const centerX = (this.Rect[0] + this.Rect[2]) / 2;
    const centerY = (this.Rect[1] + this.Rect[3]) / 2;
    const currentRotation = this.getCurrentRotation();

    const rotationGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    rotationGroup.classList.add("svg-annot-rotation");
    rotationGroup.setAttribute("data-handle-name", "center");  
     
    const rotationGroupCircle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    rotationGroupCircle.classList.add("circle", "dashed");
    rotationGroupCircle.setAttribute("cx", centerX + "");
    rotationGroupCircle.setAttribute("cy", centerY + "");

    const handleMatrix = new Mat3()
      .applyTranslation(-centerX, -centerY + 35)
      .applyRotation(currentRotation)
      .applyTranslation(centerX, centerY);
    const handleCenter = new Vec2(centerX, centerY).applyMat3(handleMatrix);
    
    const rotationGroupLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    rotationGroupLine.classList.add("dashed");
    rotationGroupLine.setAttribute("x1", centerX + "");
    rotationGroupLine.setAttribute("y1", centerY + "");
    rotationGroupLine.setAttribute("x2", handleCenter.x + "");
    rotationGroupLine.setAttribute("y2", handleCenter.y + "");
    
    const centerRectHandle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    centerRectHandle.classList.add("svg-annot-handle-rotation");
    centerRectHandle.setAttribute("data-handle-name", "center");
    centerRectHandle.setAttribute("cx", handleCenter.x + "");
    centerRectHandle.setAttribute("cy", handleCenter.y + "");
    centerRectHandle.addEventListener("pointerdown", this.onRotationHandlePointerDown);

    rotationGroup.append(rotationGroupCircle, rotationGroupLine, centerRectHandle);
    return rotationGroup;
  } 

  /**
   * override in subclass to apply a custom annotation handles renderer
   */
  protected renderHandles(): SVGGraphicsElement[] {   
    return [...this.renderScaleHandles(), this.renderRotationHandle()];
  } 
  //#endregion

  protected async updateRenderAsync() {
    this._svg.innerHTML = "";

    const contentResult = this.renderContent() || await this.renderApAsync();
    if (!contentResult) { 
      this._svgBox = null;
      this._svgContent = null;
      this._svgContentCopy = null;
      this._svgContentCopyUse = null;
      this._svgClipPaths = null;
      return;
    }  
    const content = contentResult.svg;
    content.id = this._svgId;
    content.classList.add("svg-annotation-content");
    content.setAttribute("data-annotation-name", this.$name); 
    const {copy, use} = this.renderContentCopy(); 
    
    const rect = this.renderRect();
    const box = this.renderBox();
    const handles = this.renderHandles(); 

    this._svg.append(rect, box, contentResult.svg, ...handles);  

    this._svgBox = box;
    this._svgContent = content;
    this._svgContentCopy = copy;
    this._svgContentCopyUse = use; 
    this._svgClipPaths = contentResult.clipPaths;
  }
  //#endregion

  //#region event handlers 

  //#region translation handlers
  protected onRectPointerDown = (e: PointerEvent) => { 
    if (!this.$translationEnabled || !e.isPrimary) {
      return;
    }

    document.addEventListener("pointerup", this.onRectPointerUp);
    document.addEventListener("pointerout", this.onRectPointerUp);  

    // set timeout to prevent an accidental annotation translation
    this._transformationTimer = setTimeout(() => {
      this._transformationTimer = null;      
      this._svg.after(this._svgContentCopy);
      this._transformationPoint.setFromVec2(this.convertClientCoordsToPage(e.clientX, e.clientY));
      document.addEventListener("pointermove", this.onRectPointerMove);
    }, 200);
  };

  protected onRectPointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const current = this.convertClientCoordsToPage(e.clientX, e.clientY);
    this._transformationMatrix.reset()
      .applyTranslation(current.x - this._transformationPoint.x, 
        current.y - this._transformationPoint.y);
    this._svgContentCopyUse.setAttribute("transform", 
      `matrix(${this._transformationMatrix.toFloatShortArray().join(" ")})`);
  };
  
  protected onRectPointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    document.removeEventListener("pointermove", this.onRectPointerMove);
    document.removeEventListener("pointerup", this.onRectPointerUp);
    document.removeEventListener("pointerout", this.onRectPointerUp);

    if (this._transformationTimer) {
      clearTimeout(this._transformationTimer);
      this._transformationTimer = null;
      return;
    }
    
    this._svgContentCopy.remove();
    this._svgContentCopyUse.setAttribute("transform", "matrix(1 0 0 1 0 0)");

    this.applyCommonTransform(this._transformationMatrix);
    this._transformationMatrix.reset();

    this.updateRenderAsync();
  };
  //#endregion
  
  //#region rotation handlers
  protected onRotationHandlePointerDown = (e: PointerEvent) => {    
    if (!e.isPrimary) {
      return;
    }

    document.addEventListener("pointerup", this.onRotationHandlePointerUp);
    document.addEventListener("pointerout", this.onRotationHandlePointerUp);    

    // set timeout to prevent an accidental annotation rotation
    this._transformationTimer = setTimeout(() => {
      this._transformationTimer = null;      
      this._svg.after(this._svgContentCopy);
      document.addEventListener("pointermove", this.onRotationHandlePointerMove);
    }, 200);

    e.stopPropagation();
  };

  protected onRotationHandlePointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const centerX = (this.Rect[0] + this.Rect[2]) / 2;
    const centerY = (this.Rect[1] + this.Rect[3]) / 2;
    const clientCenter = this.convertPageCoordsToClient(centerX, centerY);
    const currentRotation = this.getCurrentRotation();
    const angle = Math.atan2(
      e.clientY - clientCenter.y, 
      e.clientX - clientCenter.x
    ) + Math.PI / 2 - currentRotation;
    this._currentAngle = angle;
    this._transformationMatrix.reset()
      .applyTranslation(-centerX, -centerY)
      .applyRotation(angle)
      .applyTranslation(centerX, centerY);
    this._svgContentCopyUse.setAttribute("transform", 
      `matrix(${this._transformationMatrix.toFloatShortArray().join(" ")})`);
  };
  
  protected onRotationHandlePointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    document.removeEventListener("pointermove", this.onRotationHandlePointerMove);
    document.removeEventListener("pointerup", this.onRotationHandlePointerUp);
    document.removeEventListener("pointerout", this.onRotationHandlePointerUp);

    if (this._transformationTimer) {
      clearTimeout(this._transformationTimer);
      this._transformationTimer = null;
      return;
    }
    
    this._svgContentCopy.remove();
    this._svgContentCopyUse.setAttribute("transform", "matrix(1 0 0 1 0 0)");

    this.applyCommonTransform(this._transformationMatrix);
    this._transformationMatrix.reset();

    this.updateRenderAsync();
  };
  //#endregion
  
  //#region scale handlers
  protected onScaleHandlePointerDown = (e: PointerEvent) => { 
    if (!e.isPrimary) {
      return;
    }

    document.addEventListener("pointerup", this.onScaleHandlePointerUp);
    document.addEventListener("pointerout", this.onScaleHandlePointerUp); 

    const target = e.target as HTMLElement;

    const {ll, lr, ur, ul} = this.getLocalBB();
    const handleName = target.dataset["handleName"];
    switch (handleName) {
      case "ll": 
        this._transformationPoint.setFromVec2(ur);
        this._boxX.setFromVec2(ul).substract(ur);
        this._boxY.setFromVec2(lr).substract(ur);      
        break;
      case "lr":
        this._transformationPoint.setFromVec2(ul);
        this._boxX.setFromVec2(ur).substract(ul);
        this._boxY.setFromVec2(ll).substract(ul); 
        break;
      case "ur":
        this._transformationPoint.setFromVec2(ll); 
        this._boxX.setFromVec2(lr).substract(ll);
        this._boxY.setFromVec2(ul).substract(ll);
        break;
      case "ul":
        this._transformationPoint.setFromVec2(lr); 
        this._boxX.setFromVec2(ll).substract(lr);
        this._boxY.setFromVec2(ur).substract(lr);
        break;
      default:
        // execution should not reach here
        throw new Error(`Invalid handle name: ${handleName}`);
    }
    this._boxXLength = this._boxX.getMagnitude();
    this._boxYLength = this._boxY.getMagnitude();

    // set timeout to prevent an accidental annotation rotation
    this._transformationTimer = setTimeout(() => {
      this._transformationTimer = null;      
      this._svg.after(this._svgContentCopy);
      document.addEventListener("pointermove", this.onScaleHandlePointerMove);
    }, 200);

    e.stopPropagation();
  };

  protected onScaleHandlePointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const current = this.convertClientCoordsToPage(e.clientX, e.clientY)
      .substract(this._transformationPoint);
    const currentLength = current.getMagnitude();

    const cos = Math.abs(current.dotProduct(this._boxX)) / currentLength / this._boxXLength;
    const pXLength = cos * currentLength;
    const pYLength = Math.sqrt(currentLength * currentLength - pXLength * pXLength);    

    const scaleX = pXLength / this._boxXLength;
    const scaleY = pYLength / this._boxYLength;
    
    const centerX = (this.Rect[0] + this.Rect[2]) / 2;
    const centerY = (this.Rect[1] + this.Rect[3]) / 2;
    const currentRotation = this.getCurrentRotation();

    this._transformationMatrix.reset()
      .applyTranslation(-centerX, -centerY)
      .applyRotation(-currentRotation)
      .applyScaling(scaleX, scaleY)
      .applyRotation(currentRotation)
      .applyTranslation(centerX, centerY);
    const translation = this._transformationPoint.clone().substract(
      this._transformationPoint.clone().applyMat3(this._transformationMatrix));
    this._transformationMatrix.applyTranslation(translation.x, translation.y);
    
    this._svgContentCopyUse.setAttribute("transform", 
      `matrix(${this._transformationMatrix.toFloatShortArray().join(" ")})`);
  };
  
  protected onScaleHandlePointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    document.removeEventListener("pointermove", this.onScaleHandlePointerMove);
    document.removeEventListener("pointerup", this.onScaleHandlePointerUp);
    document.removeEventListener("pointerout", this.onScaleHandlePointerUp);

    if (this._transformationTimer) {
      clearTimeout(this._transformationTimer);
      this._transformationTimer = null;
      return;
    }
    
    this._svgContentCopy.remove();
    this._svgContentCopyUse.setAttribute("transform", "matrix(1 0 0 1 0 0)");

    this.applyCommonTransform(this._transformationMatrix);
    this._transformationMatrix.reset();

    this.updateRenderAsync();
  };
  //#endregion

  //#endregion
}
