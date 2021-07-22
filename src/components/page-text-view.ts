import { renderTextLayer } from "pdfjs-dist";
import { PDFPageProxy } from "pdfjs-dist/types/display/api";
import { TextLayerRenderParameters, TextLayerRenderTask } from "pdfjs-dist/types/display/text_layer";

export class PageTextView {  
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
    this._container.addEventListener("pointerdown", this.onPointerDown);
    this._container.addEventListener("pointerup", this.onPointerUp);
  } 

  /**
   * render the page text and append it to the specified container
   * @param pageProxy 
   * @param parent 
   * @param scale 
   * @returns 
   */
  static async appendPageTextAsync(pageProxy: PDFPageProxy, parent: HTMLElement, scale: number): Promise<PageTextView> {
    const textObj = new PageTextView(pageProxy);
    await textObj.renderTextLayerAsync(scale);
    parent.append(textObj._container);
    return textObj;
  } 

  /**free the resources that can prevent garbage to be collected */
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
      // TODO: find a way to enable next option without breaking text markup annotators
      enhanceTextSelection: false, 
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

    const spans = this._container.querySelectorAll("span");
    spans.forEach(x => {
      // add additional empty spans positioned at the text span corners
      // to supply an easy way to get the text coordinates on user selection
      const blCornerSpan = document.createElement("span");
      blCornerSpan.classList.add("dummy-corner", "bl");
      const brCornerSpan = document.createElement("span");
      brCornerSpan.classList.add("dummy-corner", "br");
      const trCornerSpan = document.createElement("span");
      trCornerSpan.classList.add("dummy-corner", "tr");
      const tlCornerSpan = document.createElement("span");
      tlCornerSpan.classList.add("dummy-corner", "tl");
      x.append(blCornerSpan, brCornerSpan, trCornerSpan, tlCornerSpan);
    });

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

  private onPointerDown = (e: PointerEvent) => {
    if (this._divModeTimer) {
      clearTimeout(this._divModeTimer);
      this._divModeTimer = null;
    }
    this._renderTask?.expandTextDivs(true);
  };
  
  private onPointerUp = (e: PointerEvent) => {
    this._divModeTimer = setTimeout(() => {
      this._renderTask?.expandTextDivs(false);
      this._divModeTimer = null;
    }, 300);
  };
}
