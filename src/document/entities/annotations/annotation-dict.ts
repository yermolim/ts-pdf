import { Mat3, Vec2 } from "mathador";

import { Quadruple } from "../../../common/types";
import { getRandomUuid } from "../../../common/uuid";
import { RenderableAnnotation, AnnotationRenderResult, 
  AnnotationDto } from "../../../common/annotation";
import { BBox } from "../../../drawing/utils";

import { CryptInfo } from "../../encryption/interfaces";
import { AnnotationType, dictTypes, valueTypes } from "../../spec-constants";
import { ParserResult } from "../../data-parse/data-parser";
import { ParserInfo } from "../../data-parse/parser-info";

import { AppearanceStreamRenderer, AppearanceRenderResult } 
  from "../../render/appearance-stream-renderer";

import { ObjectId } from "../core/object-id";
import { PdfDict } from "../core/pdf-dict";
import { DateString } from "../strings/date-string";
import { LiteralString } from "../strings/literal-string";
import { BorderStyleDict } from "../appearance/border-style-dict";
import { AppearanceDict } from "../appearance/appearance-dict";
import { BorderEffectDict } from "../appearance/border-effect-dict";
import { BorderArray } from "../appearance/border-array";
import { XFormStream } from "../streams/x-form-stream";

export abstract class AnnotationDict extends PdfDict implements RenderableAnnotation {
  /**annotation name (should be a uuid) */
  $name: string;
  /**internal pdf object id of the parent page */
  $pageId: number;
  $translationEnabled: boolean;

  /**optional action callback which is called on render update event */
  $onRenderUpdatedAction: () => void;

  /**optional action callback which is called on 'pointer down' event */
  $onPointerDownAction: (e: PointerEvent) => void;  
  /**optional action callback which is called on 'pointer enter' event */
  $onPointerEnterAction: (e: PointerEvent) => void;
  /**optional action callback which is called on 'pointer leave' event */
  $onPointerLeaveAction: (e: PointerEvent) => void;

  //#region PDF properties

  /** (Required) The type of annotation that this dictionary describes */
  readonly Subtype: AnnotationType;
  
  /** (Required) The annotation rectangle, 
   * defining the location of the annotation on the page in default user space units */
  Rect: Quadruple;

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
      const streams = this.AP?.getStreams();
      if (streams) {
        this._apStream = [...streams][0];
      }
    }
    return this._apStream;
  }
  set apStream(value: XFormStream)  {
    this._apStream = value;
    this._edited = true;
  }

  //#region edit-related properties
  /**the current annotation bounding box (unlike Rect property, not necessarily axis-aligned) */
  protected _bBox: BBox;

  protected _transformationPromise: Promise<void>;  
  protected _transformationTimer: number; 
  protected _tempX: number;
  protected _tempY: number;
  protected _currentAngle = 0;   
  protected _moved: boolean;

  /**temp object used for calculations to prevent unnecessary objects creation overhead */
  protected _tempTransformationMatrix = new Mat3(); 
  /**temp object used for calculations to prevent unnecessary objects creation overhead */
  protected _tempStartPoint = new Vec2();

  /**temp object used for calculations to prevent unnecessary objects creation overhead */
  protected _tempVecX = new Vec2();
  /**temp object used for calculations to prevent unnecessary objects creation overhead */
  protected _tempVecY = new Vec2();
  //#endregion

  //#region render-related properties
  protected readonly _svgId = getRandomUuid(); 
  
  /**view box used for rendering */
  protected _viewBox: Quadruple;

  /**rendered box showing the annotation dimensions */
  protected _renderedBox: SVGGraphicsElement;
  /**svg container with all the annotation rendered helpers (boxes, handles, etc.) */
  protected _renderedControls: SVGGraphicsElement;  
  /**container with the annotation rendered content*/
  protected _renderedContent: HTMLDivElement;

  /**copy of the rendered annotation content */
  protected _svgContentCopy: SVGGraphicsElement;

  get lastRenderResult(): AnnotationRenderResult {
    if (!this._renderedControls || !this._renderedContent) {
      return null;
    }
    
    return {
      controls: this._renderedControls,
      content: this._renderedContent,
    };
  }  
  
  get strokeWidth(): number {
    return this.BS?.W ?? this.Border?.width ?? 1;
  }
  //#endregion

  protected constructor(subType: AnnotationType) {
    super(dictTypes.ANNOTATION);

    this.Subtype = subType;
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Subtype) {
      bytes.push(...encoder.encode("/Subtype "), ...encoder.encode(this.Subtype));
    }
    if (this.Rect) {
      bytes.push(...encoder.encode("/Rect "), ...this.encodePrimitiveArray(this.Rect, encoder));
    }
    if (this.Contents) {
      bytes.push(...encoder.encode("/Contents "), ...this.Contents.toArray(cryptInfo));
    }
    if (this.P) {
      bytes.push(...encoder.encode("/P "), ...this.P.toArray(cryptInfo));
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
      bytes.push(...encoder.encode("/C "), ...this.encodePrimitiveArray(this.C, encoder));
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
  
  /**
   * render current annotation using SVG
   * @param viewBox view box used for SVG elements
   * @returns 
   */
  async renderAsync(viewBox: Quadruple): Promise<AnnotationRenderResult> {
    if (!viewBox) {
      throw new Error("Can't render the annotation: view box is not defined");
    }
    this._viewBox = viewBox;
    
    if (!this._renderedControls) {
      this._renderedControls = this.renderControls();
    }

    // wrap render into a fake promise to keep interface responsible between render calls
    await new Promise<void>((resolve, reject) => {
      setTimeout(async () => {        
        await this.updateRenderAsync(); 
        resolve();          
      }, 0);
    });

    return this.lastRenderResult;
  }  

  //#region annotation content render
  /**
   * default annotation content renderer using the appearance stream 
   * (common for all annotation types)
   */
  async renderApStreamAsync(): Promise<AppearanceRenderResult> {
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
   * move the annotation to the specified coords relative to the page
   * @param point target point corrdiantes in the page coordinate system 
   */
  async moveToAsync(point: Vec2) {
    const width = this.Rect[2] - this.Rect[0];
    const height = this.Rect[3] - this.Rect[1];
    const x = point.x - width / 2;
    const y = point.y - height / 2;
    const mat = Mat3.buildTranslate(x, y);
    await this.applyCommonTransformAsync(mat);
  }

  /**
   * rotate the annotation by a certain angle
   * @param angle angle in radians
   * @param center point to rotate around (if not specified, the annotation center is used)
   */
  async rotateByAsync(angle: number, center?: Vec2) {   
    if (!center) {
      const [x0, y0, x1, y1] = this.Rect; 
      center = new Vec2(
        (x0 + x1) / 2,
        (y0 + y1) / 2,
      );
    } 
    const mat = new Mat3()
      .applyTranslation(-center.x, -center.y)
      .applyRotation(angle)
      .applyTranslation(center.x, center.y);
    await this.applyCommonTransformAsync(mat);
  }

  /**
   * serialize the annotation to a data transfer object
   * @returns 
   */
  toDto(): AnnotationDto {
    return {
      annotationType: "/Ink",
      uuid: this.$name,
      pageId: this.$pageId,

      dateCreated: this["CreationDate"]?.date?.toISOString() || new Date().toISOString(),
      dateModified: this.M 
        ? this.M instanceof LiteralString
          ? this.M.literal
          : this.M.date.toISOString()
        : new Date().toISOString(),
      author: this["T"]?.literal,

      textContent: this.Contents?.literal,

      rect: this.Rect,
      matrix: this.apStream?.Matrix,
    };
  }

  /**
   * set the annotation text content
   * (override in subclasses to fill all the required fields)
   * @param text 
   */
  async setTextContentAsync(text: string, undoable = true) {
    // use proxy for tracking property changes
    const dict = this.getProxy();

    const oldText = dict.Contents?.literal;

    if (!text) {
      dict.Contents = null;
    } else {
      const literalString = LiteralString.fromString(text);
      dict.Contents = literalString;
    }

    dict.M = DateString.fromDate(new Date());

    if (dict.$onEditAction) {
      dict.$onEditAction(undoable
        ? async () => {
          await dict.setTextContentAsync(oldText, false);
        }
        : undefined);
    }
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected override async parsePropsAsync(parseInfo: ParserInfo) {
    await super.parsePropsAsync(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 

    // DEBUG
    // console.log(parser.sliceChars(start, end));    
    
    let i = await parser.skipToNextNameAsync(start, end - 1);
    let name: string;
    let parseResult: ParserResult<string>;
    while (true) {
      parseResult = await parser.parseNameAtAsync(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/Subtype":
            const subtype = await parser.parseNameAtAsync(i);
            if (subtype) {
              if (this.Subtype && this.Subtype !== subtype.value) {
                // wrong object subtype
                throw new Error(`Invalid dict subtype: '${subtype.value}' instead of '${this.Subtype}'`);
              }
              i = subtype.end + 1;
            } else {
              throw new Error("Can't parse /Subtype property value");
            }
            break;
          
          case "/Rect":
            i = await this.parseNumberArrayPropAsync(name, parser, i, true);
            break;
          
          case "/P":
            i = await this.parseRefPropAsync(name, parser, i);
            break;
          
          case "/Contents":
          case "/NM":
            i = await this.parseLiteralPropAsync(name, parser, i, parseInfo.cryptInfo);
            break;
          
          case "/M":
            const date = await DateString.parseAsync(parser, i, parseInfo.cryptInfo);
            if (date) {
              this.M = date.value;
              i = date.end + 1;    
              break;      
            } else {   
              const dateLiteral = await LiteralString.parseAsync(parser, i, parseInfo.cryptInfo);
              if (dateLiteral) {
                this.M = dateLiteral.value;
                i = dateLiteral.end + 1; 
                break;   
              } 
            }
            throw new Error("Can't parse /M property value"); 
       
          case "/C":
            i = await this.parseNumberArrayPropAsync(name, parser, i, true);
            break;
          
          case "/F":
          case "/StructParent":
            i = await this.parseNumberPropAsync(name, parser, i, false);
            break;
          
          case "/Border":
            const borderArray = await BorderArray.parseAsync(parser, i);
            if (borderArray) {
              this.Border = borderArray.value;
              i = borderArray.end + 1;
            } else {              
              throw new Error("Can't parse /Border property value");
            }
            break;
          case "/BS":            
            const bsEntryType = await parser.getValueTypeAtAsync(i);
            if (bsEntryType === valueTypes.REF) {              
              const bsDictId = await ObjectId.parseRefAsync(parser, i);
              if (bsDictId && parseInfo.parseInfoGetterAsync) {
                const bsParseInfo = await parseInfo.parseInfoGetterAsync(bsDictId.value.id);
                if (bsParseInfo) {
                  const bsDict = await BorderStyleDict.parseAsync(bsParseInfo);
                  if (bsDict) {
                    this.BS = bsDict.value;
                    i = bsDict.end + 1;
                    break;
                  }
                }
              }              
              throw new Error("Can't parse /BS value reference");
            } else if (bsEntryType === valueTypes.DICTIONARY) { 
              const bsDictBounds = await parser.getDictBoundsAtAsync(i); 
              if (bsDictBounds) {
                const bsDict = await BorderStyleDict.parseAsync({parser, bounds: bsDictBounds});
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
            const beEntryType = await parser.getValueTypeAtAsync(i);
            if (beEntryType === valueTypes.REF) {              
              const bsDictId = await ObjectId.parseRefAsync(parser, i);
              if (bsDictId && parseInfo.parseInfoGetterAsync) {
                const bsParseInfo = await parseInfo.parseInfoGetterAsync(bsDictId.value.id);
                if (bsParseInfo) {
                  const bsDict = await BorderEffectDict.parseAsync(bsParseInfo);
                  if (bsDict) {
                    this.BE = bsDict.value;
                    i = bsDict.end + 1;
                    break;
                  }
                }
              }              
              throw new Error("Can't parse /BE value reference");
            } else if (beEntryType === valueTypes.DICTIONARY) { 
              const bsDictBounds = await parser.getDictBoundsAtAsync(i); 
              if (bsDictBounds) {
                const bsDict = await BorderEffectDict.parseAsync({parser, bounds: bsDictBounds});
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
            const apEntryType = await parser.getValueTypeAtAsync(i);
            if (apEntryType === valueTypes.REF) {              
              const apDictId = await ObjectId.parseRefAsync(parser, i);
              if (apDictId && parseInfo.parseInfoGetterAsync) {
                const apParseInfo = await parseInfo.parseInfoGetterAsync(apDictId.value.id);
                if (apParseInfo) {
                  const apDict = await AppearanceDict.parseAsync(apParseInfo);
                  if (apDict) {
                    this.AP = apDict.value;
                    i = apDict.end + 1;
                    break;
                  }
                }
              }              
              throw new Error("Can't parse /AP value reference");
            } else if (apEntryType === valueTypes.DICTIONARY) { 
              const apDictBounds = await parser.getDictBoundsAtAsync(i); 
              if (apDictBounds) {
                const apDict = await AppearanceDict.parseAsync({
                  parser, 
                  bounds: apDictBounds, 
                  parseInfoGetterAsync: parseInfo.parseInfoGetterAsync,
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
            i = await this.parseNamePropAsync(name, parser, i);
            break;
          
          // TODO: handle remaining properties
          case "/OC":
          default:
            // skip to next name
            i = await parser.skipToNextNameAsync(i, end - 1);
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
  }

  //#region protected render methods

  //#region common methods used for rendering purposes  
  protected getColorString(): string {
    let colorString: string;
    if (!this.C?.length) {
      colorString = "0 G 0 g";
    } else if (this.C.length < 3) {
      const g = this.C[0];
      colorString = `${g} G ${g} g`;
    } else if (this.C.length === 3) {
      const [r, g, b] = this.C;      
      colorString = `${r} ${g} ${b} RG ${r} ${g} ${b} rg`;
    } else {      
      const [c, m, y, k] = this.C;      
      colorString = `${c} ${m} ${y} ${k} K ${c} ${m} ${y} ${k} k`;
    }
    return colorString;
  }

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
      return this._bBox;
    } else if (this.apStream) {
      // or calculate a bounding box using the appearance stream data if present
      // get the transformed bounding box from the appearance stream
      const {ll: apTrBoxLL, lr: apTrBoxLR, ur: apTrBoxUR, ul: apTrBoxUL} =
        this.apStream.transformedBBox;  
      // compare it with the Rect
      const {min: boxMin, max: boxMax} = 
        Vec2.minMax(apTrBoxLL, apTrBoxLR, apTrBoxUR, apTrBoxUL);
      const rectMin = new Vec2(this.Rect[0], this.Rect[1]);
      const rectMax = new Vec2(this.Rect[2], this.Rect[3]);    
      // transform the appearance stream bounding box to match the Rect scale and position
      const mat = Mat3.from4Vec2(boxMin, boxMax, rectMin, rectMax, true);
      bBoxLL = apTrBoxLL.applyMat3(mat);
      bBoxLR = apTrBoxLR.applyMat3(mat);
      bBoxUR = apTrBoxUR.applyMat3(mat);
      bBoxUL = apTrBoxUL.applyMat3(mat);
    } else if (this.Rect) {  
      // else use the Rect property data
      bBoxLL = new Vec2(this.Rect[0], this.Rect[1]);
      bBoxLR = new Vec2(this.Rect[2], this.Rect[1]);
      bBoxUR = new Vec2(this.Rect[2], this.Rect[3]);
      bBoxUL = new Vec2(this.Rect[0], this.Rect[3]);
    } else {
      bBoxLL = new Vec2();
      bBoxLR = new Vec2();
      bBoxUR = new Vec2();
      bBoxUL = new Vec2();      
    }
    
    this._bBox = {
      ll: bBoxLL,
      lr: bBoxLR,
      ur: bBoxUR,
      ul: bBoxUL,
    };
    return this._bBox;
  }  

  /**
   * get 2D vector with a position of the specified point in page coords 
   * (0, 0 is lower-left corner of the page)
   * @param clientX 
   * @param clientY 
   */
  protected convertClientCoordsToPage(clientX: number, clientY: number): Vec2 {
    // html coords (0,0 is top-left corner)
    const {x, y, width, height} = this._renderedBox.getBoundingClientRect();
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
    const {x, y, width, height} = this._renderedBox.getBoundingClientRect();
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

  //#region transformation
  /**
   * transform annotation bounding boxes using transformation matrix
   * @param matrix 
   */
  protected applyRectTransform(matrix: Mat3) {
    // transform current bounding box (not axis-aligned)
    const bBox = this.getLocalBB();
    bBox.ll.applyMat3(matrix);
    bBox.lr.applyMat3(matrix);
    bBox.ur.applyMat3(matrix);
    bBox.ul.applyMat3(matrix);

    // get an axis-aligned bounding box and assign it to the Rect property
    const {min: newRectMin, max: newRectMax} = 
      Vec2.minMax(bBox.ll, bBox.lr, bBox.ur, bBox.ul);
    this.Rect = [newRectMin.x, newRectMin.y, newRectMax.x, newRectMax.y];
  }  
  
  protected async applyCommonTransformAsync(matrix: Mat3, undoable = true) {
    // use proxy for tracking property changes
    const dict = this.getProxy();

    // transform bounding boxes
    dict.applyRectTransform(matrix);    
    
    // if the annotation has a content stream, update its matrix
    const stream = dict.apStream;
    if (stream) {
      const newApMatrix = Mat3.multiply(stream.matrix, matrix);
      dict.apStream.matrix = newApMatrix;
    }

    dict.M = DateString.fromDate(new Date());
    
    if (dict.$onEditAction) {
      const invertedMat = Mat3.invert(matrix);      
      dict.$onEditAction(undoable
        ? async () => {
          await dict.applyCommonTransformAsync(invertedMat, false);
          await dict.updateRenderAsync();
        }
        : undefined);
    }
  }
  
  /**
   * reset the svg element copy used for transformation purposes
   */
  protected async applyTempTransformAsync() {
    if (this._transformationTimer) {
      clearTimeout(this._transformationTimer);
      this._transformationTimer = null;
      return;
    }

    if (this._transformationPromise) {
      await this._transformationPromise;
    }

    this._transformationPromise = new Promise<void>(async resolve => {
      // reset and remove the copy from DOM
      this._svgContentCopy.remove();
      this._svgContentCopy.setAttribute("transform", "matrix(1 0 0 1 0 0)");

      if (this._moved) {
        // transform the annotation
        await this.applyCommonTransformAsync(this._tempTransformationMatrix);
        await this.updateRenderAsync();
      }

      // reset the temp matrix
      this._tempTransformationMatrix.reset();

      resolve();
    });

    await this._transformationPromise;
  }
  //#endregion

  /**
   * override in subclass to apply a custom annotation content renderer
   * (if implemented, takes precedence over the 'renderApAsync' method)
   */
  protected renderAppearance(): AppearanceRenderResult {
    return null;
  }   

  //#region render containers creation
  /**render the graphical representation of the annotation Rect (AABB) */
  protected renderRect(): SVGGraphicsElement {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rect.classList.add("annotation-rect");
    rect.setAttribute("data-annotation-name", this.$name);
    rect.setAttribute("x", this.Rect[0] + "");
    rect.setAttribute("y", this.Rect[1] + "");
    rect.setAttribute("width", this.Rect[2] - this.Rect[0] + "");
    rect.setAttribute("height", this.Rect[3] - this.Rect[1] + "");

    return rect;
  }
  
  /**render the graphical representation of the annotation bounding box */
  protected renderBox(): SVGGraphicsElement {
    const {ll, lr, ur, ul} = this.getLocalBB();
    const boxPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    boxPath.classList.add("annotation-bbox");
    boxPath.setAttribute("data-annotation-name", this.$name);
    boxPath.setAttribute("d", `M ${ll.x} ${ll.y} L ${lr.x} ${lr.y} L ${ur.x} ${ur.y} L ${ul.x} ${ul.y} Z`);

    return boxPath;
  }

  /**render the outer svg container for the annotation UI */
  protected renderControls(): SVGGraphicsElement {    
    const controlsGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    controlsGroup.classList.add("annotation-controls");
    controlsGroup.setAttribute("data-annotation-name", this.$name);    
    controlsGroup.addEventListener("pointerdown", this.onSvgPointerDown);
    controlsGroup.addEventListener("pointerenter", this.onSvgPointerEnter);
    controlsGroup.addEventListener("pointerleave", this.onSvgPointerLeave);

    return controlsGroup;
  }  

  /**convert the annotation content render result to a structured html div */
  protected buildRenderedContentStructure(renderResult: AppearanceRenderResult): HTMLDivElement {
    const content = document.createElement("div");
    content.id = this._svgId;
    content.classList.add("annotation-content");
    content.setAttribute("data-annotation-name", this.$name); 
    
    if (renderResult.clipPaths?.length) {
      const clipPathsContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      clipPathsContainer.append(...renderResult.clipPaths);
      content.append(clipPathsContainer);
    }
      
    const [x0, y0, x1, y1] = this._viewBox;
    renderResult.elements.forEach(x => {      
      const elementContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      elementContainer.classList.add("annotation-content-element");
      elementContainer.setAttribute("viewBox", `${x0} ${y0} ${x1} ${y1}`);
      // flip Y to match PDF coords where 0,0 is the lower-left corner
      elementContainer.setAttribute("transform", "scale(1, -1)");

      elementContainer.style["mixBlendMode"] = x.blendMode;
      elementContainer.append(x.element);
      content.append(elementContainer);
    });

    return content;
  }

  /**render the copy of the annotation content (used as a temp object for a transformation visualization) */
  protected buildRenderContentCopy(contentRenderResult: AppearanceRenderResult): SVGGraphicsElement {
    const copy = document.createElementNS("http://www.w3.org/2000/svg", "g");
    contentRenderResult.elements.forEach(x => {
      copy.append(x.element.cloneNode(true));
    });
    copy.classList.add("annotation-temp-copy");
    return copy;
  }
  //#endregion

  //#endregion

  //#region render of the annotation control handles 
  protected renderScaleHandles(): SVGGraphicsElement[] { 
    const bBox = this.getLocalBB();

    const handles: SVGGraphicsElement[] = [];
    ["ll", "lr", "ur", "ul"].forEach(x => {
      const handle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      handle.classList.add("annotation-handle", "scale");
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
    rotationGroup.classList.add("annotation-rotator");
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
    centerRectHandle.classList.add("annotation-handle", "rotation");
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
    if (!this._renderedControls) {
      // not rendered yet. no svg to update
      return;
    }
    // clear controls group
    this._renderedControls.innerHTML = "";

    // render annotation appearance
    const contentRenderResult = this.renderAppearance() || await this.renderApStreamAsync();
    if (!contentRenderResult || !contentRenderResult.elements?.length) { 
      this._renderedBox = null;
      this._svgContentCopy = null;
      return null;
    }
    // convert the appearance render result to a structured html div
    const content = this.buildRenderedContentStructure(contentRenderResult);
    this._renderedContent = content;
    
    // render controls
    const rect = this.renderRect();
    const box = this.renderBox();
    const handles = this.renderHandles(); 
    this._renderedBox = box;
    this._renderedControls.append(rect, box, ...contentRenderResult.pickHelpers, ...handles);

    // render annotation content copy used for its transformation
    const copy = this.buildRenderContentCopy(contentRenderResult); 
    this._svgContentCopy = copy;

    if (this.$onRenderUpdatedAction) {
      this.$onRenderUpdatedAction();
    }
  }

  //#endregion

  //#region event handlers 

  //#region selection handlers
  protected onSvgPointerEnter = (e: PointerEvent) => { 
    if (this.$onPointerEnterAction) {
      this.$onPointerEnterAction(e);
    }
  };

  protected onSvgPointerLeave = (e: PointerEvent) => { 
    if (this.$onPointerLeaveAction) {
      this.$onPointerLeaveAction(e);
    }    
  };
  
  protected onSvgPointerDown = (e: PointerEvent) => { 
    if (!this.$pageId) {
      // the annotation is not appended to the page (a temporary one)
      // do nothing
      return;
    }

    // call the additional action if present
    if (this.$onPointerDownAction) {
      this.$onPointerDownAction(e);
    }

    this.onTranslationPointerDown(e);
  };
  //#endregion

  //#region translation handlers
  protected onTranslationPointerDown = (e: PointerEvent) => { 
    if (!this.$translationEnabled || !e.isPrimary) {
      // translation disabled or it's a secondary touch action
      return;
    }

    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);
    target.addEventListener("pointerup", this.onTranslationPointerUp);
    target.addEventListener("pointerout", this.onTranslationPointerUp);  

    this._moved = false;

    // set timeout to prevent an accidental annotation translation
    this._transformationTimer = setTimeout(() => {
      this._transformationTimer = null;    
      // append the svg element copy       
      this._renderedControls.after(this._svgContentCopy);
      // set the starting transformation point
      this._tempStartPoint.setFromVec2(this.convertClientCoordsToPage(e.clientX, e.clientY));
      target.addEventListener("pointermove", this.onTranslationPointerMove);
    }, 200);
  };

  protected onTranslationPointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) {
      // it's a secondary touch action
      return;
    }

    const current = this.convertClientCoordsToPage(e.clientX, e.clientY);;
    // update the temp transformation matrix
    this._tempTransformationMatrix.reset()
      .applyTranslation(current.x - this._tempStartPoint.x, 
        current.y - this._tempStartPoint.y);
    // move the svg element copy to visualize the future transformation in real-time
    this._svgContentCopy.setAttribute("transform", 
      `matrix(${this._tempTransformationMatrix.toFloatShortArray().join(" ")})`);

    this._moved = true;
  };
  
  protected onTranslationPointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      // it's a secondary touch action
      return;
    }

    const target = e.target as HTMLElement;
    target.removeEventListener("pointermove", this.onTranslationPointerMove);
    target.removeEventListener("pointerup", this.onTranslationPointerUp);
    target.removeEventListener("pointerout", this.onTranslationPointerUp);
    target.releasePointerCapture(e.pointerId); 

    this.applyTempTransformAsync();
  };
  //#endregion
  
  //#region rotation handlers
  protected onRotationHandlePointerDown = (e: PointerEvent) => {    
    if (!e.isPrimary) {
      //it's a secondary touch action
      return;
    }

    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);
    target.addEventListener("pointerup", this.onRotationHandlePointerUp);
    target.addEventListener("pointerout", this.onRotationHandlePointerUp);   
    
    this._moved = false;

    // set timeout to prevent an accidental annotation rotation
    this._transformationTimer = setTimeout(() => {
      this._transformationTimer = null;  
      // append the svg element copy       
      this._renderedControls.after(this._svgContentCopy);
      target.addEventListener("pointermove", this.onRotationHandlePointerMove);
    }, 200);

    e.stopPropagation();
  };

  protected onRotationHandlePointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) {
      //it's a secondary touch action
      return;
    }
    
    // calculate current angle depending on the pointer position relative to the rotation center
    const centerX = (this.Rect[0] + this.Rect[2]) / 2;
    const centerY = (this.Rect[1] + this.Rect[3]) / 2;
    const clientCenter = this.convertPageCoordsToClient(centerX, centerY);
    const currentRotation = this.getCurrentRotation();
    const angle = Math.atan2(
      e.clientY - clientCenter.y, 
      e.clientX - clientCenter.x
    ) + Math.PI / 2 - currentRotation;
    this._currentAngle = angle;

    // update the temp transformation matrix
    this._tempTransformationMatrix.reset()
      .applyTranslation(-centerX, -centerY)
      .applyRotation(angle)
      .applyTranslation(centerX, centerY);

    // move the svg element copy to visualize the future transformation in real-time
    this._svgContentCopy.setAttribute("transform", 
      `matrix(${this._tempTransformationMatrix.toFloatShortArray().join(" ")})`);
    
    this._moved = true;
  };
  
  protected onRotationHandlePointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      // it's a secondary touch action
      return;
    }

    const target = e.target as HTMLElement;
    target.removeEventListener("pointermove", this.onRotationHandlePointerMove);
    target.removeEventListener("pointerup", this.onRotationHandlePointerUp);
    target.removeEventListener("pointerout", this.onRotationHandlePointerUp);
    target.releasePointerCapture(e.pointerId);     
    
    this.applyTempTransformAsync();
  };
  //#endregion
  
  //#region scale handlers
  protected onScaleHandlePointerDown = (e: PointerEvent) => { 
    if (!e.isPrimary) {
      //it's a secondary touch action
      return;
    }

    const target = e.target as HTMLElement;
    target.setPointerCapture(e.pointerId);
    target.addEventListener("pointerup", this.onScaleHandlePointerUp);
    target.addEventListener("pointerout", this.onScaleHandlePointerUp);

    // calculate the initial bounding box side vectors (from the further corner to the handle corner)
    const {ll, lr, ur, ul} = this.getLocalBB();
    const handleName = target.dataset["handleName"];
    switch (handleName) {
      case "ll": 
        this._tempStartPoint.setFromVec2(ur);
        this._tempVecX.setFromVec2(ul).subtract(ur);
        this._tempVecY.setFromVec2(lr).subtract(ur);      
        break;
      case "lr":
        this._tempStartPoint.setFromVec2(ul);
        this._tempVecX.setFromVec2(ur).subtract(ul);
        this._tempVecY.setFromVec2(ll).subtract(ul); 
        break;
      case "ur":
        this._tempStartPoint.setFromVec2(ll); 
        this._tempVecX.setFromVec2(lr).subtract(ll);
        this._tempVecY.setFromVec2(ul).subtract(ll);
        break;
      case "ul":
        this._tempStartPoint.setFromVec2(lr); 
        this._tempVecX.setFromVec2(ll).subtract(lr);
        this._tempVecY.setFromVec2(ur).subtract(lr);
        break;
      default:
        // execution should not reach here
        throw new Error(`Invalid handle name: ${handleName}`);
    }
    this._tempX = this._tempVecX.getMagnitude();
    this._tempY = this._tempVecY.getMagnitude();

    this._moved = false;

    // set timeout to prevent an accidental annotation scaling
    this._transformationTimer = setTimeout(() => {
      this._transformationTimer = null;       
      // append the svg element copy     
      this._renderedControls.after(this._svgContentCopy);
      target.addEventListener("pointermove", this.onScaleHandlePointerMove);
    }, 200);

    e.stopPropagation();
  };

  protected onScaleHandlePointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) {
      //it's a secondary touch action
      return;
    }

    // calculate scale change comparing bounding boxes vectors:
    // first box - from the further corner to the handle corner (initial)
    // second box - from the further corner to the current pointer position (current)

    // calculate the current diagonal vector
    const currentBoxDiagonal = this.convertClientCoordsToPage(e.clientX, e.clientY)
      .subtract(this._tempStartPoint);
    const currentBoxDiagonalLength = currentBoxDiagonal.getMagnitude();

    // calculate the cosine of the angle between the current diagonal vector and the initial box side
    const cos = Math.abs(currentBoxDiagonal.dotProduct(this._tempVecX)) 
      / currentBoxDiagonalLength / this._tempX;
    // calculate the current box side lengths
    const currentXSideLength = cos * currentBoxDiagonalLength;
    const currentYSideLength = Math.sqrt(currentBoxDiagonalLength * currentBoxDiagonalLength 
      - currentXSideLength * currentXSideLength);    

    const scaleX = currentXSideLength / this._tempX;
    const scaleY = currentYSideLength / this._tempY;
    
    const annotCenterX = (this.Rect[0] + this.Rect[2]) / 2;
    const annotCenterY = (this.Rect[1] + this.Rect[3]) / 2;
    const currentRotation = this.getCurrentRotation();

    // update the temp transformation matrix
    this._tempTransformationMatrix.reset()
      .applyTranslation(-annotCenterX, -annotCenterY)
      .applyRotation(-currentRotation)
      .applyScaling(scaleX, scaleY)
      .applyRotation(currentRotation)
      .applyTranslation(annotCenterX, annotCenterY);
    const translation = this._tempStartPoint.clone().subtract(
      this._tempStartPoint.clone().applyMat3(this._tempTransformationMatrix));
    this._tempTransformationMatrix.applyTranslation(translation.x, translation.y);
    
    // move the svg element copy to visualize the future transformation in real-time
    this._svgContentCopy.setAttribute("transform", 
      `matrix(${this._tempTransformationMatrix.toFloatShortArray().join(" ")})`);
      
    this._moved = true;
  };
  
  protected onScaleHandlePointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      // it's a secondary touch action
      return;
    }

    const target = e.target as HTMLElement;
    target.removeEventListener("pointermove", this.onScaleHandlePointerMove);
    target.removeEventListener("pointerup", this.onScaleHandlePointerUp);
    target.removeEventListener("pointerout", this.onScaleHandlePointerUp);
    target.releasePointerCapture(e.pointerId); 
    
    this.applyTempTransformAsync();
  };
  //#endregion

  //#endregion
  
  protected override initProxy(): AnnotationDict {
    return <AnnotationDict>super.initProxy();
  }

  protected override getProxy(): AnnotationDict {
    return <AnnotationDict>super.getProxy();
  }
}
