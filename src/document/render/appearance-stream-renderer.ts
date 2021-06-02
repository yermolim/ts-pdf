import { Quadruple } from "../../common/types";
import { Mat3, Vec2 } from "../../common/math";
import { calcPdfBBoxToRectMatrices, selectionStrokeWidth, 
  CssMixBlendMode } from "../../drawing/utils";

import { codes } from "../codes";
import { colorSpaces, lineCapStyles, lineJoinStyles, textRenderModes, valueTypes } from "../const";

import { DataParser } from "../data-parser";

import { ImageStream } from "../entities/streams/image-stream";
import { XFormStream } from "../entities/streams/x-form-stream";
import { HexString } from "../entities/strings/hex-string";
import { LiteralString } from "../entities/strings/literal-string";
import { ResourceDict } from "../entities/appearance/resource-dict";

import { GraphicsState, GraphicsStateParams } from "./graphics-state";

type OperatorParameter = number | string | Uint8Array;

/**appearance stream command */
interface ParsedCommand {  
  nextIndex: number;
  parameters: OperatorParameter[];
  operator: string;
}

interface SvgElementWithBlendMode {
  element: SVGGraphicsElement; 
  blendMode: CssMixBlendMode;
}

export interface AppearanceRenderResult {
  /**
   * array of all clip paths used in the stream.
   * taken out separately to prevent duplicating the clip paths for each stream item
   */
  clipPaths: SVGClipPathElement[];
  /**
   * svg graphics elements for each item in the stream paired with its blend mode
   */
  elements: SvgElementWithBlendMode[];
  /**
   * transparent copies with wide stroke of the SVG elements.
   * they are intended to use in user interaction layer to simplify narrow items selection
   */
  pickHelpers: SVGGraphicsElement[];
}

export class AppearanceStreamRenderer {
  protected readonly _stream: XFormStream;
  protected readonly _objectName: string;

  protected _clipPaths: SVGClipPathElement[] = [];
  protected _selectionCopies: SVGGraphicsElement[] = [];
  protected _graphicsStates: GraphicsState[] = [];
  get state(): GraphicsState {
    return this._graphicsStates[this._graphicsStates.length - 1];
  }

  /**
   * 
   * @param stream appearance stream
   * @param rect parent PDF object AABB coordinates in the view box coordinate system
   * @param objectName PDF object name (it is desirable to be unique)
   */
  constructor(stream: XFormStream, rect: Quadruple, objectName: string) {
    if (!stream) {
      throw new Error("Stream is not defined");
    }
    this._stream = stream;
    this._objectName = objectName;

    const {matAA} = calcPdfBBoxToRectMatrices(stream.BBox, rect, stream.Matrix);

    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.id = `clip0_${objectName}`;
    clipPath.innerHTML = `<rect x="${rect[0]}" y="${rect[1]}" width="${rect[2] - rect[0]}" height="${rect[3] - rect[1]}" />`;
    
    this._clipPaths.push(clipPath);
    this._graphicsStates.push(new GraphicsState({matrix: matAA, clipPath}));
  }  

  /**
   * 
   * @param parser 
   * @param i byte offset from the stream start
   * @returns 
   */
  protected static parseNextCommand(parser: DataParser, i: number): ParsedCommand {
    const parameters: OperatorParameter[] = [];
    let operator: string;
    // parse parameters and operator
    command: while (!operator) {
      const nextValueType = parser.getValueTypeAt(i, true);
      switch (nextValueType) {
        case valueTypes.NUMBER:
          const numberResult = parser.parseNumberAt(i, true);
          parameters.push(numberResult.value);
          i = numberResult.end + 1;
          break;
        case valueTypes.NAME:
          const nameResult = parser.parseNameAt(i, true);
          parameters.push(nameResult.value);
          i = nameResult.end + 1;
          break;
        case valueTypes.ARRAY:
          const arrayBounds = parser.getArrayBoundsAt(i);          
          let j = arrayBounds.start + 1;
          while(j < arrayBounds.end - 1 && j !== -1) {
            const nextArrayValueType = parser.getValueTypeAt(j, true);
            switch (nextArrayValueType) {
              case valueTypes.STRING_LITERAL:
                const arrayLiteralResult = LiteralString.parse(parser, j);
                parameters.push(arrayLiteralResult.value.bytes);
                j = arrayLiteralResult.end + 1;
                break;
              case valueTypes.NUMBER:
                const arrayNumberResult = parser.parseNumberAt(j, true);
                parameters.push(arrayNumberResult.value);
                j = arrayNumberResult.end + 1;
                break;
              default:
                console.log(parser.sliceChars(arrayBounds.start + 1, arrayBounds.end - 1));
                console.log(parser.sliceChars(j, j + 10));
                console.log(`Unsupported value type in AP stream parameter array: ${nextArrayValueType}`); 
                j = parser.findDelimiterIndex("straight", j + 1);                  
                break;
            }
          }
          i = arrayBounds.end + 1;
          break;
        case valueTypes.STRING_LITERAL:
          const literalResult = LiteralString.parse(parser, i);
          parameters.push(literalResult.value.literal);
          i = literalResult.end + 1;
          break;
        case valueTypes.STRING_HEX:
          const hexResult = HexString.parse(parser, i);
          parameters.push(hexResult.value.hex);
          i = hexResult.end + 1;
          break;
        case valueTypes.UNKNOWN:
          // should be operator
          const operatorResult = parser.parseStringAt(i);
          operator = operatorResult.value;
          i = operatorResult.end + 1;
          break command;
        default:
          // should not end up here
          throw new Error(`Invalid appearance stream value type: ${nextValueType}`);
      }
    }
    return {nextIndex: i, parameters, operator};
  }

  /**
   * render appearance stream to an SVG element
   * @returns 
   */
  async renderAsync(): Promise<AppearanceRenderResult> {
    this.reset();

    const elements = await this.drawStreamAsync(this._stream);
    return {
      elements,
      clipPaths: this._clipPaths.slice(),
      pickHelpers: this._selectionCopies.slice(),
    };
  }

  protected reset() {
    // clear all graphic states and clip paths except the first ones
    this._graphicsStates.length = 1;
    this._clipPaths.length = 1;
    // clear the list of selection copies
    this._selectionCopies.length = 0;
  }

  /**
   * push graphics state to the graphics state stack
   * @param params 
   */
  protected pushState(params?: GraphicsStateParams) {
    const lastState = this._graphicsStates[this._graphicsStates.length - 1];
    const newState = lastState.clone(params);
    this._graphicsStates.push(newState);
  }
  
  /**
   * pop the last graphics state from the graphics state stack
   * @param params 
   */
  protected popState(): GraphicsState {
    if (this._graphicsStates.length === 1) {
      // can't pop the only state
      return null;
    }
    return this._graphicsStates.pop();
  }

  /**
   * create a new clipping region and apply it to the current graphics state
   * @param clippingElement 
   * @param nonzero 
   */
  protected pushClipPath(clippingElement: SVGGraphicsElement, nonzero?: boolean) {
    const lastCpIndex = this._clipPaths.length - 1;
    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.setAttribute("clip-rule", nonzero ? "nonzero" : "evenodd");
    clipPath.setAttribute("clip-path", `url(#${this._clipPaths[lastCpIndex]})`);
    clipPath.id = `clip${lastCpIndex + 1}_${this._objectName}`;
    clipPath.append(clippingElement);

    this._clipPaths.push(clipPath);
    this.state.clipPath = clipPath;
  }

  /**
   * try to apply a graphic states operator 
   * @param operator 
   * @param parameters 
   * @returns 'true' if the operator is applied, 'false' if the operator is not related to graphic states
   */
  protected tryApplyingStateOperator(operator: string, 
    parameters: (string | number | Uint8Array)[]): boolean {

    switch (operator) {
      //#region General state operators
      case "q": // push new graphics state
        this.pushState();
        break;
      case "Q": // pop last graphics state
        this.popState();
        break;
      case "gs": // set external graphics state
        const externalState = this._stream.Resources.getGraphicsState(`/ExtGState${parameters[0]}`);
        if (!externalState) {
          throw new Error("External state specified in appearance stream not found");
        }
        const params = externalState.toParams();
        Object.assign(this.state, params);
        break;
      case "cm": // apply transformation matrix
        const [m0, m1, m3, m4, m6, m7] = <number[]>parameters;
        const matrix = new Mat3().set(m0, m1, 0, m3, m4, 0, m6, m7, 1);
        this.state.matrix = matrix.multiply(this.state.matrix);
        break;
      //#endregion
      //#region Stroke state operators
      case "w": // set stroke width
        this.state.strokeWidth = +parameters[0] || 1;
        break;
      case "J": // set stroke line cap
        switch (parameters[0]) {
          case lineCapStyles.ROUND:
            this.state.strokeLineCap = "round";
            break;
          case lineCapStyles.SQUARE:
            this.state.strokeLineCap = "square";
            break;
          case lineCapStyles.BUTT:
          default:
            this.state.strokeLineCap = "butt";
            break;
        }
        break;
      case "j": // set stroke line join
        switch (parameters[0]) {
          case lineJoinStyles.BEVEL:
            this.state.strokeLineJoin = "bevel";
            break;
          case lineJoinStyles.ROUND:
            this.state.strokeLineJoin = "round";
            break;
          case lineJoinStyles.MITER:
          default:
            this.state.strokeLineJoin = "miter";
            break;
        }
        break;
      case "M": // set stroke miter limit
        this.state.strokeMiterLimit = +parameters[0] || 10;
        break;
      case "d": // set stroke dash array
        // TODO: test
        let a = 3;
        let b = 0;
        let c = 0;
        if (parameters.length === 3) {
          a = +parameters[0];
          b = +parameters[1];
          c = +parameters[2];
        } else if (parameters.length === 2) {
          a = +parameters[0];
          c = +parameters[1];
        } else if (parameters.length === 1) {
          c = +parameters[0];
        }
        this.state.strokeDashArray = `${a} ${b}`;
        this.state.strokeDashOffset = c;
        break;
      //#endregion
      //#region Color state operators
      case "CS": // set color space
        switch (parameters[0]) {
          case colorSpaces.GRAYSCALE:
            this.state.strokeColorSpace = "grayscale";
            break;
          case colorSpaces.RGB:
            this.state.strokeColorSpace = "rgb";
            break;
          case colorSpaces.CMYK:
            this.state.strokeColorSpace = "cmyk";
            break;
          default:
            throw new Error("Unsupported color space in appearance stream");
        }
        break;
      case "cs": // set color space
        switch (parameters[0]) {
          case colorSpaces.GRAYSCALE:
            this.state.fillColorSpace = "grayscale";
            break;
          case colorSpaces.RGB:
            this.state.fillColorSpace = "rgb";
            break;
          case colorSpaces.CMYK:
            this.state.fillColorSpace = "cmyk";
            break;
          default:
            throw new Error("Unsupported color space in appearance stream");
        }
        break;
      case "G": // set grayscale stroke color
        this.state.strokeColorSpace = "grayscale";
        this.state.setColor("stroke", ...parameters as number[]);
        break;
      case "g": // set grayscale fill color
        this.state.fillColorSpace = "grayscale";
        this.state.setColor("fill", ...parameters as number[]);
        break;
      case "RG": // set rgb stroke color
        this.state.strokeColorSpace = "rgb";
        this.state.setColor("stroke", ...parameters as number[]);
        break;
      case "rg": // set rgb fill color
        this.state.fillColorSpace = "rgb";
        this.state.setColor("fill", ...parameters as number[]);
        break;
      case "K": // set cmyk stroke color
        this.state.strokeColorSpace = "cmyk";
        this.state.setColor("stroke", ...parameters as number[]);
        break;
      case "k": // set cmyk fill color
        this.state.fillColorSpace = "cmyk";
        this.state.setColor("fill", ...parameters as number[]);
        break;
      case "SC": // set current color space stroke color
        this.state.setColor("stroke", ...parameters as number[]);
        break;
      case "cs": // set current color space fill color
        this.state.setColor("fill", ...parameters as number[]);
        break;
      //#endregion
      //#region Misc state operators
      case "ri": // set render intent
      case "i": // set flatness tolerance
        // do nothing
        break;
        //#endregion
        
      //#region Text state operators
      case "Tc": // character spacing ('{x} Tc', x = 0 is normal spacing)
        this.state.textState.setLetterSpacing(+parameters[0]);
        break;
      case "Tw": // word spacing ('{x} Tw', x = 0 is normal spacing)
        this.state.textState.setWordSpacing(+parameters[0]);
        break;
      case "Tz": // horizontal scaling ('{x} Tz', x = 100 is normal scale)
        this.state.textState.setScale(+parameters[0]);
        break;
      case "TL": // leading ('{x} TL', line height)
        this.state.textState.setLeading(+parameters[0]);
        break;
      case "Tf": // font and font size ('{font_name} {x} Tf')
        this.state.textState.customFontName = parameters[0] as string || "";
        this.state.textState.setFontSize(+parameters[1]);
        break;
      case "Tr": // rendering mode ('{x} Tf', x - integer from 0 to 7)
        // 0 - fill, 1 - stroke, 2 - fill + stroke, 3 - none, 
        // 4 - fill + clip, 5 - stroke + clip, 6 - fill + stroke + clip
        // 7 - clip
        switch (parameters[0]) {
          case 0:
          default:
            this.state.textState.renderMode = textRenderModes.FILL;
            break;
          case 1: 
            this.state.textState.renderMode = textRenderModes.STROKE;
            break;
          case 2:
            this.state.textState.renderMode = textRenderModes.FILL_STROKE;
            break;
          case 3:
            this.state.textState.renderMode = textRenderModes.INVISIBLE;
            break;
          case 4:
            this.state.textState.renderMode = textRenderModes.FILL_USE_AS_CLIP;
            break;
          case 5: 
            this.state.textState.renderMode = textRenderModes.STROKE_USE_AS_CLIP;
            break;
          case 6:
            this.state.textState.renderMode = textRenderModes.FILL_STROKE_USE_AS_CLIP;
            break;
          case 7:
            this.state.textState.renderMode = textRenderModes.USE_AS_CLIP;
            break;
        }
        break;
      case "Ts": // rise
        this.state.textState.setVerticalAlign(+parameters[0]);
        break;
        //#endregion
      //#region Text positioning operators
      case "Td": // move to the start of the next line ('{tx} {ty} Td')
        if (parameters.length > 1) {
          const [tx, ty] = <number[]>parameters;
          this.state.textState.nextLine(tx, ty);
        }
        break;
      case "TD": // '{tx} {ty} TD' same as '{-ty} TL {tx} {ty} Td'
        if (parameters.length > 1) {
          const [tx, ty] = <number[]>parameters;
          this.state.textState.setLeading(-ty);
          this.state.textState.nextLine(tx, ty);
        }
        break;
      case "Tm": // text matrix ('{a} {b} {c} {d} {e} {f} Tm')
        if (parameters.length > 5) {
          const [tm0, tm1, tm3, tm4, tm6, tm7] = <number[]>parameters;
          // The matrix specified by the operands shall not be concatenated onto the current text matrix, 
          // but shall replace it.
          const transformationMatrix = new Mat3().set(tm0, tm1, 0, tm3, tm4, 0, tm6, tm7, 1);
          this.state.textState.matrix = transformationMatrix;
          this.state.textState.lineMatrix = transformationMatrix.clone();
        }
        break;
      case "T*": // same as '0 {currentLeading} Td'
        this.state.textState.nextLine();
        break;
        //#endregion

      default:
        // the operator is not related to graphic states
        return false;
    }

    // the operator is succesfully applied
    return true;
  }  

  protected decodeTextParam(textParam: OperatorParameter, 
    resources: ResourceDict): string {
    const textState = this.state.textState;
    let text = "";

    if (textParam instanceof Uint8Array) {
      // text parameter is a hex string, non-ascii encoding.
      // try to get the font dict from the corresponding resources
      const fontDict = resources.getFont(textState.customFontName);
      if (fontDict) {
        textState.fontFamily = fontDict.BaseFont
          ? `'${fontDict.BaseFont.substring(1)}', arial, sans-serif` // remove starting slash
          : "arial, sans-serif";
      }

      if (fontDict?.toUtfCmap) {
        // 'to unicode' mapper found
        text = fontDict.toUtfCmap.hexBytesToUtfString(textParam);
      } else if (fontDict?.encoding?.charMap) { 
        // 'code to character' mappings found
        const charMap = fontDict.encoding.charMap;
        textParam.forEach(byte => text += charMap.get(byte) ?? " ");
      } else {
        // no mappings are found in the resource dictionary.
        // use the default text decoder as a fallback (though it might fail)
        const decoder = textParam[0] === 254 && textParam[1] === 255 // UTF-16 Big Endian
          ? new TextDecoder("utf-16be")
          : new TextDecoder();
        const literal = decoder.decode(textParam);
        text = literal || "";
      }
    } else {
      // text parameter is a literal string in ascii encoding or a number
      text = textParam + "";
    }

    return text;
  }

  protected createSvgElement(): SVGGraphicsElement {
    const element = document.createElementNS("http://www.w3.org/2000/svg", "g");
    return element;
  }

  protected drawPath(d: string, stroke: boolean, fill: boolean, 
    close = false, evenOdd = false): SvgElementWithBlendMode {

    if (close && d[d.length - 1] !== "Z") {
      d += " Z";
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("transform", `matrix(${this.state.matrix.toFloatShortArray().join(" ")})`);
    path.setAttribute("d", d);

    if (fill) {
      path.setAttribute("fill", this.state.fill);
      path.setAttribute("fill-rule", evenOdd ? "evenodd" : "nonzero");
    } else {
      path.setAttribute("fill", "none");
    }

    if (stroke) {
      path.setAttribute("stroke", this.state.stroke);
      path.setAttribute("stroke-width", this.state.strokeWidth + "");
      path.setAttribute("stroke-miterlimit", this.state.strokeMiterLimit + "");
      path.setAttribute("stroke-linecap", this.state.strokeLineCap);
      path.setAttribute("stroke-linejoin", this.state.strokeLineJoin);
      if (this.state.strokeDashArray) {
        path.setAttribute("stroke-dasharray", this.state.strokeDashArray);        
      }
      if (this.state.strokeDashOffset) {
        path.setAttribute("stroke-dashoffset", this.state.strokeDashOffset + "");        
      }
    } else {
      path.setAttribute("stroke", "none");
    }

    const svg = this.createSvgElement();
    svg.setAttribute("clip-path", `url(#${this._clipPaths[this._clipPaths.length - 1].id})`);
    svg.append(path);
    
    // create a transparent path copy with large stroke width to simplify user interaction    
    const clonedSvg = this.createSvgElement();
    clonedSvg.classList.add("annotation-pick-helper");
    const clonedPath = path.cloneNode(true) as SVGPathElement;
    const clonedPathStrokeWidth = !stroke || this.state.strokeWidth < selectionStrokeWidth
      ? selectionStrokeWidth
      : this.state.strokeWidth;
    clonedPath.setAttribute("stroke-width", clonedPathStrokeWidth + "");
    clonedPath.setAttribute("stroke", "transparent");
    clonedPath.setAttribute("fill", fill ? "transparent" : "none");
    clonedSvg.append(clonedPath);
    this._selectionCopies.push(clonedPath);

    return { element: svg, blendMode: this.state.mixBlendMode || "normal" };
  }

  protected async drawImageAsync(imageStream: ImageStream): Promise<SVGGraphicsElement> {    
    const url = await imageStream.getImageUrlAsync();
    if (!url) {
      throw new Error("Can't get image url from external image stream");
    }

    const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
    image.onerror = e => {
      console.log(`Loading external image stream failed: ${e}`);
    };
    image.setAttribute("href", url);
    image.setAttribute("width", imageStream.Width + "");
    image.setAttribute("height", imageStream.Height + "");   
    const imageMatrix = new Mat3()
      .applyTranslation(-imageStream.Width / 2, -imageStream.Height / 2)
      .applyScaling(1, -1) // flip Y to negate the effect from the page-level SVG flipping
      .applyTranslation(imageStream.Width / 2, imageStream.Height / 2)
      .applyScaling(1 / imageStream.Width, 1 / imageStream.Height)
      .multiply(this.state.matrix);
    const imageMatrixString = imageMatrix.toFloatShortArray().join(" ");
    image.setAttribute("transform", `matrix(${imageMatrixString})`);

    const imageWrapper = this.createSvgElement();
    imageWrapper.setAttribute("clip-path", `url(#${this._clipPaths[this._clipPaths.length - 1].id})`);
    imageWrapper.append(image);

    // create a transparent image rect copy to simplify user interaction    
    const clonedSvg = this.createSvgElement();
    clonedSvg.classList.add("annotation-pick-helper");
    const clonedRect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    clonedRect.setAttribute("width", imageStream.Width + "");
    clonedRect.setAttribute("height", imageStream.Height + "");   
    clonedRect.setAttribute("fill", "transparent");
    clonedRect.setAttribute("transform", `matrix(${imageMatrixString})`);
    clonedSvg.append(clonedRect);
    this._selectionCopies.push(clonedRect);

    return imageWrapper;
  }

  protected async drawTextAsync(textParam: OperatorParameter, 
    resources: ResourceDict): Promise<SvgElementWithBlendMode> {
    const textState = this.state.textState;
    const text = this.decodeTextParam(textParam, resources);

    if (!text) {
      console.log(`Can't decode the stream text parameter: '${textParam}'`);
      return null;
    }

    const svgText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    svgText.setAttribute("transform", `matrix(${
      new Mat3()
        .applyScaling(1, -1) // flip Y to negate the effect from the page-level SVG flipping
        .applyScaling(textState.horizontalScale, 1) // apply horizontal scaling
        .multiply(Mat3.multiply(textState.matrix, this.state.matrix))      
        .toFloatShortArray().join(" ")})`);
    svgText.setAttribute("x", "0");
    svgText.setAttribute("y", "0");
    svgText.textContent = text;
    svgText.style.fontFamily = textState.fontFamily;
    svgText.style.fontSize = textState.fontSize;
    svgText.style.lineHeight = textState.lineHeight;
    svgText.style.letterSpacing = textState.letterSpacing;
    svgText.style.wordSpacing = textState.wordSpacing;
    svgText.style.verticalAlign = textState.verticalAlign;
    svgText.style.whiteSpace = "pre";

    let stroke: boolean;
    let clip: boolean;
    
    switch (textState.renderMode) {
      case textRenderModes.FILL:
      default:
        svgText.style.fill = this.state.fill;
        break;
      case textRenderModes.STROKE: 
        svgText.style.fill = "none";
        stroke = true;
        break;
      case textRenderModes.FILL_STROKE:
        svgText.style.fill = this.state.fill;
        stroke = true;
        break;
      case textRenderModes.INVISIBLE:
        svgText.style.fill = "none";
        break;
      case textRenderModes.FILL_USE_AS_CLIP:
        svgText.style.fill = this.state.fill;
        clip = true;
        break;
      case textRenderModes.STROKE_USE_AS_CLIP: 
        svgText.style.fill = "none";
        stroke = true;
        clip = true;
        break;
      case textRenderModes.FILL_STROKE_USE_AS_CLIP:
        svgText.style.fill = this.state.fill;
        stroke = true;
        clip = true;
        break;
      case textRenderModes.USE_AS_CLIP:
        svgText.style.fill = "transparent";
        clip = true;
        break;
    }

    if (stroke) {      
      svgText.style.stroke = this.state.stroke;
      svgText.style.strokeWidth = this.state.strokeWidth + "";
      svgText.style.strokeMiterlimit = this.state.strokeMiterLimit + "";
      svgText.style.strokeLinecap = this.state.strokeLineCap;
      svgText.style.strokeLinejoin = this.state.strokeLineJoin;
      if (this.state.strokeDashArray) {
        svgText.style.strokeDasharray = this.state.strokeDashArray;        
      }
      if (this.state.strokeDashOffset) {
        svgText.style.strokeDashoffset = this.state.strokeDashOffset + "";        
      }
    } else {
      svgText.style.stroke = "none";
    }

    if (clip) {
      this.pushClipPath(svgText.cloneNode() as SVGGElement, true);
    }

    // TODO: find more elegant solution to get real text element width
    await new Promise((resolve, reject) => {
      const tempContainer = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      tempContainer.classList.add("annotation-content-element");
      tempContainer.setAttribute("viewBox", "0 0 100 100");
      tempContainer.style.width = "100px";
      tempContainer.style.height = "100px";
      tempContainer.style.zIndex = "-99";
      tempContainer.style.position = "fixed";
      tempContainer.style.left = "0";
      tempContainer.style.top = "0";
      tempContainer.append(svgText);
      document.body.append(tempContainer);
      setTimeout(() => {
        const width = svgText.getBBox().width;
        this.state.textState.moveAlongPx(width);
        svgText.remove();
        tempContainer.remove();
        resolve(true);
      }, 0);
    });

    return {element: svgText, blendMode: this.state.mixBlendMode || "normal"};
  }

  protected async drawTextGroupAsync(parser: DataParser, 
    resources: ResourceDict): Promise<SvgElementWithBlendMode[]> {
    const svgElements: SvgElementWithBlendMode[] = [];
    
    const textState = this.state.textState;

    let i = 0;
    while (i !== -1) {
      const {nextIndex, parameters, operator} = AppearanceStreamRenderer.parseNextCommand(parser, i);
      i = parser.skipEmpty(nextIndex);
        
      switch (operator) {
        //#region Text showing operators
        case "Tj": // show string ('{string} Tj')
          svgElements.push(await this.drawTextAsync(parameters[0], resources));
          break;
        case "'": // move to next line + show string ("{string} '" same as 'T* {string} Tj')
          textState.nextLine();
          svgElements.push(await this.drawTextAsync(parameters[0], resources));
          break;
        case "\"": // move to next line + show string with the specified spacings 
          // ('{a} {b} {c}' same as "{a} Tw {b} Tc {c} '")
          const [a, b, c] = parameters;
          textState.setWordSpacing(+a);
          textState.setLetterSpacing(+b);
          textState.nextLine();
          svgElements.push(await this.drawTextAsync(c, resources));
          break;
        case "TJ": // show array of strings ('[({string}) {spacing} ...n]TJ')
          for (const param of parameters) {
            if (param instanceof Uint8Array) {
              svgElements.push(await this.drawTextAsync(param, resources));
            } else if (typeof param === "number") { 
              if (+(param.toFixed(0)))  {
                textState.moveAlongPdfUnits(param);
              }
            }
          }
          break;
          //#endregion

        default:
          const operatorIsGraphicState = this.tryApplyingStateOperator(operator, parameters);
          if (!operatorIsGraphicState) {
            throw new Error(`Unsupported appearance stream operator: ${operator}`);
          }
      }
    }

    return svgElements.filter(x => x);
  }

  protected async drawStreamAsync(stream: XFormStream): Promise<SvgElementWithBlendMode[]> {
    const parser = new DataParser(stream.decodedStreamData);    
    const svgElements: SvgElementWithBlendMode[] = [];

    const lastCoord = new Vec2();
    let lastOperator: string;
    let d = "";
    let i = 0;
    while (i !== -1) {
      const {nextIndex, parameters, operator} = AppearanceStreamRenderer.parseNextCommand(parser, i);
      i = parser.skipEmpty(nextIndex + 1);
  
      switch (operator) {  
        //#region Path operators  
        //#region Path construction operators      
        case "m": // move
          const move = new Vec2(+parameters[0], +parameters[1]);
          d += ` M ${move.x} ${move.y}`;
          lastCoord.setFromVec2(move);
          break;      
        case "l": // line to
          const line = new Vec2(+parameters[0], +parameters[1]);
          d += ` L ${line.x} ${line.y}`;
          lastCoord.setFromVec2(line);
          break;     
        case "re": // rect
          const rMin = new Vec2(+parameters[0], +parameters[1]);
          const rMax = new Vec2(+parameters[2], +parameters[3]).add(rMin);
          d += ` M ${rMin.x} ${rMin.y} L ${rMax.x} ${rMin.y} L ${rMax.x} ${rMax.y} L ${rMin.x} ${rMax.y} L ${rMin.x} ${rMin.y}`;
          lastCoord.setFromVec2(rMin);
          break;   
        case "c": // cubic-bezier 1
          const cControl1 = new Vec2(+parameters[0], +parameters[1]);
          const cControl2 = new Vec2(+parameters[2], +parameters[3]);
          const cEnd = new Vec2(+parameters[4], +parameters[5]);
          d += ` C ${cControl1.x} ${cControl1.y}, ${cControl2.x} ${cControl2.y}, ${cEnd.x} ${cEnd.y}`;
          lastCoord.setFromVec2(cEnd);
          break;   
        case "v": // cubic-bezier 2
          const vControl2 = new Vec2(+parameters[0], +parameters[1]);
          const vEnd = new Vec2(+parameters[2], +parameters[3]);
          d += ` C ${lastCoord.x} ${lastCoord.y}, ${vControl2.x} ${vControl2.y}, ${vEnd.x} ${vEnd.y}`;
          lastCoord.setFromVec2(vEnd);
          break;
        case "y": // cubic-bezier 3
          const yControl1 = new Vec2(+parameters[0], +parameters[1]);
          const yEnd = new Vec2(+parameters[2], +parameters[3]);
          d += ` C ${yControl1.x} ${yControl1.y}, ${yEnd.x} ${yEnd.y}, ${yEnd.x} ${yEnd.y}`;
          lastCoord.setFromVec2(yEnd);
          break;    
        case "h": // close
          d += " Z";
          break;
        //#endregion
        //#region Path painting operators        
        case "S": // stroke          
          svgElements.push(this.drawPath(d, true, false));
          d = "";
          break;
        case "s": // close + stroke
          svgElements.push(this.drawPath(d, true, false, true));
          d = "";
          break;
        case "F": // close + fill (non-zero)
        case "f": // same
          svgElements.push(this.drawPath(d, false, true, true));
          d = "";
          break;
        case "F*": // close + fill (even-odd)
        case "f*": // same
          svgElements.push(this.drawPath(d, false, true, true, true));
          d = "";
          break;
        case "B": // fill (non-zero) + stroke
          svgElements.push(this.drawPath(d, true, true, false, false));
          d = "";
          break;
        case "B*": // fill (even-odd) + stroke
          svgElements.push(this.drawPath(d, true, true, false, true));
          d = "";
          break;
        case "b": // close + fill (non-zero) + stroke
          svgElements.push(this.drawPath(d, true, true, true, false));
          d = "";
          break;
        case "b*": // close + fill (even-odd) + stroke
          svgElements.push(this.drawPath(d, true, true, true, true));
          d = "";
          break;
        case "n": // end path without stroking or filling
          if (lastOperator === "W" || lastOperator === "W*") {
            if (d[d.length - 1] !== "Z") {
              d += " Z";
            }    
            const clippingPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            clippingPath.setAttribute("d", d);
            this.pushClipPath(clippingPath, lastOperator === "W");
          }
          d = "";          
          break;    
          //#endregion
        //#region Path clipping operators    
        case "W": // intersect current path with the clipping path (non-zero)
          // do nothing except setting lastOperator value to 'W'
          break;
        case "W*": // intersect current path with the clipping path (even-odd)
          // do nothing except setting lastOperator value to 'W*'
          break;
          //#endregion
          //#endregion

        case "BT": // Text object
          const textObjectEnd = parser.findSubarrayIndex([codes.E, codes.T], {
            closedOnly: true, 
            minIndex: i,
          });
          if (textObjectEnd) {     
            const textParser = new DataParser(parser.sliceCharCodes(i, textObjectEnd.start - 1)); 
            const textGroup = await this.drawTextGroupAsync(textParser, stream.Resources);
            svgElements.push(...textGroup);
            i = parser.skipEmpty(textObjectEnd.end + 1);
            break;
          }
          throw new Error("Can't find the appearance stream text object end");
          
        case "Do": // Nested stream or image
          const innerStream = stream.Resources.getXObject((`/XObject${parameters[0]}`));
          if (!innerStream) {            
            throw new Error(`External object not found in the appearance stream resources: ${parameters[0]}`);
          }
          if (innerStream instanceof XFormStream) {
            // push the transformation matrix onto the stack
            const [im0, im1, im3, im4, im6, im7] = innerStream.Matrix;
            const innerMat = new Mat3().set(im0, im1, 0, im3, im4, 0, im6, im7, 1);
            this.pushState();
            this.state.matrix = innerMat.multiply(this.state.matrix);

            // render the inner stream
            const innerStreamSvgElements = await this.drawStreamAsync(innerStream);
            svgElements.push(...innerStreamSvgElements);

            // pop the matrix
            this.popState();

          } else if (innerStream instanceof ImageStream) {  
            // render the image 
            const image = await this.drawImageAsync(innerStream);
            svgElements.push({ 
              element: image, 
              blendMode: this.state.mixBlendMode || "normal" 
            });
          } else {            
            throw new Error(`Unsupported appearance stream external object: ${parameters[0]}`);
          }
          break;

        default:
          const operatorIsGraphicState = this.tryApplyingStateOperator(operator, parameters);
          if (!operatorIsGraphicState) {
            throw new Error(`Unsupported appearance stream operator: ${operator}`);
          }
      }
      lastOperator = operator;
    }
    return svgElements;
  }
}
