import { RenderingCancelledException } from "pdfjs-dist";
import { PDFPageProxy, RenderParameters } from "pdfjs-dist/types/display/api";

export class TsPdfPage {
  private readonly _maxScale: number;
  private _scale: number; 
  set scale(value: number) {   
    if (value <= 0 || this._scale === value) {
      return;
    }
    this._scale = value;
    
    const width =  this._size.width * this._scale;
    const height =  this._size.height * this._scale;

    this._container.style.width = width + "px";
    this._container.style.height = height + "px";
    this._canvas.style.width = width + "px";
    this._canvas.style.height = height + "px";

    const dpr = window.devicePixelRatio;
    this._canvas.width = width * dpr;
    this._canvas.height = height * dpr;

    this._scaleIsValid = false;
  } 

  private _scaleIsValid: boolean;
  get isValid(): boolean {   
    return this._renderedCanvas && this._scaleIsValid;
  }
  
  private _container: HTMLDivElement; 
  get container(): HTMLDivElement {
    return this._container;
  }
  private _canvas: HTMLCanvasElement;
  private _ctx: CanvasRenderingContext2D; 

  private _pageProxy: PDFPageProxy;  
  set pageProxy(value: PDFPageProxy) {   
    if (this._pageProxy === value) {
      return;
    }
    const {width, height} = value.getViewport({scale: 1});
    this._size = {width, height};
    this._pageProxy = value;
    this._renderedCanvas = null;

    this._container.setAttribute("data-page-number", this._pageProxy.pageNumber + "");
  }

  private _size: {width: number; height: number};
  private _renderTask: {cancel: () => void};
  private $renderedCanvas: HTMLCanvasElement;
  private set _renderedCanvas(value: HTMLCanvasElement) {
    this.$renderedCanvas = value;
    this._container.setAttribute("data-loaded", !!this._renderedCanvas + "");
  }  
  private get _renderedCanvas(): HTMLCanvasElement {
    return this.$renderedCanvas;
  }

  constructor(maxScale: number) {
    this._maxScale = Math.max(maxScale, 1);

    this._canvas = document.createElement("canvas");
    this._canvas.classList.add("page-canvas"); 
    this._ctx = this._canvas.getContext("2d");

    this._container = document.createElement("div");
    this._container.classList.add("page");
    this._container.append(this._canvas);
  }

  destroy() {
    this._pageProxy?.cleanup();
  }
  
  async renderAsync(): Promise<void> { 
    const pageProxy = this._pageProxy;
    if (!pageProxy) {
      throw new Error("PageProxy not set");
    }    

    if (this._renderTask) {
      this._renderTask.cancel();   
      this._renderTask = null;
    }
    
    if (!this._renderedCanvas) {
      // create new render task only if there is no pending one
      const viewport = pageProxy.getViewport({scale: this._maxScale * window.devicePixelRatio});
      const renderingCanvas = document.createElement("canvas");
      renderingCanvas.width = viewport.width;
      renderingCanvas.height = viewport.height;

      const params = <RenderParameters>{
        canvasContext: renderingCanvas.getContext("2d"),
        viewport,
      };
      const renderTask = pageProxy.render(params);
      this._renderTask = renderTask;
      try {
        await renderTask.promise;
      } catch (error) {
        if (error instanceof RenderingCancelledException) {
          return;
        } else {
          throw error;
        }
      }
      
      this._renderedCanvas = renderingCanvas;      
      this._renderTask = null;
    }
    
    this.drawDownscaled();
  }

  clear() {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    this._renderedCanvas = null;
  }

  private drawDownscaled() {
    let ratio = this._scale / this._maxScale;
    let tempSource = this._renderedCanvas;
    let tempTarget: HTMLCanvasElement;
    while (ratio < 0.5) {
      tempTarget = document.createElement("canvas");
      tempTarget.width = tempSource.width * 0.5;
      tempTarget.height = tempSource.height * 0.5;
      tempTarget.getContext("2d").drawImage(tempSource, 0, 0, tempTarget.width, tempTarget.height);

      tempSource = tempTarget;
      ratio *= 2;
    }
    
    this._ctx.drawImage(tempSource, 0, 0, this._canvas.width, this._canvas.height);
  }
}
