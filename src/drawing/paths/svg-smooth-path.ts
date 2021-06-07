import { Vec2 } from "mathador";
import { Quadruple } from "../../common/types";
import { SmoothPath, SmoothPathData, SmoothPathOptions } from "./smooth-path";

export interface SvgSmoothPathData extends SmoothPathData {
  path: SVGPathElement;
}

export interface SvgSmoothPathOptions extends SmoothPathOptions {
  /**smoothing filter position buffer (higher values mean smoother lines but less performance) */
  bufferSize?: number; 
  strokeWidth?: number;  
  color?: Quadruple;
  id?: number;
}

export class SvgSmoothPath extends SmoothPath {
  private static readonly _defaultStrokeWidth = 3;
  private static readonly _defaultColor: Quadruple = [0, 0, 0, 0.8];

  protected _strokeWidth: number;
  get strokeWidth(): number {
    return this._strokeWidth;
  } 
  protected _color: Quadruple;
  get color(): Quadruple {
    return this._color;
  }
  
  protected _group: SVGGraphicsElement;
  get group(): SVGGraphicsElement {
    return this._group;
  }
  
  protected _currentPath: SvgSmoothPathData;
  protected _paths: SvgSmoothPathData[] = []; 
  get paths(): SvgSmoothPathData[] {
    return this._paths.slice();
  }

  constructor(options?: SvgSmoothPathOptions) {
    super(options);
    this._strokeWidth = options?.strokeWidth || SvgSmoothPath._defaultStrokeWidth;
    this._color = options?.color || SvgSmoothPath._defaultColor;
    this._group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  }

  newPath(startPosition: Vec2) {
    const [r, g, b, a] = this._color || [0, 0, 0, 1];
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", `rgba(${r * 255},${g * 255},${b * 255},${a})`);
    path.setAttribute("stroke-width", this._strokeWidth + "");
    path.setAttribute("stroke-linecap", "round");    
    path.setAttribute("stroke-linejoin", "round");

    const pathString = "M" + startPosition.x + " " + startPosition.y;
    path.setAttribute("d", pathString);

    this._positionBuffer = [startPosition];
    this._currentPath = {path, positions: [new Vec2(startPosition.x, startPosition.y)]};
    this._currentPathString = pathString;
    this._group.append(path);
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

  protected updateCurrentPath(): string {
    const tmpPath = super.updateCurrentPath();
    if (tmpPath) {
      // Set the complete current path coordinates
      this._currentPath.path.setAttribute("d", this._currentPathString + tmpPath);
    }
    return tmpPath;
  }
}
