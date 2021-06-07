import { editIcons } from "../../assets/index.html";

import { Vec2 } from "mathador";
import { Quadruple } from "../../common/types";

import { ContextMenu } from "../../components/context-menu";
import { SmoothPath, SmoothPathData, SmoothPathOptions } from "./smooth-path";

export interface CanvasSmoothPathData extends SmoothPathData {
  path: Path2D;
  strokeWidth: number;
  color: Quadruple;
}

export interface CanvasSmoothPathOptions extends SmoothPathOptions {
  canvasWidth: number;
  canvasHeight: number;
}

export class CanvasSmoothPathEditor extends SmoothPath {
  private static readonly _defaultStrokeWidth = 3;
  private static readonly _colors: readonly Quadruple[] = [
    [0, 0, 0, 1], // black
    [0.804, 0, 0, 1], // red
    [0, 0.804, 0, 1], // green
    [0, 0, 0.804, 1], // blue
    [1, 0.5, 0, 1], // orange
    [1, 0.2, 1, 1], // pink
  ];

  protected readonly _container: HTMLElement;

  protected readonly _canvas: HTMLCanvasElement;
  get canvas(): HTMLCanvasElement {
    return this._canvas;
  }
  get ctx(): CanvasRenderingContext2D {
    return this._canvas.getContext("2d");
  }
  
  get canvasSize(): [w: number, h: number] {
    return [this._canvas.width, this._canvas.height];
  } 
  set canvasSize(value: [w: number, h: number]) {
    if (!value) {
      return;
    }
    const [w, h] = value;
    if (!w || !h) {
      return;
    }
    if (w === this._canvas.width
      && h === this._canvas.height) {
      return;
    }
    this._canvas.width = w;
    this._canvas.height = h;
    this.refreshEditor();
  } 
  
  protected readonly _contextMenu: ContextMenu;
  
  protected _strokeWidth = CanvasSmoothPathEditor._defaultStrokeWidth;
  protected _color = CanvasSmoothPathEditor._colors[0];
  
  protected _currentPath: CanvasSmoothPathData;
  protected _paths: CanvasSmoothPathData[] = []; 
  get paths(): CanvasSmoothPathData[] {
    return this._paths.slice();
  }

  constructor(container: HTMLElement, options: CanvasSmoothPathOptions) {
    super(options);
    if (!container) {
      throw new Error("Container is not defined");
    }
    if (!options?.canvasWidth || !options.canvasHeight) {
      throw new Error("Canvas dimensions is not defined");
    }

    this._container = container;

    this._canvas = document.createElement("canvas");
    this._canvas.classList.add("abs-ratio-canvas");
    this._canvas.width = options.canvasWidth;
    this._canvas.height = options.canvasHeight;
    this._canvas.addEventListener("pointerdown", this.onPointerDown); 
    
    this._contextMenu = new ContextMenu();
    this.fillContextMenu();   

    this._container.append(this._canvas);
    this._container.addEventListener("contextmenu", this.onContextMenu);
  }

  destroy() {
    this._canvas.remove();
    this._container.removeEventListener("contextmenu", this.onContextMenu);
    this._contextMenu.destroy();
  }

  getImageData(): Uint8ClampedArray {
    this.refreshEditor();
    const imgData = this.ctx.getImageData(0, 0, this._canvas.width, this._canvas.height).data;
    return imgData;
  }

  newPath(startPosition: Vec2) {
    const pathString = "M" + startPosition.x + " " + startPosition.y;
    const path2d = new Path2D(pathString);

    this._positionBuffer = [startPosition];
    this._currentPath = {
      strokeWidth: this._strokeWidth,
      color: this._color,
      path: path2d,  
      positions: [new Vec2(startPosition.x, startPosition.y)],
    };
    this._currentPathString = pathString;
  }

  removePath(path: Path2D) {
    if (!path) {
      return;
    }
    this._paths = this._paths.filter(x => x.path !== path);
    this.refreshEditor();
  }

  removeLastPath() {
    this._paths.pop();
    this.refreshEditor();
  }
  
  removeAllPaths() {
    this._paths.length = 0;
    this.refreshEditor();
  }

  protected updateCurrentPath(): string {
    const tmpPath = super.updateCurrentPath();
    if (tmpPath) {
      // Set the complete current path coordinates
      this._currentPath.path = new Path2D(this._currentPathString + tmpPath);
    }
    return tmpPath;
  }

  protected refreshEditor() {
    this.drawPaths();    
    this.fillContextMenu();
  }
  
  protected drawPaths() {
    this.ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    (this._currentPath 
      ? [...this._paths, this._currentPath]
      : this._paths
    ).forEach(x => {      
      const [r, g, b, a] = x.color;
      this.ctx.strokeStyle = `rgba(${r * 255},${g * 255},${b * 255},${a})`;
      this.ctx.lineWidth = x.strokeWidth;
      this.ctx.lineCap = "round";
      this.ctx.lineJoin = "round";
      this.ctx.stroke(x.path);
    });
  }

  protected convertClientCoordsToCanvas(clX: number, clY: number): [caX: number, caY: number] {
    const {top, left, width, height} = this._canvas.getBoundingClientRect();

    const caHorRatio = width / this._canvas.width;
    const caVertRatio = height / this._canvas.height;

    const caX = (clX - left) / caHorRatio; 
    const caY = (clY - top) / caVertRatio;

    return [caX, caY];
  }
  
  //#region pointer events
  protected onContextMenu = (event: MouseEvent) => {
    if (this._contextMenu.enabled) {
      event.preventDefault();
      this._contextMenu.show(new Vec2(event.clientX, event.clientY), this._container);
    }
  };

  protected onPointerDown = (e: PointerEvent) => {
    if (!e.isPrimary || e.button === 2) {
      return;
    }    

    const {clientX: clX, clientY: clY} = e;
    const [caX, caY] = this.convertClientCoordsToCanvas(clX, clY);

    // create a new temp path
    this.newPath(new Vec2(caX, caY));

    const target = e.target as HTMLElement;
    target.addEventListener("pointermove", this.onPointerMove);
    target.addEventListener("pointerup", this.onPointerUp);    
    target.addEventListener("pointerout", this.onPointerUp);  
    // capture pointer to make pointer events fire on same target
    target.setPointerCapture(e.pointerId);
  };

  protected onPointerMove = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const {clientX: clX, clientY: clY} = e;
    const [caX, caY] = this.convertClientCoordsToCanvas(clX, clY);
    
    // add the current pointer position to the current temp path
    this.addPosition(new Vec2(caX, caY));
    this.refreshEditor();
  };

  protected onPointerUp = (e: PointerEvent) => {
    if (!e.isPrimary) {
      return;
    }

    const target = e.target as HTMLElement;
    target.removeEventListener("pointermove", this.onPointerMove);
    target.removeEventListener("pointerup", this.onPointerUp);    
    target.removeEventListener("pointerout", this.onPointerUp);
    target.releasePointerCapture(e.pointerId);   

    this.endPath();
    this.refreshEditor();
  };
  //#endregion
  

  //#region context menu
  protected fillContextMenu() {
    const cmContent = [
      this.buildColorPicker(),
      this.buildWidthSliderWithButtons(),
    ];
    this._contextMenu.content = cmContent;
    this._contextMenu.enabled = true;
  }
  
  protected buildColorPicker(): HTMLElement {    
    const colorPickerDiv = document.createElement("div");
    colorPickerDiv.classList.add("context-menu-content", "row");
    CanvasSmoothPathEditor._colors.forEach(x => {          
      const item = document.createElement("div");
      item.classList.add("panel-button");
      if (x === this._color) {        
        item.classList.add("on");
      }
      item.addEventListener("click", () => {
        this._color = x;
        this.fillContextMenu();
      });
      const colorIcon = document.createElement("div");
      colorIcon.classList.add("context-menu-color-icon");
      colorIcon.style.backgroundColor = `rgb(${x[0]*255},${x[1]*255},${x[2]*255})`;
      item.append(colorIcon);
      colorPickerDiv.append(item);
    });
    return colorPickerDiv;
  }
  
  protected buildWidthSliderWithButtons(): HTMLElement {    
    const div = document.createElement("div");
    div.classList.add("context-menu-content", "row");

    const undoButton = document.createElement("div");
    undoButton.classList.add("panel-button");
    if (!this.pathCount) {
      undoButton.classList.add("disabled");
    } else {      
      undoButton.addEventListener("click", () => {
        this.removeLastPath();
      });
    }
    undoButton.innerHTML = editIcons.back;
    div.append(undoButton);
    
    const clearButton = document.createElement("div");
    clearButton.classList.add("panel-button");
    if (!this.pathCount) {
      clearButton.classList.add("disabled");
    } else {      
      clearButton.addEventListener("click", () => {
        this.removeAllPaths();
      });
    }
    clearButton.innerHTML = editIcons.close;
    div.append(clearButton);

    const slider = document.createElement("input");
    slider.setAttribute("type", "range");
    slider.setAttribute("min", "1");
    slider.setAttribute("max", "32");
    slider.setAttribute("step", "1");
    slider.setAttribute("value", this._strokeWidth + "");
    slider.classList.add("context-menu-slider");
    slider.addEventListener("change", () => {
      this._strokeWidth = slider.valueAsNumber;
    });
    div.append(slider);

    return div;
  }  
  //#endregion

}
