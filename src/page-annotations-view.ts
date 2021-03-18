import { RenderToSvgResult } from "./common";
import { Vec2 } from "./math";
import { DocumentData } from "./document/document-data";
import { AnnotationDict } from "./document/entities/annotations/annotation-dict";

export class PageAnnotationView {  
  private readonly _pageId: number;
  private readonly _pageDimensions: Vec2;

  private _docData: DocumentData;
  private _rendered = new Map<AnnotationDict, RenderToSvgResult>();

  private _container: HTMLDivElement;
  private _svg: SVGSVGElement;
  private _defs: SVGDefsElement;

  constructor(docData: DocumentData, pageId: number, pageDimensions: Vec2) {
    if (!docData || isNaN(pageId) || !pageDimensions) {
      throw new Error("Required argument not found");
    }
    this._pageId = pageId;
    this._pageDimensions = pageDimensions;

    this._docData = docData;

    this._container = document.createElement("div");
    this._container.classList.add("page-annotations");

    this._svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this._svg.classList.add("stretch");
    this._svg.setAttribute("data-page-id", pageId + "");
    this._svg.setAttribute("viewBox", `0 0 ${pageDimensions.x} ${pageDimensions.y}`);
    this._svg.setAttribute("transform", "scale(1, -1)"); // flip Y to match PDF coords where 0,0 is the lower-left corner
    
    // handle annotation selection
    this._svg.addEventListener("pointerdown", (e: PointerEvent) => {
      if (e.target === this._svg) {
        docData.setSelectedAnnotation(null);
      }
    });
    document.addEventListener("annotationselectionchange", (e: Event) => {
      const annotation: AnnotationDict = e["detail"].annotation;
      if (annotation) {
        this._container.style.touchAction = "none";
      } else {
        this._container.style.touchAction = "";
      }
    });
    
    this._defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    this._container.append(this._svg);
  } 

  destroy() {
    this.remove();
    this._container = null;
  }

  remove() {    
    this._container?.remove();
  }  

  async appendAsync(parent: HTMLElement) {
    await this.renderAnnotationsAsync();
    parent.append(this._container);
  }

  private async renderAnnotationsAsync(): Promise<boolean> {    
    this.clear();

    const annotations = this._docData.getPageAnnotations(this._pageId) || [];

    for (let i = 0; i < annotations.length || 0; i++) {
      const annotation = annotations[i];
      if (annotation.deleted) {
        continue;
      }

      let renderResult: RenderToSvgResult;
      if (!this._rendered.has(annotation)) {
        await new Promise<void>(resolve => {
          setTimeout(async () => { 
            renderResult = await annotation.renderAsync();
            resolve();
          }, 0);
        });
      } else {
        renderResult = this._rendered.get(annotation);
      }   

      if (!renderResult) {
        continue;
      }      
      this._rendered.set(annotation, renderResult);
      const {svg, clipPaths} = renderResult;
      this._svg.append(svg);
      clipPaths?.forEach(x => this._defs.append(x));
      svg.addEventListener("pointerdown", 
        () => this._docData.setSelectedAnnotation(annotation));
    }

    this._svg.append(this._defs);

    return true;
  }

  private clear() {
    this._svg.innerHTML = "";
    // this._rendered.clear();
  }
}
