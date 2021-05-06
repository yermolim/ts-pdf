import { RenderToSvgResult, Quadruple, Hextuple } from "../../common/types";
import { Mat3, mat3From4Vec2, Vec2, vecMinMax } from "../../common/math";
import { selectionStrokeWidth } from "../../common/drawing";
import { codes } from "../codes";
import { colorSpaces, lineCapStyles, lineJoinStyles, valueTypes } from "../const";

import { DataParser } from "../data-parser";
import { ImageStream } from "../entities/streams/image-stream";
import { XFormStream } from "../entities/streams/x-form-stream";
import { HexString } from "../entities/strings/hex-string";
import { LiteralString } from "../entities/strings/literal-string";
import { GraphicsState, GraphicsStateParams } from "./graphics-state";

/**appearance stream command */
interface ParsedCommand {  
  endIndex: number;
  parameters: (number | string | Uint8Array)[];
  operator: string;
}

export class AppearanceStreamRenderer {
  protected readonly _stream: XFormStream;
  protected readonly _rect: Quadruple;
  protected readonly _objectName: string;

  // protected _cropBox: {min: Vec2; max: Vec2};
  protected _clipPaths: SVGClipPathElement[] = [];
  protected _graphicsStates: GraphicsState[] = [];
  get state(): GraphicsState {
    return this._graphicsStates[this._graphicsStates.length - 1];
  }

  /**
   * 
   * @param stream appearance stream
   * @param rect parent PDF object AABB coordinates in the page coordinate system
   * @param objectName PDF object name (it is desirable to be unique)
   */
  constructor(stream: XFormStream, rect: Quadruple, objectName: string) {
    if (!stream) {
      throw new Error("Stream is not defined");
    }
    this._stream = stream;
    this._rect = rect;
    this._objectName = objectName; 

    const {matAA} = AppearanceStreamRenderer.calcBBoxToRectMatrices(stream.BBox, rect, stream.Matrix);

    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.id = `clip0_${objectName}`;
    clipPath.innerHTML = `<rect x="${rect[0]}" y="${rect[1]}" width="${rect[2] - rect[0]}" height="${rect[3] - rect[1]}" />`;
    this._clipPaths.push(clipPath);

    this._graphicsStates.push(new GraphicsState({matrix: matAA}));
  }  

  /**
   * calculate the transformation matrix between the stream bounding box and the specified AABB
   * @param bBox source AABB in the page coordinate system
   * @param rect target AABB coordinates in the page coordinate system
   * @param matrix optional transformation from the source AABB to properly oriented BB
   * @returns transformation matrices (matAA is the final matrix)
   */
  static calcBBoxToRectMatrices(bBox: Quadruple, rect: Quadruple, matrix?: Hextuple): 
  {matAP: Mat3; matA: Mat3; matAA: Mat3} {          
    const matAP = new Mat3();
    if (matrix) {
      const [m0, m1, m3, m4, m6, m7] = matrix;
      matAP.set(m0, m1, 0, m3, m4, 0, m6, m7, 1);
    } 
    const bBoxLL = new Vec2(bBox[0], bBox[1]);
    const bBoxLR = new Vec2(bBox[2], bBox[1]);
    const bBoxUR = new Vec2(bBox[2], bBox[3]);
    const bBoxUL = new Vec2(bBox[0], bBox[3]);
    /*
    The appearance’s bounding box (specified by its BBox entry) is transformed, 
    using Matrix, to produce a quadrilateral with arbitrary orientation. 
    The transformed appearance box is the smallest upright rectangle 
    that encompasses this quadrilateral.
    */
    const {min: appBoxMin, max: appBoxMax} = vecMinMax(
      Vec2.applyMat3(bBoxLL, matAP),
      Vec2.applyMat3(bBoxLR, matAP), 
      Vec2.applyMat3(bBoxUR, matAP),
      Vec2.applyMat3(bBoxUL, matAP), 
    );
    /*
    A matrix A is computed that scales and translates the transformed appearance box 
    to align with the edges of the annotation’s rectangle (specified by the Rect entry). 
    A maps the lower-left corner (the corner with the smallest x and y coordinates) 
    and the upper-right corner (the corner with the greatest x and y coordinates) 
    of the transformed appearance box to the corresponding corners of the annotation’s rectangle
    */   
    const rectMin = new Vec2(rect[0], rect[1]);
    const rectMax = new Vec2(rect[2], rect[3]);
    const matA = mat3From4Vec2(appBoxMin, appBoxMax, rectMin, rectMax);
    /*
    Matrix is concatenated with A to form a matrix AA that maps from 
    the appearance’s coordinate system to the annotation’s rectangle in default user space
    */
    const matAA = Mat3.fromMat3(matAP).multiply(matA);

    // DEBUG
    // console.log(matAP.toFloatShortArray());
    // console.log(matA.toFloatShortArray());
    // console.log(matAA.toFloatShortArray());    

    return {matAP, matA, matAA};
  }

  /**
   * 
   * @param parser 
   * @param i byte offset from the stream start
   * @returns 
   */
  protected static parseNextCommand(parser: DataParser, i: number): ParsedCommand {
    const parameters: (number | string | Uint8Array)[] = [];
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
          const numberArrayResult = parser.parseNumberArrayAt(i, true);
          if (numberArrayResult) {
            // should be number array (for dash pattern)
            const dashArray = numberArrayResult.value;
            if (dashArray.length === 2) {
              parameters.push(...dashArray);
            } else if (dashArray.length === 1) {
              parameters.push(dashArray[0], 0);
            } else {
              parameters.push(3, 0);
            }
          } else {
            throw new Error(`Invalid appearance stream array: 
            ${parser.sliceChars(arrayBounds.start, arrayBounds.end)}`);
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
    return {endIndex: i, parameters, operator};
  }

  /**
   * render appearance stream to an SVG element
   * @returns 
   */
  async renderAsync(): Promise<RenderToSvgResult> {
    const g = await this.drawGroupAsync(this._stream);
    return {
      svg: g, 
      clipPaths: this._clipPaths,
    };
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

  protected drawPath(parent: SVGGraphicsElement, d: string, 
    stroke: boolean, fill: boolean, close = false, evenOdd = false) {
    if (close && d[d.length - 1] !== "Z") {
      d += " Z";
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("transform", `matrix(${this.state.matrix.toFloatShortArray().join(" ")})`);
    path.setAttribute("clipPath", `url(#${this._clipPaths[this._clipPaths.length - 1].id})`); // TODO: test
    path.setAttribute("d", d);

    if (this.state.mixBlendMode && this.state.mixBlendMode !== "normal") {
      // TODO: try to implement applying blend modes individually to every path somehow
    }

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

    parent.append(path);
    
    if (!stroke || this.state.strokeWidth < selectionStrokeWidth) {
      // create a transparent path copy with large stroke width to simplify user interaction
      const clonedPath = path.cloneNode(true) as SVGPathElement;
      clonedPath.setAttribute("stroke-width", selectionStrokeWidth + "");
      clonedPath.setAttribute("stroke", "transparent");
      clonedPath.setAttribute("fill", "none");
      parent.append(clonedPath);
    }
  }

  protected drawText(value: string): SVGTextElement {
    // TODO: implement
    throw new Error("Method is not implemented");
  }

  protected drawTextGroup(parser: DataParser): SVGGElement {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    let i = 0;
    while (i !== -1) {
      const {endIndex, parameters, operator} = AppearanceStreamRenderer.parseNextCommand(parser, i);
      i = parser.skipEmpty(endIndex + 1);
  
      switch (operator) {
        //#region Text state operators
        // TODO: implement operators
        //#endregion

        //#region Text positioning operators
        // TODO: implement operators
        //#endregion

        //#region Text showing operators
        // TODO: implement operators
        case "Tj": // show string
          break;
        case "'": // move to next line + show string
          break;
        case "\"": // move to next line + show string with the specified spacings
          break;
        case "TJ": // show array of strings
          break;
          //#endregion

        default:
          break; // TODO: remove break after implementing operators
          // throw new Error(`Unsupported appearance stream text operator: ${operator}`);
      }
    }
    return g;
  }

  protected async drawGroupAsync(stream: XFormStream): Promise<SVGGElement> {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    const parser = new DataParser(stream.decodedStreamData);    

    const lastCoord = new Vec2();
    let lastOperator: string;
    let d = "";
    let i = 0;
    while (i !== -1) {
      const {endIndex, parameters, operator} = AppearanceStreamRenderer.parseNextCommand(parser, i);
      i = parser.skipEmpty(endIndex + 1);
  
      switch (operator) {
        //#region State operators
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
          this.state.strokeDashArray = `${parameters[0]} ${parameters[1]}`;
          this.state.strokeDashOffset = +parameters[2];
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
          //#endregion
  
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
          this.drawPath(g, d, true, false);
          d = "";
          break;
        case "s": // close + stroke
          this.drawPath(g, d, true, false, true);
          d = "";
          break;
        case "F": // close + fill (non-zero)
        case "f": // same
          this.drawPath(g, d, false, true, true);
          d = "";
          break;
        case "F*": // close + fill (even-odd)
        case "f*": // same
          this.drawPath(g, d, false, true, true, true);
          d = "";
          break;
        case "B": // fill (non-zero) + stroke
          this.drawPath(g, d, true, true, false, false);
          d = "";
          break;
        case "B*": // fill (even-odd) + stroke
          this.drawPath(g, d, true, true, false, true);
          d = "";
          break;
        case "b": // close + fill (non-zero) + stroke
          this.drawPath(g, d, true, true, true, false);
          d = "";
          break;
        case "b*": // close + fill (even-odd) + stroke
          this.drawPath(g, d, true, true, true, true);
          d = "";
          break;
        case "n": // end path without stroking or filling
          if (lastOperator === "W" || lastOperator === "W*") {
            if (d[d.length - 1] !== "Z") {
              d += " Z";
            }

            const clippingPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
            // clippingPath.setAttribute("transform", `matrix(${this.state.matrix.toFloatShortArray().join(" ")})`); // ???
            clippingPath.setAttribute("d", d);

            const lastCpIndex = this._clipPaths.length - 1;
            const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
            clipPath.setAttribute("clip-rule", lastOperator === "W" ? "nonzero" : "evenodd");
            clipPath.setAttribute("clip-path", `url(#${this._clipPaths[lastCpIndex]})`);
            clipPath.id = `clip${lastCpIndex + 1}_${this._objectName}`;
            clipPath.append(clippingPath);

            this._clipPaths.push(clipPath);
            this.state.clipPath = clipPath;
          }
          d = "";          
          break;    
          //#endregion
        //#region Path clipping operators    
        case "W": // intersect current path with the clipping path
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
            const textGroup = this.drawTextGroup(new DataParser(parser.sliceCharCodes(i, textObjectEnd.start - 1)));
            g.append(textGroup);
            i = parser.skipEmpty(textObjectEnd.end + 1);
            break;
          }
          throw new Error("Can't find the appearance stream text object end");
          
        case "Do":
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
            const subGroup = await this.drawGroupAsync(innerStream);
            g.append(subGroup);

            // pop the matrix
            this.popState();

          } else if (innerStream instanceof ImageStream) {   
            const url = await innerStream.getImageUrlAsync();
            if (!url) {              
              throw new Error("Can't get image url from external image stream");
            }

            const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
            image.onerror = e => {
              console.log(`Loading external image stream failed: ${e}`);
            };
            image.setAttribute("href", url);
            image.setAttribute("width", innerStream.Width + "");
            image.setAttribute("height", innerStream.Height + "");   
            const imageMatrix = new Mat3()
              .applyTranslation(-innerStream.Width / 2, -innerStream.Height / 2)
              .applyScaling(1, -1) // flip Y to negate the effect from the page-level SVG flipping
              .applyTranslation(innerStream.Width / 2, innerStream.Height / 2)
              .applyScaling(1 / innerStream.Width, 1 / innerStream.Height)
              .multiply(this.state.matrix);                     
            image.setAttribute("transform", `matrix(${imageMatrix.toFloatShortArray().join(" ")})`);
            image.setAttribute("clipPath", `url(#${this._clipPaths[this._clipPaths.length - 1].id})`); // TODO: test
            g.append(image);
          } else {            
            throw new Error(`Unsupported appearance stream external object: ${parameters[0]}`);
          }
          break;

        default:
          throw new Error(`Unsupported appearance stream operator: ${operator}`);
      }
      lastOperator = operator;
    }
    return g;
  }
}
