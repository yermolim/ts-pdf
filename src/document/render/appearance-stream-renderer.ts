import { RenderToSvgResult } from "../../common";
import { Mat3, mat3From4Vec2, Vec2, vecMinMax } from "../../math";
import { codes } from "../codes";
import { colorSpaces, lineCapStyles, lineJoinStyles, valueTypes } from "../const";
import { Rect } from "../common-interfaces";
import { DataParser } from "../data-parser";
import { ImageStream } from "../entities/streams/image-stream";
import { XFormStream } from "../entities/streams/x-form-stream";
import { HexString } from "../entities/strings/hex-string";
import { LiteralString } from "../entities/strings/literal-string";
import { GraphicsState, GraphicsStateParams } from "./graphics-state";

interface ParsedCommand {  
  endIndex: number;
  parameters: (number | string | Uint8Array)[];
  operator: string;
}

export class AppearanceStreamRenderer {
  protected readonly _stream: XFormStream;
  protected readonly _parser: DataParser;
  protected readonly _rect: Rect;
  protected readonly _objectName: string;

  // protected _cropBox: {min: Vec2; max: Vec2};
  protected _clipPaths: SVGClipPathElement[] = [];
  protected _graphicsStates: GraphicsState[] = [];
  get state(): GraphicsState {
    return this._graphicsStates[this._graphicsStates.length - 1];
  }

  constructor(stream: XFormStream, rect: Rect, objectName: string) {
    if (!stream) {
      throw new Error("Stream is not defined");
    }
    this._stream = stream;
    this._parser = new DataParser(stream.decodedStreamData);
    this._rect = rect;
    this._objectName = objectName; 

    const matAA = AppearanceStreamRenderer.calcBBoxToRectMatrix(stream, rect);

    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.id = `clip0_${objectName}`;
    clipPath.innerHTML = `<rect x="${rect[0]}" y="${rect[1]}" width="${rect[2] - rect[0]}" height="${rect[3] - rect[1]}" />`;
    this._clipPaths.push(clipPath);

    this._graphicsStates.push(new GraphicsState({matrix: matAA}));
  }  

  protected static calcBBoxToRectMatrix(stream: XFormStream, rect: Rect): Mat3 {
    const matrix = stream.matrix;
    const {ll: bBoxLL, lr: bBoxLR, ur: bBoxUR, ul: bBoxUL} = stream.bBox;
    /*
    The appearance’s bounding box (specified by its BBox entry) is transformed, 
    using Matrix, to produce a quadrilateral with arbitrary orientation. 
    The transformed appearance box is the smallest upright rectangle 
    that encompasses this quadrilateral.
    */
    const {min: appBoxMin, max: appBoxMax} = vecMinMax(
      Vec2.applyMat3(bBoxLL, matrix),
      Vec2.applyMat3(bBoxLR, matrix), 
      Vec2.applyMat3(bBoxUR, matrix),
      Vec2.applyMat3(bBoxUL, matrix), 
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
    const matAA = Mat3.fromMat3(matrix).multiply(matA);

    return matAA;
  }

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

  async renderAsync(): Promise<RenderToSvgResult> {
    const g = await this.drawGroupAsync(this._parser);
    return {
      svg: g, 
      clipPaths: this._clipPaths,
    };
  }

  protected pushState(params?: GraphicsStateParams) {
    const lastState = this._graphicsStates[this._graphicsStates.length - 1];
    const newState = lastState.clone(params);
    this._graphicsStates.push(newState);
  }
  
  protected popState(): GraphicsState {
    if (this._graphicsStates.length === 1) {
      // can't pop the only state
      return null;
    }
    return this._graphicsStates.pop();
  }

  protected drawPath(d: string, stroke: boolean, fill: boolean, 
    close = false, evenOdd = false): SVGPathElement {
    if (close && d[d.length - 1] !== "Z") {
      d += " Z";
    }

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("transform", `matrix(${this.state.matrix.toFloatShortArray().join(" ")})`);
    path.setAttribute("clipPath", `url(#${this._clipPaths[this._clipPaths.length - 1].id})`); // TODO: test
    path.setAttribute("d", d);

    if (this.state.mixBlendMode) {
      path.setAttribute("mix-blend-mode", this.state.mixBlendMode);
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
    
    return path;
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

  protected async drawGroupAsync(parser: DataParser): Promise<SVGGElement> {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");

    const lastCoord = new Vec2();
    let lastOperator: string;
    let d = "";  
    const addPath = (path: SVGPathElement) => {      
      g.append(path);
      d = "";
    };  
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
          addPath(this.drawPath(d, true, false));
          break;
        case "s": // close + stroke
          addPath(this.drawPath(d, true, false, true));
          break;
        case "F": // close + fill (non-zero)
        case "f": // same
          addPath(this.drawPath(d, false, true, true));
          break;
        case "F*": // close + fill (even-odd)
        case "f*": // same
          addPath(this.drawPath(d, false, true, true, true));
          break;
        case "B": // fill (non-zero) + stroke
          addPath(this.drawPath(d, true, true, false, false));
          break;
        case "B*": // fill (even-odd) + stroke
          addPath(this.drawPath(d, true, true, false, true));
          break;
        case "b": // close + fill (non-zero) + stroke
          addPath(this.drawPath(d, true, true, true, false));
          break;
        case "b*": // close + fill (even-odd) + stroke
          addPath(this.drawPath(d, true, true, true, true));
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
          const stream = this._stream.Resources.getXObject((`/XObject${parameters[0]}`));
          if (!stream) {            
            throw new Error(`External object not found in the appearance stream resources: ${parameters[0]}`);
          }
          if (stream instanceof XFormStream) {
            const subGroup = await this.drawGroupAsync(new DataParser(stream.decodedStreamData));
            g.append(subGroup);
          } else if (stream instanceof ImageStream) {   
            const url = await stream.getImageUrlAsync();
            if (!url) {              
              throw new Error("Can't get image url from external image stream");
            }

            const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
            image.onerror = e => {
              console.log(`Loading external image stream failed: ${e}`);
            };
            image.setAttribute("href", url);
            image.setAttribute("width", stream.Width + "");
            image.setAttribute("height", stream.Height + "");   
            const imageMatrix = new Mat3()
              .applyTranslation(-stream.Width / 2, -stream.Height / 2)
              .applyScaling(1, -1) // flip Y to negate the effect from the page-level SVG flipping
              .applyTranslation(stream.Width / 2, stream.Height / 2)
              .applyScaling(1 / stream.Width, 1 / stream.Height)
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
