import { RenderingCancelledException } from "pdfjs-dist";
import { PDFPageProxy, RenderParameters } from "pdfjs-dist/types/display/api";

export class TsPdfPage {  
  private readonly _maxScale: number;
  private readonly _previewWidth: number;

  private _size: {
    width: number; 
    height: number;
  };

  private _viewContainer: HTMLDivElement; 
  get viewContainer(): HTMLDivElement {
    return this._viewContainer;
  }
  private _viewCanvas: HTMLCanvasElement;
  private _viewCtx: CanvasRenderingContext2D; 

  private _previewContainer: HTMLDivElement; 
  get previewContainer(): HTMLDivElement {
    return this._previewContainer;
  }
  private _previewCanvas: HTMLCanvasElement;
  private _previewCtx: CanvasRenderingContext2D; 

  private _renderTask: {cancel: () => void};
  private $renderedCanvas: HTMLCanvasElement;
  private set _renderedCanvas(value: HTMLCanvasElement) {
    this.$renderedCanvas = value;
    this._viewContainer.setAttribute("data-loaded", !!this._renderedCanvas + "");
  }  
  private get _renderedCanvas(): HTMLCanvasElement {
    return this.$renderedCanvas;
  }

  private _pageProxy: PDFPageProxy;  
  set pageProxy(value: PDFPageProxy) {   
    if (this._pageProxy === value) {
      return;
    }

    const {width, height} = value.getViewport({scale: 1});
    this._size = {width, height};
    this.refreshPreviewSize();

    this._pageProxy = value;
    this._renderedCanvas = null;

    this._viewContainer.setAttribute("data-page-number", this._pageProxy.pageNumber + "");
  }
  
  private _scale: number; 
  set scale(value: number) {   
    if (value <= 0 || this._scale === value) {
      return;
    }
    this._scale = value;
    
    const width =  this._size.width * this._scale;
    const height =  this._size.height * this._scale;

    this._viewContainer.style.width = width + "px";
    this._viewContainer.style.height = height + "px";
    this._viewCanvas.style.width = width + "px";
    this._viewCanvas.style.height = height + "px";

    const dpr = window.devicePixelRatio;
    this._viewCanvas.width = width * dpr;
    this._viewCanvas.height = height * dpr;

    this._scaleIsValid = false;
  } 

  private _scaleIsValid: boolean;
  get isValid(): boolean {   
    return this._renderedCanvas && this._scaleIsValid;
  }

  constructor(maxScale: number, previewWidth: number) {
    this._maxScale = Math.max(maxScale, 1);
    this._previewWidth = Math.max(previewWidth, 50);

    this._previewCanvas = document.createElement("canvas");
    this._previewCanvas.classList.add("page-canvas"); 
    this._previewCtx = this._previewCanvas.getContext("2d");    
    this._previewContainer = document.createElement("div");
    this._previewContainer.classList.add("page");
    this._previewContainer.append(this._previewCanvas);
    
    this._viewCanvas = document.createElement("canvas");
    this._viewCanvas.classList.add("page-canvas"); 
    this._viewCtx = this._viewCanvas.getContext("2d");
    this._viewContainer = document.createElement("div");
    this._viewContainer.classList.add("page");
    this._viewContainer.append(this._viewCanvas);
  }

  destroy() {
    this._pageProxy?.cleanup();
  }  

  async renderPreviewAsync(): Promise<void> {    
    const pageProxy = this.prepareToRender();

    const viewport = pageProxy.getViewport({scale: this._previewCanvas.width / this._size.width});

    const params = <RenderParameters>{
      canvasContext: this._previewCtx,
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
  }
  
  async renderViewAsync(): Promise<void> { 
    const pageProxy = this.prepareToRender();
    
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
  
  clearPreview() {
    this._previewCtx.clearRect(0, 0, this._viewCanvas.width, this._viewCanvas.height);
  }

  clearView() {
    this._viewCtx.clearRect(0, 0, this._viewCanvas.width, this._viewCanvas.height);
    this._renderedCanvas = null;
  }

  private refreshPreviewSize() {
    const {width: fullW, height: fullH} = this._size;

    const width = this._previewWidth;
    const height = width * (fullH / fullW);

    this._previewContainer.style.width = width + "px";
    this._previewContainer.style.height = height + "px";
    this._previewCanvas.style.width = width + "px";
    this._previewCanvas.style.height = height + "px";

    const dpr = window.devicePixelRatio;
    this._previewCanvas.width = width * dpr;
    this._previewCanvas.height = height * dpr;
  }

  private prepareToRender(): PDFPageProxy {
    const pageProxy = this._pageProxy;
    if (!pageProxy) {
      throw new Error("PageProxy not set");
    }

    if (!this._scale) {
      this._scale = 1;
    }

    if (this._renderTask) {
      this._renderTask.cancel();   
      this._renderTask = null;
    }

    return pageProxy;
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
    
    this._viewCtx.drawImage(tempSource, 0, 0, this._viewCanvas.width, this._viewCanvas.height);
  }
}
