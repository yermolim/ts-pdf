import { RenderingCancelledException } from "pdfjs-dist";
import { PDFPageProxy, RenderParameters } from "pdfjs-dist/types/display/api";

import { TsPdfPageText } from "./ts-pdf-page-text";

export class TsPdfPage {  
  private readonly _pageProxy: PDFPageProxy;  
  private readonly _maxScale: number;
  private readonly _previewWidth: number;

  private _size: {
    width: number; 
    height: number;
  };

  private _previewContainer: HTMLDivElement; 
  get previewContainer(): HTMLDivElement {
    return this._previewContainer;
  }
  private _previewCanvas: HTMLCanvasElement;
  private _previewCtx: CanvasRenderingContext2D; 

  private _viewContainer: HTMLDivElement; 
  get viewContainer(): HTMLDivElement {
    return this._viewContainer;
  }
  private _viewCanvas: HTMLCanvasElement;
  private _viewCtx: CanvasRenderingContext2D; 

  private _text: TsPdfPageText;

  private _renderTask: {cancel: () => void};
  private $referenceCanvas: HTMLCanvasElement;
  private set _referenceCanvas(value: HTMLCanvasElement) {
    this.$referenceCanvas = value;
    this._viewContainer.setAttribute("data-loaded", !!this._referenceCanvas + "");
  }  
  private get _referenceCanvas(): HTMLCanvasElement {
    return this.$referenceCanvas;
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
    return this._referenceCanvas && this._scaleIsValid;
  }

  constructor(pageProxy: PDFPageProxy, maxScale: number, previewWidth: number) {
    if (!pageProxy) {
      throw new Error("Page proxy is not defined");
    }
    this._pageProxy = pageProxy;
    this._maxScale = Math.max(maxScale, 1);
    this._previewWidth = Math.max(previewWidth, 50);

    this._previewCanvas = document.createElement("canvas");
    this._previewCanvas.classList.add("page-canvas"); 
    this._previewCtx = this._previewCanvas.getContext("2d");    
    this._previewContainer = document.createElement("div");
    this._previewContainer.classList.add("page-preview");
    this._previewContainer.append(this._previewCanvas);
    this._previewContainer.setAttribute("data-page-number", pageProxy.pageNumber + "");
    
    this._viewCanvas = document.createElement("canvas");
    this._viewCanvas.classList.add("page-canvas"); 
    this._viewCtx = this._viewCanvas.getContext("2d");
    this._viewContainer = document.createElement("div");
    this._viewContainer.classList.add("page");
    this._viewContainer.append(this._viewCanvas);
    this._viewContainer.setAttribute("data-page-number", pageProxy.pageNumber + "");  
    
    const {width, height} = pageProxy.getViewport({scale: 1});
    this._size = {width, height};
    this.refreshPreviewSize();

    this._text = new TsPdfPageText(pageProxy);
    this._viewContainer.append(this._text.container);  
  }

  destroy() {
    this._previewContainer.remove();
    this._viewContainer.remove();
    this._pageProxy.cleanup();
  }  

  async renderPreviewAsync(): Promise<void> { 
    const viewport = this._pageProxy.getViewport({scale: this._previewCanvas.width / this._size.width});

    const params = <RenderParameters>{
      canvasContext: this._previewCtx,
      viewport,
    };

    await this.runRenderTaskAsync(params);
  }
  
  async renderViewAsync(): Promise<void> {   
    if (!this._referenceCanvas) {
      const result = await this.createReferenceCanvasAsync();
      if (!result) {
        return;
      }
    }
    
    // fill canvas with a scaled page reference image 
    this.renderScaledRefView();

    // fill canvas with a full-sized page view
    // await this.renderFullSizeViewAsync();

    await this._text.renderTextLayerAsync(this._scale);   
     
    this._scaleIsValid = true;
  }
  
  clearPreview() {
    this._previewCtx.clearRect(0, 0, this._viewCanvas.width, this._viewCanvas.height);
  }

  clearView() {
    this._viewCtx.clearRect(0, 0, this._viewCanvas.width, this._viewCanvas.height);
    this._referenceCanvas = null;
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

  private async runRenderTaskAsync(renderParams: RenderParameters): Promise<boolean> {
    if (!this._scale) {
      this._scale = 1;
    }

    if (this._renderTask) {
      this._renderTask.cancel();   
      this._renderTask = null;
    }

    const renderTask = this._pageProxy.render(renderParams);
    this._renderTask = renderTask;
    try {
      await renderTask.promise;
    } catch (error) {
      if (error instanceof RenderingCancelledException) {
        return false;
      } else {
        throw error;
      }
    }  
    this._renderTask = null;

    return true;
  }

  private async createReferenceCanvasAsync(): Promise<boolean> {
    const viewport = this._pageProxy.getViewport({scale: this._maxScale * window.devicePixelRatio});
    const renderingCanvas = document.createElement("canvas");
    renderingCanvas.width = viewport.width;
    renderingCanvas.height = viewport.height;

    const params = <RenderParameters>{
      canvasContext: renderingCanvas.getContext("2d"),
      viewport,
    };
    const result = await this.runRenderTaskAsync(params);
    if (result) {
      this._referenceCanvas = renderingCanvas;   
      return true;
    } 
    return false;
  }

  private renderScaledRefView() {
    let ratio = this._scale / this._maxScale;
    let tempSource = this._referenceCanvas;
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

  private async renderFullSizeViewAsync(): Promise<void> {
    const viewport = this._pageProxy.getViewport({scale: this._scale * window.devicePixelRatio});
    const params = <RenderParameters>{
      canvasContext: this._viewCtx,
      viewport,
    };
    await this.runRenderTaskAsync(params);
  }
}
