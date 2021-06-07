import { Vec2 } from "mathador";
import { Quadruple } from "../../common/types";

export interface SmoothPathData {
  positions: Vec2[];
}

export interface SmoothPathOptions {
  /**smoothing filter position buffer (higher values mean smoother lines but less performance) */
  bufferSize?: number;
  id?: number;
}

/**a class used for drawing smooth SVG paths */
export abstract class SmoothPath {
  private static readonly _defaultBufferSize = 8;  

  protected readonly _id: number;
  get id(): number {
    return this._id;
  }
  protected readonly _bufferSize: number;
  get bufferSize(): number {
    return this._bufferSize;
  }

  protected _currentPath: SmoothPathData;
  protected _paths: SmoothPathData[] = []; 
  get paths(): SmoothPathData[] {
    return this._paths.slice();
  }
  get pathCount(): number {
    return this._paths.length;
  }
 
  protected _positionBuffer: Vec2[] = [];
  protected _currentPathString: string;

  constructor(options?: SmoothPathOptions) {
    this._bufferSize = options?.bufferSize || SmoothPath._defaultBufferSize;
    this._id = options?.id;
  }

  endPath() {    
    if (this._currentPath && this._currentPath.positions.length > 1) {      
      this._paths.push(this._currentPath);
    }
    this._positionBuffer = null;
    this._currentPath = null;
    this._currentPathString = null;
  }

  addPosition(pos: Vec2) {
    this.appendPositionToBuffer(pos);
    this.updateCurrentPath();
  }
  
  protected appendPositionToBuffer(pos: Vec2) {
    const buffer = this._positionBuffer;
    buffer.push(pos);
    // keep the buffer from oversizing
    this._positionBuffer = buffer
      .slice(Math.max(0, buffer.length - this._bufferSize), buffer.length);
  }

  /**
   * get an average buffer position starting from the specified offset
   * @param offset must not exceed the buffer max index
   * @returns average position vector
   */
  protected getAverageBufferPosition(offset: number): Vec2 {
    const len = this._positionBuffer.length;
    if (len >= this._bufferSize) {
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

  protected updateCurrentPath(): string {
    let pos = this.getAverageBufferPosition(0);
    if (!pos) {
      return null;
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
    return tmpPath;
  }
}
