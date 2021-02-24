import { RenderingCancelledException } from "pdfjs-dist";
import { PDFPageProxy, RenderParameters } from "pdfjs-dist/types/display/api";
import { PageViewport } from "pdfjs-dist/types/display/display_utils";
import { AnnotationData } from "./document/annotation-data";
import { Vec2 } from "./math";
import { PageAnnotationView as PageAnnotationsView } from "./page-annotations-view";

import { PageTextView } from "./page-text-view";

export class PageView { 
  readonly number: number;
  readonly id: number;
  readonly generation: number;
  
  private readonly _pageProxy: PDFPageProxy; 
  private readonly _viewport: PageViewport; 
  private readonly _maxScale: number;
  private readonly _annotationData: AnnotationData;

  private _dimensions: {
    width: number; 
    height: number;
    previewWidth: number;
    previewHeight: number;
    scaledWidth?: number;
    scaledHeight?: number;
    scaledDprWidth?: number;
    scaledDprHeight?: number;
  };

  private _previewContainer: HTMLDivElement; 
  get previewContainer(): HTMLDivElement {
    return this._previewContainer;
  }
  private _previewRendered: boolean;

  private _viewContainer: HTMLDivElement; 
  get viewContainer(): HTMLDivElement {
    return this._viewContainer;
  }
  private _viewCanvas: HTMLCanvasElement; 
  private $viewRendered: boolean;
  private set _viewRendered(value: boolean) {
    this.$viewRendered = value;
    this._viewContainer.setAttribute("data-loaded", value + "");
  }  
  private get _viewRendered(): boolean {
    return this.$viewRendered;
  }

  private _text: PageTextView;
  private _annotations: PageAnnotationsView;

  private _renderTask: {cancel: () => void; promise: Promise<void>};
  private _renderPromise: Promise<void>;
  
  private _scale: number; 
  set scale(value: number) {   
    if (value <= 0 || this._scale === value) {
      return;
    }
    this._scale = value;
    const dpr = window.devicePixelRatio;
    
    this._dimensions.scaledWidth = this._dimensions.width * this._scale;
    this._dimensions.scaledHeight = this._dimensions.height * this._scale;
    this._dimensions.scaledDprWidth = this._dimensions.scaledWidth * dpr;
    this._dimensions.scaledDprHeight = this._dimensions.scaledHeight * dpr;

    this._viewContainer.style.width = this._dimensions.scaledWidth + "px";
    this._viewContainer.style.height = this._dimensions.scaledHeight + "px";
    
    if (this._viewCanvas) {
      this._viewCanvas.style.width = this._dimensions.scaledWidth + "px";
      this._viewCanvas.style.height = this._dimensions.scaledHeight + "px";
    }

    this._scaleIsValid = false;
  } 

  private _scaleIsValid: boolean;
  get viewValid(): boolean {
    return this._scaleIsValid && this._viewRendered;
  }

  constructor(pageProxy: PDFPageProxy, annotationData: AnnotationData, maxScale: number, previewWidth: number) {
    if (!pageProxy) {
      throw new Error("Page proxy is not defined");
    }
    if (!annotationData) {
      throw new Error("Annotation data is not defined");
    }
    this._pageProxy = pageProxy;
    this._viewport = pageProxy.getViewport({scale: 1});
    this._maxScale = Math.max(maxScale, 1);
    this._annotationData = annotationData;

    this.number = pageProxy.pageNumber;
    this.id = pageProxy.ref["num"];
    this.generation = pageProxy.ref["gen"];

    const {width, height} = this._viewport;
    previewWidth = Math.max(previewWidth ?? 0, 50);
    const previewHeight = previewWidth * (height / width);
    this._dimensions = {width, height, previewWidth, previewHeight};

    this._previewContainer = document.createElement("div");
    this._previewContainer.classList.add("page-preview");    
    this._previewContainer.setAttribute("data-page-number", this.number + "");
    this._previewContainer.setAttribute("data-page-id", this.id + "");
    this._previewContainer.setAttribute("data-page-gen", this.generation + "");
    this._previewContainer.style.width = this._dimensions.previewWidth + "px";
    this._previewContainer.style.height = this._dimensions.previewHeight + "px";

    this._viewContainer = document.createElement("div");
    this._viewContainer.classList.add("page");
    this._viewContainer.setAttribute("data-page-number", this.number + ""); 
    this._viewContainer.setAttribute("data-page-id", this.id + "");
    this._viewContainer.setAttribute("data-page-gen", this.generation + "");   
    this.scale = 1;  
  }

  destroy() {
    this._previewContainer.remove();
    this._viewContainer.remove();
    this._pageProxy.cleanup();
  }  

  async renderPreviewAsync(force = false): Promise<void> { 
    if (this._renderPromise) {
      if (force) {
        this.cancelRenderTask();
      }
      await this._renderPromise;
    }
    
    if (!force && this._previewRendered) {
      return;
    }

    this._renderPromise = this.runPreviewRenderAsync();
    return this._renderPromise;
  }
  
  async renderViewAsync(force = false): Promise<void> { 
    if (this._renderPromise) {
      if (force) {
        this.cancelRenderTask();
      }
      await this._renderPromise;
    }

    if (!force && this.viewValid) {
      return;
    }

    this._renderPromise = this.runViewRenderAsync();
    return this._renderPromise;
  }
  
  clearPreview() {
    this._previewContainer.innerHTML = "";
  }

  clearView() {
    this._annotations?.destroy();
    this._annotations = null;

    this._text?.destroy();
    this._text = null;
    
    this._viewCanvas?.remove();
    this._viewRendered = false;
  }
 
  private cancelRenderTask() {    
    if (this._renderTask) {
      this._renderTask.cancel();   
      this._renderTask = null;
    }
  }

  private async runRenderTaskAsync(renderParams: RenderParameters): Promise<boolean> {
    this.cancelRenderTask();
    this._renderTask = this._pageProxy.render(renderParams);
    try {
      await this._renderTask.promise;
    } catch (error) {
      if (error instanceof RenderingCancelledException) {
        return false;
      } else {
        throw error;
      }
    } finally {
      this._renderTask = null;
    }

    return true;
  }
  
  private createPreviewCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.classList.add("page-canvas");  
    const dpr = window.devicePixelRatio;
    const {previewWidth: width, previewHeight: height} = this._dimensions;  
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    return canvas;
  }

  private createViewCanvas(): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.classList.add("page-canvas"); 
    canvas.style.width = this._dimensions.scaledWidth + "px";
    canvas.style.height = this._dimensions.scaledHeight + "px";
    canvas.width = this._dimensions.scaledDprWidth;
    canvas.height = this._dimensions.scaledDprHeight;
    return canvas;
  }

  private scaleCanvasImage(sourceCanvas: HTMLCanvasElement, targetCanvas: HTMLCanvasElement) {
    let ratio = this._scale / this._maxScale;
    let tempSource = sourceCanvas;
    let tempTarget: HTMLCanvasElement;

    while (ratio < 0.5) {
      tempTarget = document.createElement("canvas");
      tempTarget.width = tempSource.width * 0.5;
      tempTarget.height = tempSource.height * 0.5;
      tempTarget.getContext("2d").drawImage(tempSource, 0, 0, tempTarget.width, tempTarget.height);

      tempSource = tempTarget;
      ratio *= 2;
    }
    
    targetCanvas.getContext("2d").drawImage(tempSource, 0, 0, targetCanvas.width, targetCanvas.height);
  }
  
  private async runPreviewRenderAsync(): Promise<void> { 
    const canvas = this.createPreviewCanvas();
    const params = <RenderParameters>{
      canvasContext: canvas.getContext("2d"),
      viewport: this._viewport.clone({scale: canvas.width / this._dimensions.width}),
    };
    const result = await this.runRenderTaskAsync(params);
    if (!result) {
      this._previewRendered = false;
      return;
    }
    
    this._previewContainer.innerHTML = "";
    this._previewContainer.append(canvas);
    this._previewRendered = true;
  }

  private async runViewRenderAsync(): Promise<void> { 
    const scale = this._scale;

    this._text?.destroy();
    this._text = null;

    this._annotations?.remove();

    // create a new canvas of the needed size and fill it with a rendered page
    const canvas = this.createViewCanvas();
    const params = <RenderParameters>{
      canvasContext: canvas.getContext("2d"),
      viewport: this._viewport.clone({scale: scale * window.devicePixelRatio}),
      enableWebGL: true,
    };
    const result = await this.runRenderTaskAsync(params);
    if (!result || scale !== this._scale) {
      // page rendering was cancelled  
      // or scale changed during rendering    
      return;
    }

    this._viewCanvas?.remove();
    this._viewContainer.append(canvas);
    this._viewCanvas = canvas;
    this._viewRendered = true;

    // add text div on top of canvas
    this._text = await PageTextView.appendPageTextAsync(this._pageProxy, this._viewContainer, scale); 

    // add annotations div on top of canvas
    if (!this._annotations) {
      const {width: x, height: y} = this._dimensions;
      this._annotations = new PageAnnotationsView(this._annotationData, this.id, new Vec2(x, y));
    }
    this._annotations.append(this.viewContainer);

    // check if scale not changed during text render
    if (scale === this._scale) {
      this._scaleIsValid = true;
    }     
  }
}
