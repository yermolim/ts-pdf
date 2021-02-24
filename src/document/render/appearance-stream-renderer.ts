import { SvgWithBox } from "../../common";
import { Mat3, mat3From4Vec2, Vec2 } from "../../math";
import { colorSpaces, lineCapStyles, lineJoinStyles, Rect, valueTypes } from "../const";
import { DataParser } from "../data-parser";
import { XFormStream } from "../entities/streams/x-form-stream";
import { GraphicsState, GraphicsStateParams } from "./graphics-state";

interface ParsedCommand {  
  endIndex: number;
  parameters: (number | string)[];
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
    

    const matAA = AppearanceStreamRenderer.calcMatrix(stream, rect);

    const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
    clipPath.id = `clip0-${objectName}`;
    clipPath.innerHTML = `<rect x="${rect[0]}" y="${rect[1]}" width="${rect[2] - rect[0]}" height="${rect[3] - rect[1]}" />`;
    this._clipPaths.push(clipPath);
    // FIX

    this._graphicsStates.push(new GraphicsState({matrix: matAA}));
  }  

  protected static calcMatrix(stream: XFormStream, rect: Rect): Mat3 {
    const matrix = new Mat3();
    if (stream.Matrix) {
      const [m0, m1, m3, m4, m6, m7] = stream.Matrix;
      matrix.set(m0, m1, 0, m3, m4, 0, m6, m7, 1);
    }
    const boxMin = new Vec2(stream.BBox[0], stream.BBox[1]);
    const boxMax = new Vec2(stream.BBox[2], stream.BBox[3]);
    /*
    The appearance’s bounding box (specified by its BBox entry) is transformed, 
    using Matrix, to produce a quadrilateral with arbitrary orientation. 
    The transformed appearance box is the smallest upright rectangle 
    that encompasses this quadrilateral.
    */
    const tBoxMin = Vec2.applyMat3(boxMin, matrix);
    const tBoxMax = Vec2.applyMat3(boxMax, matrix);
    /*
    A matrix A is computed that scales and translates the transformed appearance box 
    to align with the edges of the annotation’s rectangle (specified by the Rect entry). 
    A maps the lower-left corner (the corner with the smallest x and y coordinates) 
    and the upper-right corner (the corner with the greatest x and y coordinates) 
    of the transformed appearance box to the corresponding corners of the annotation’s rectangle
    */   
    const rectMin = new Vec2(rect[0], rect[1]);
    const rectMax = new Vec2(rect[2], rect[3]);
    const matA = mat3From4Vec2(tBoxMin, tBoxMax, rectMin, rectMax);
    /*
    Matrix is concatenated with A to form a matrix AA that maps from 
    the appearance’s coordinate system to the annotation’s rectangle in default user space
    */
    const matAA = Mat3.fromMat3(matrix).multiply(matA);
    
    return matAA;
  }

  protected static parseNextCommand(parser: DataParser, i: number): ParsedCommand {
    const parameters: (number | string)[] = [];
    let operator: string;
    // parse parameters and operator
    command: while (!operator) {
      const nextValueType = parser.getValueTypeAt(i, true);
      switch (nextValueType) {
        case valueTypes.NUMBER:
          // should be parameter
          const numberResult = parser.parseNumberAt(i, true);
          parameters.push(numberResult.value);
          i = numberResult.end + 1;
          break;
        case valueTypes.NAME:
          // should be parameter
          const nameResult = parser.parseNameAt(i, true);
          parameters.push(nameResult.value);
          i = nameResult.end + 1;
          break;
        case valueTypes.ARRAY:
          const arrayBounds = parser.getArrayBoundsAt(i);
          const numberArrayResult = parser.parseNumberArrayAt(i, true);
          if (numberArrayResult) {
            // should be number array (for dash pattern)
            parameters.push(...numberArrayResult.value);
          } else {
            throw new Error(`Invalid appearance stream array: 
            ${parser.sliceChars(arrayBounds.start, arrayBounds.end)}`);
          }
          i = arrayBounds.end + 1;
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

  render(): SvgWithBox {
    const outerGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
    outerGroup.setAttribute("data-name", this._objectName);
    // outerGroup.setAttribute("clipPath", `url(#${this._clipPaths[0].id})`);
    // outerGroup.setAttribute("transform", `matrix(${Mat3.invert(this.state.matrix).toFloatShortArray().join(" ")})`);

    // const width = this._cropBox.max.x - this._cropBox.min.x;
    // const height = this._cropBox.max.y - this._cropBox.min.y;
    // svg.setAttribute("viewBox", `0 0 ${width} ${height}`);  


    const lastCoord = new Vec2();
    let lastOperator: string;
    let d = "";  
    const addPath = (path: SVGPathElement) => {      
      outerGroup.append(path);
      d = "";
    };  
    let i = 0;
    while (i !== -1) {
      const {endIndex, parameters, operator} = AppearanceStreamRenderer.parseNextCommand(this._parser, i);
      i = this._parser.skipEmpty(endIndex + 1);
  
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
          const externalState = this._stream.Resources.getGraphicsState(`/ExtGState${<string>parameters[0]}`);
          if (!externalState) {
            throw new Error("External state specified in appearance stream not found");
          }
          const params = externalState.toParams();
          Object.assign(this.state, params);
          break;
        case "cm": // apply transformation matrix
          const [m0, m1, m3, m4, m6, m7] = <number[]>parameters;
          const matrix = new Mat3().set(m0, m1, 0, m3, m4, 0, m6, m7, 1);
          this.state.matrix.multiply(matrix);
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
          move.applyMat3(this.state.matrix);
          d += ` M ${move.x} ${move.y}`;
          lastCoord.setFromVec2(move);
          break;      
        case "l": // line to
          const line = new Vec2(+parameters[0], +parameters[1]);
          line.applyMat3(this.state.matrix);
          d += ` L ${line.x} ${line.y}`;
          lastCoord.setFromVec2(line);
          break;     
        case "re": // rect
          const rMin = new Vec2(+parameters[0], +parameters[1]);
          const rMax = new Vec2(+parameters[2], +parameters[3]).add(rMin);
          rMin.applyMat3(this.state.matrix);
          rMax.applyMat3(this.state.matrix);
          d += ` M ${rMin.x} ${rMin.y} L ${rMax.x} ${rMin.y} L ${rMax.x} ${rMax.y} L ${rMin.x, rMax.y} L ${rMin.x} ${rMin.y}`;
          lastCoord.setFromVec2(rMin);
          break;   
        case "c": // cubic-bezier 1
          const cControl1 = new Vec2(+parameters[0], +parameters[1]);
          const cControl2 = new Vec2(+parameters[2], +parameters[3]);
          const cEnd = new Vec2(+parameters[4], +parameters[5]);
          cControl1.applyMat3(this.state.matrix);
          cControl2.applyMat3(this.state.matrix);
          cEnd.applyMat3(this.state.matrix);
          d += ` C ${cControl1.x} ${cControl1.y}, ${cControl2.x} ${cControl2.y}, ${cEnd.x} ${cEnd.y}`;
          lastCoord.setFromVec2(cEnd);
          break;   
        case "v": // cubic-bezier 2
          const vControl2 = new Vec2(+parameters[0], +parameters[1]);
          const vEnd = new Vec2(+parameters[2], +parameters[3]);
          vControl2.applyMat3(this.state.matrix);
          vEnd.applyMat3(this.state.matrix);
          d += ` C ${lastCoord.x} ${lastCoord.y}, ${vControl2.x} ${vControl2.y}, ${vEnd.x} ${vEnd.y}`;
          lastCoord.setFromVec2(vEnd);
          break;
        case "y": // cubic-bezier 3
          const yControl1 = new Vec2(+parameters[0], +parameters[1]);
          const yEnd = new Vec2(+parameters[2], +parameters[3]);
          yControl1.applyMat3(this.state.matrix);
          yEnd.applyMat3(this.state.matrix);
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
            clippingPath.setAttribute("transform", `matrix(${this.state.matrix.toFloatShortArray().join(" ")})`);
            clippingPath.setAttribute("d", d);

            const lastCpIndex = this._clipPaths.length - 1;
            const clipPath = document.createElementNS("http://www.w3.org/2000/svg", "clipPath");
            clipPath.setAttribute("clip-rule", lastOperator === "W" ? "nonzero" : "evenodd");
            clipPath.setAttribute("clip-path", `url(#${this._clipPaths[lastCpIndex]})`);
            clipPath.id = `clip${lastCpIndex + 1}-${this._objectName}`;

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

        default:
          throw new Error(`Unsupported appearance stream operator: ${operator}`);
      }

      lastOperator = operator;
    }

    console.log(outerGroup);

    return {
      svg: outerGroup, 
      clipPaths: this._clipPaths, 
      box: {
        min: new Vec2(this._rect[0], this._rect[1]), 
        max: new Vec2(this._rect[2], this._rect[3]),
      },
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
}
