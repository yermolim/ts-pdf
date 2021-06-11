import { Vec2 } from "mathador";

/**
 * create HTML elements from HTML string
 * @param html HTML string
 * @returns HTML element array
 */
export function htmlToElements(html: string): HTMLElement[] {
  const template = document.createElement("template");
  template.innerHTML = html;
  const nodes: HTMLElement[] = [];
  template.content.childNodes.forEach(x => {
    if (x instanceof HTMLElement) { 
      nodes.push(x);
    }
  });
  return nodes;
}

/**
 * wrap callback with setTimeout inside Promise<T>
 * @param callback 
 * @returns 
 */
export async function promisify<T>(callback: () => T): Promise<T> {
  return new Promise<T>(resolve => {
    setTimeout(() => {
      const result = callback();
      resolve(result);
    }, 0);
  });
}

/**
 * calls empty setTimeout to force DOM refresh
 */
export async function runEmptyTimeout() {
  await promisify(() => undefined);
}

/**create a temp download link and click on it */
export function downloadFile(blob: Blob, name?: string) {
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("download", name);
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export class TempSvgPath {  
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
