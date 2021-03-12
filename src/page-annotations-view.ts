import { Vec2 } from "./math";
import { DocumentData } from "./document/document-data";
import { AnnotationDict } from "./document/entities/annotations/annotation-dict";

export class PageAnnotationView {  
  private readonly _pageId: number;
  private readonly _pageDimensions: Vec2;

  private _docData: DocumentData;
  private _annotations: AnnotationDict[];
  private _svgByAnnotation = new Map<AnnotationDict, SVGGraphicsElement>();
  private _selectedAnnotation: AnnotationDict;

  private _container: HTMLDivElement;
  private _svg: SVGSVGElement;
  private _defs: SVGDefsElement;
  private _rendered: boolean;

  constructor(docData: DocumentData, pageId: number, pageDimensions: Vec2) {
    if (!docData || isNaN(pageId) || !pageDimensions) {
      throw new Error("Required argument not found");
    }
    this._pageId = pageId;
    this._pageDimensions = pageDimensions;

    this._container = document.createElement("div");
    this._container.classList.add("page-annotations");
    // this._container.addEventListener("mousedown", this.onMouseDown);
    // this._container.addEventListener("mouseup", this.onMouseUp);

    this._svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    this._svg.classList.add("stretch");
    this._svg.setAttribute("data-page-id", pageId + "");
    this._svg.setAttribute("viewBox", `0 0 ${pageDimensions.x} ${pageDimensions.y}`);
    this._svg.setAttribute("transform", "scale(1, -1)"); // flip Y to match PDF coords where 0,0 is the lower-left corner
    this._svg.addEventListener("pointerdown", (e: PointerEvent) => {
      if (e.target === this._svg) {
        this.switchSelectedAnnotation(null);
      }
    });
    
    this._defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    this._container.append(this._svg);

    this._annotations = docData.getPageAnnotations(pageId);
  } 

  destroy() {
    this.remove();
    this._container = null;
  }

  remove() {    
    this._container?.remove();
  }  

  async appendAsync(parent: HTMLElement) {
    if (!this._rendered) {
      await this.renderAnnotationsAsync();
      this._rendered = true;
    }
    parent.append(this._container);
  }

  private switchSelectedAnnotation(annotation: AnnotationDict) {
    if (annotation === this._selectedAnnotation) {
      return;
    }

    if (this._selectedAnnotation) {
      const oldSelectedSvg = this._svgByAnnotation.get(this._selectedAnnotation);
      oldSelectedSvg?.classList.remove("selected");
    }

    const newSelectedSvg = this._svgByAnnotation.get(annotation);
    if (!newSelectedSvg) {
      this._selectedAnnotation = null;
      return;
    }
    newSelectedSvg.classList.add("selected");
    this._svg.append(newSelectedSvg); // reappend selected svg to move it to the top
    this._selectedAnnotation = annotation;
  }

  private renderAnnotation(annotation: AnnotationDict) {
    const svgWithBox = annotation.render();
    if (!svgWithBox) {
      return;
    }
    const {svg, clipPaths} = svgWithBox;
    this._svgByAnnotation.set(annotation, svg);
    svg.addEventListener("pointerdown", 
      () => this.switchSelectedAnnotation(annotation));
    this._svg.append(svg);
    clipPaths?.forEach(x => this._defs.append(x));
  }

  private async renderAnnotationsAsync(): Promise<boolean> {    
    this.clear();

    const promises: Promise<void>[] = [];
    for (let i = 0; i < this._annotations?.length || 0; i++) {
      promises.push(new Promise<void>(resolve => {
        setTimeout(() => { 
          this.renderAnnotation(this._annotations[i]);
          resolve();
        }, 0);
      }));
    }

    await Promise.all(promises);
    this._svg.append(this._defs);

    return true;
  }

  private clear() {
    this._svg.innerHTML = "";
    this._svgByAnnotation.clear();
  }
}
