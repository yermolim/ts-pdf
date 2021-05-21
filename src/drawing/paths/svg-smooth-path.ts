import { Vec2 } from "../../common/math";
import { SmoothPath, SvgSmoothPathData, SmoothPathOptions } from "./smooth-path";


export class SvgSmoothPath extends SmoothPath {
  protected _group: SVGGraphicsElement;
  get group(): SVGGraphicsElement {
    return this._group;
  }
  
  protected _currentPath: SvgSmoothPathData;
  protected _paths: SvgSmoothPathData[] = []; 
  get paths(): SvgSmoothPathData[] {
    return this._paths.slice();
  }

  constructor(options?: SmoothPathOptions) {
    super(options);
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
