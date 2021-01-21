import { renderTextLayer } from "pdfjs-dist";
import { PDFPageProxy } from "pdfjs-dist/types/display/api";
import { TextLayerRenderParameters, TextLayerRenderTask } from "pdfjs-dist/types/display/text_layer";

export class ViewPageText {  
  private _container: HTMLDivElement;

  private _pageProxy: PDFPageProxy;
  private _renderTask: TextLayerRenderTask;

  private _divModeTimer: number;

  private constructor(pageProxy: PDFPageProxy) {
    if (!pageProxy) {
      throw new Error("Page proxy is not defined");
    }
    this._pageProxy = pageProxy;

    this._container = document.createElement("div");
    this._container.classList.add("page-text");
    this._container.addEventListener("mousedown", this.onMouseDown);
    this._container.addEventListener("mouseup", this.onMouseUp);
  } 

  static async appendPageTextAsync(pageProxy: PDFPageProxy, parent: HTMLElement, scale: number): Promise<ViewPageText> {
    const textObj = new ViewPageText(pageProxy);
    await textObj.renderTextLayerAsync(scale);
    parent.append(textObj._container);
    return textObj;
  } 

  destroy() {
    this.destroyRenderTask();
    if (this._container) {
      this._container.remove();
      this._container = null;
    }
  }

  private async renderTextLayerAsync(scale: number): Promise<boolean> {
    this.clear();
    this.destroyRenderTask();

    const viewport = this._pageProxy.getViewport({scale});
    const textContentStream = this._pageProxy.streamTextContent();
    this._renderTask = renderTextLayer(<TextLayerRenderParameters>{
      container: <HTMLElement>this._container,
      textContentStream,
      viewport,
      enhanceTextSelection: true,
    });
    try {
      await this._renderTask.promise;
    } catch (error) {
      if (error.message === "TextLayer task cancelled.") {
        return false;
      } else {
        throw error;
      }
    }
    return true;
  }

  private clear() {
    this._container.innerHTML = "";
  }

  private destroyRenderTask() {
    if (this._renderTask) {
      this._renderTask.cancel();  
      this._renderTask = null;
    }
  }

  private onMouseDown = (e: MouseEvent) => {
    if (this._divModeTimer) {
      clearTimeout(this._divModeTimer);
      this._divModeTimer = null;
    }
    this._renderTask?.expandTextDivs(true);
  };
  
  private onMouseUp = (e: MouseEvent) => {
    this._divModeTimer = setTimeout(() => {
      this._renderTask?.expandTextDivs(false);
      this._divModeTimer = null;
    }, 300);
  };
}
