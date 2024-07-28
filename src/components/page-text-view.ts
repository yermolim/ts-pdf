import { TextLayer } from "pdfjs-dist";
import { PDFPageProxy } from "pdfjs-dist/types/src/display/api";

export class PageTextView {  
  private _container: HTMLDivElement;

  private _pageProxy: PDFPageProxy;

  private _destroyed: boolean;

  private constructor(pageProxy: PDFPageProxy) {
    if (!pageProxy) {
      throw new Error("Page proxy is not defined");
    }
    this._pageProxy = pageProxy;

    this._container = document.createElement("div");
    this._container.classList.add("page-text");
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
    try {
      const result = await textObj.renderTextLayerAsync(scale);
      if (!result || textObj._destroyed) {
        return null;
      }
    } catch (e) {
      console.error(e);
      return null;
    }
    parent.append(textObj._container);
    return textObj;
  } 

  /**free the resources that can prevent garbage to be collected */
  destroy() {
    this.remove();
    this._container = null;
    this._destroyed = true;
  }

  remove() {
    if (this._container) {
      this._container.remove();
    }
  }

  private async renderTextLayerAsync(scale: number): Promise<boolean> {
    this.clear();

    const viewport = this._pageProxy.getViewport({scale});
    // Note: the variable need to be set as its used by PDF.js to adjust the size of text chunks
    this._container.style.setProperty("--scale-factor", scale + "");

    try {
      const textLayer = new TextLayer({
        textContentSource: this._pageProxy.streamTextContent({
          includeMarkedContent: true,
          disableNormalization: true,
        }),
        container: this._container,
        viewport,
      });
      await textLayer.render();
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
}
