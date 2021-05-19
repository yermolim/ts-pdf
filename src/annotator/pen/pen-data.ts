import { Vec2 } from "../../common/math";
import { Quadruple } from "../../common/types";

interface PathData {
  path: SVGPathElement;
  positions: Vec2[];
}

export interface PenDataOptions {
  /**smoothing filter position buffer (higher values mean smoother lines but less performance) */
  bufferSize?: number; 
  strokeWidth?: number;  
  color?: Quadruple;
  id?: number;
}

/**a class used for drawing smooth SVG paths */
export class PenData {
  static readonly defaultOptions: PenDataOptions = {
    bufferSize: 8, 
    strokeWidth: 2,
    color: [0, 0, 0, 0.5],
  };  
  private _options: PenDataOptions;
  get id(): number {
    return this._options.id;
  }
  get bufferSize(): number {
    return this._options.bufferSize;
  }
  get strokeWidth(): number {
    return this._options.strokeWidth;
  } 
  get color(): Quadruple {
    return <Quadruple><unknown>this._options.color.slice();
  }

  private _group: SVGGraphicsElement;
  get group(): SVGGraphicsElement {
    return this._group;
  }

  private _paths: PathData[] = []; 
  get paths(): PathData[] {
    return this._paths.slice();
  }
  get pathCount(): number {
    return this._paths.length;
  }
 
  private _positionBuffer: Vec2[] = [];
  private _currentPath: PathData;
  private _currentPathString: string;

  constructor(options?: PenDataOptions) {
    this._options = Object.assign({}, PenData.defaultOptions, options);
    this._group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  }

  newPath(startPosition: Vec2) {
    const [r, g, b, a] = this._options.color || [0, 0, 0, 1];
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", `rgba(${r * 255},${g * 255},${b * 255},${a})`);
    path.setAttribute("stroke-width", this._options.strokeWidth + "");
    path.setAttribute("stroke-linecap", "round");    
    path.setAttribute("stroke-linejoin", "round");

    const pathString = "M" + startPosition.x + " " + startPosition.y;
    path.setAttribute("d", pathString);

    this._positionBuffer = [startPosition];
    this._currentPath = {path, positions: [new Vec2(startPosition.x, startPosition.y)]};
    this._currentPathString = pathString;
    this._group.append(path);
  }

  endPath() {    
    if (this._currentPath && this._currentPath.positions.length > 1) {      
      this._paths.push(this._currentPath);
    }
    this._positionBuffer = null;
    this._currentPath = null;
    this._currentPathString = null;
  }

  removePath(path: SVGPathElement) {
    if (!path) {
      return;
    }
    path.remove();
    this._paths = this._paths.filter(x => x.path !== path);
  }

  removeLastPath() {
    const pathData = this._paths.pop();
    pathData?.path.remove();
  }

  addPosition(pos: Vec2) {
    this.appendPositionToBuffer(pos);
    this.updateCurrentPath();
  }
  
  private appendPositionToBuffer(pos: Vec2) {
    const buffer = this._positionBuffer;
    buffer.push(pos);
    // keep the buffer from oversizing
    this._positionBuffer = buffer
      .slice(Math.max(0, buffer.length - this._options.bufferSize), buffer.length);
  }

  /**
   * get an average buffer position starting from the specified offset
   * @param offset must not exceed the buffer max index
   * @returns average position vector
   */
  private getAverageBufferPosition(offset: number): Vec2 {
    const len = this._positionBuffer.length;
    if (len >= this._options.bufferSize) {
      let totalX = 0;
      let totalY = 0;
      let pos: Vec2;
      let i: number;
      let count = 0;
      for (i = offset; i < len; i++) {
        count++;
        pos = this._positionBuffer[i];
        totalX += pos.x;
        totalY += pos.y;
      }
      return new Vec2(totalX / count, totalY / count);
    }
    // the buffer is not filled
    return null;
  }  

  private updateCurrentPath() {
    let pos = this.getAverageBufferPosition(0);
    if (!pos) {
      return;
    }

    // append the whole buffer average position to the path 
    // it will not change
    this._currentPathString += " L" + pos.x + " " + pos.y;
    this._currentPath.positions.push(pos);

    // calculate the last part of the path (close to the current pointer position)
    // this part is temporary and it will change if the pointer moves again
    let tmpPath = "";
    for (let offset = 2; offset < this._positionBuffer.length; offset += 2) {
      pos = this.getAverageBufferPosition(offset);
      tmpPath += " L" + pos.x + " " + pos.y;
    }

    // Set the complete current path coordinates
    this._currentPath.path.setAttribute("d", this._currentPathString + tmpPath);
  }
}
