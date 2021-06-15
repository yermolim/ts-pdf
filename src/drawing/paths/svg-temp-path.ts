import { Vec2 } from "mathador";

export class SvgTempPath {  
  protected readonly _path: SVGPathElement;
  get path(): SVGGElement {
    return this._path;
  }
  
  constructor() {
    this._path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  }
  
  set(fill: string, stroke: string, w: number, 
    points: Vec2[], close = false) {

    let d = "";
    if (points?.length > 1) {      
      d += `M${points[0].x},${points[0].y} `;
      for (let i = 1; i < points.length; i++) {
        d += `L${points[i].x},${points[i].y} `;
      }
      if (close) {
        d += "Z";
      }
    }
    this._path.classList.add("annotation-temp-copy");
    this._path.setAttribute("d", d);
    this._path.style.fill = fill;
    this._path.style.stroke = stroke;
    this._path.style.strokeWidth = w + "";
  }
  
  insertAfter(element: Element) {
    element.after(this._path);
  }

  remove() {
    this._path.setAttribute("d", "");
    this._path.remove();
  }
}
