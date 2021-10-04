import { PDFPageProxy, RenderParameters } from "pdfjs-dist/types/display/api";
import { Vec2 } from "mathador";

import { PageInfo } from "../common/page";
import { ComparisonService } from "../services/comparison-service";

interface PageRenderResult {
  canvas: HTMLCanvasElement;
  pageProxy: PDFPageProxy;
  scale: number;
}

export class PageComparisonView {
  private readonly _comparisonService: ComparisonService;
  private readonly _subjectPageInfo: PageInfo;
  private readonly _subjectPageHeight: number;
  
  private _container: HTMLDivElement;
  private _svg: SVGSVGElement;

  private _lastRenderResult: PageRenderResult;

  private _destroyed: boolean;

  constructor(comparisonService: ComparisonService,
    subjectPageInfo: PageInfo, pageDimensions: Vec2) {
    if (!comparisonService || !subjectPageInfo || !pageDimensions) {
      throw new Error("Required argument not found");
    }

    this._comparisonService = comparisonService;
    this._subjectPageInfo = subjectPageInfo; 
    this._subjectPageHeight = pageDimensions.y;

    this._container = document.createElement("div");
    this._container.classList.add("page-comparison");

    this._svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this._svg.classList.add("page-comparison-areas");
    this._svg.setAttribute("data-page-id", subjectPageInfo.id + "");
    this._svg.setAttribute("viewBox", `0 0 ${pageDimensions.x} ${pageDimensions.y}`);
    // flip Y to match PDF coords where 0,0 is the lower-left corner
    this._svg.setAttribute("transform", "scale(1, -1)");

    this._container.append(this._svg);
  } 

  /**free the resources that can prevent garbage to be collected */
  destroy() {
    this._destroyed = true;

    this.remove();
    this._container = null;
    this._lastRenderResult = null;
  }

  /**remove the container from DOM */
  remove() {    
    this._container?.remove();
  }  

  /**
   * render the page annotations and append them to the specified parent container
   * @param parent 
   * @returns 
   */
  async appendAsync(parent: HTMLElement, agentPageProxy: PDFPageProxy, scale: number) {
    this.remove();

    if (this._destroyed || !agentPageProxy) {
      return;
    } 

    const comparisonResult = this._comparisonService
      .getComparisonResultForPage(this._subjectPageInfo.index);
    if (!comparisonResult?.length) {
      return;
    };
    
    let rerendered = false;
    if (!this._lastRenderResult
      || this._lastRenderResult.pageProxy !== agentPageProxy
      || this._lastRenderResult.scale !== scale) {

      this._lastRenderResult = await this.renderPageAsync(agentPageProxy, scale);

      rerendered = true;
    }
    
    if (rerendered) {
      this.clear();
    }
    if (!this._lastRenderResult) {
      return;
    }

    parent.append(this._container);

    // TODO: implement changed areas visualization
    for (const comparisonEntry of comparisonResult) {
      
      const changedAreaGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
      changedAreaGroup.classList.add("comparison-area");
      changedAreaGroup.addEventListener("pointerdown", this.onAreaPointerDown);
      changedAreaGroup.addEventListener("pointerenter", this.onAreaPointerEnter);
      changedAreaGroup.addEventListener("pointerleave", this.onAreaPointerLeave);

      const x = comparisonEntry[0];
      const y = comparisonEntry[1];
      const yPdf = this._subjectPageHeight - Math.max(comparisonEntry[1], comparisonEntry[3]);
      const w = Math.max(Math.abs(comparisonEntry[2] - comparisonEntry[0]), 1);
      const h = Math.max(Math.abs(comparisonEntry[3] - comparisonEntry[1]), 1);
      const scaledW = w * scale;
      const scaledH = h * scale;

      const tmpCanvas = document.createElement("canvas");
      tmpCanvas.width = scaledW;
      tmpCanvas.height = scaledH;
      tmpCanvas.getContext("2d").scale(1, -1);
      tmpCanvas.getContext("2d").drawImage(this._lastRenderResult.canvas, 
        x * scale, y * scale, scaledW, scaledH, 0, 0, scaledW, -scaledH);
      const imageUrl = tmpCanvas.toDataURL("image/png");

      const image = document.createElementNS("http://www.w3.org/2000/svg", "image");
      image.classList.add("comparison-area-image");
      image.setAttribute("x", x + "");
      image.setAttribute("y", yPdf + "");
      image.setAttribute("width", w + "");
      image.setAttribute("height", h + "");
      image.setAttribute("href", imageUrl);

      const area = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      area.classList.add("comparison-area-rect");
      area.setAttribute("x", x + "");
      area.setAttribute("y", yPdf + "");
      area.setAttribute("width", w + "");
      area.setAttribute("height", h + "");

      changedAreaGroup.append(image);
      changedAreaGroup.append(area);
      this._svg.append(changedAreaGroup);
    }
  }

  private clear() {
    this._svg.innerHTML = "";
  }  
  
  private async renderPageAsync(pageProxy: PDFPageProxy, 
    scale: number): Promise<PageRenderResult> {
    if (!pageProxy) {
      return null;
    }

    // get page viewport
    const viewport = pageProxy.getViewport({scale, rotation: 0});
    const {width, height} = viewport;

    // create a new canvas of the needed size
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const canvasCtx = canvas.getContext("2d");

    // fill it with a rendered page
    const params = <RenderParameters>{
      canvasContext: canvasCtx,
      viewport: viewport,
      enableWebGL: true,
    };
    const renderTask = pageProxy.render(params);
    await renderTask.promise;

    return {
      canvas,
      pageProxy,
      scale,
    };
  }

  //#region event handlers
  private onAreaPointerDown = (e: PointerEvent) => {
    const area = (e.target as HTMLElement).closest(".comparison-area");
    if (!area) {
      return;
    }
    if (area.classList.contains("transparent")) {
      area.classList.remove("transparent");
      area.classList.add("opaque");
    } else if (area.classList.contains("opaque")) {
      area.classList.remove("opaque");
    } else {
      area.classList.add("transparent");
    }
  };
  
  private onAreaPointerEnter = (e: PointerEvent) => {
    const area = e.target as SVGGElement;
    area.classList.remove("opaque");
    area.classList.add("transparent");
  };
  
  private onAreaPointerLeave = (e: PointerEvent) => {
    const area = e.target as SVGGElement;
    area.classList.remove("opaque");
    area.classList.remove("transparent");
  };
  //#endregion
}
