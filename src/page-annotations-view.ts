import { AnnotationData } from "./document/annotation-data";
import { AnnotationDict } from "./document/entities/annotations/annotation-dict";
import { Vec2 } from "./math";

export class PageAnnotationView {  
  private readonly _pageId: number;
  private readonly _pageDimensions: Vec2;

  private _annotationData: AnnotationData;
  private _annotations: AnnotationDict[];
  private _svgByAnnotation = new Map<AnnotationDict, SVGGraphicsElement>();
  private _selectedAnnotation: AnnotationDict;

  private _container: HTMLDivElement;
  private _svg: SVGSVGElement;
  private _defs: SVGDefsElement;

  private _rendered: boolean;
  private _editModeOn: boolean;
  private _divModeTimer: number;

  constructor(annotationData: AnnotationData, pageId: number, pageDimensions: Vec2) {
    if (!annotationData || isNaN(pageId) || !pageDimensions) {
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
    this._defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    this._container.append(this._svg);

    this._annotations = annotationData.getPageAnnotations(pageId);

    this.switchEditMode(true);
  } 

  destroy() {
    this.remove();
    this._container = null;
  }

  remove() {    
    this.switchEditMode(false);
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
    if (!this._editModeOn || annotation === this._selectedAnnotation) {
      return;
    }

    if (this._selectedAnnotation) {
      const oldSelectedSvg = this._svgByAnnotation.get(this._selectedAnnotation);
      oldSelectedSvg?.classList.remove("selected");
    }

    const newSelectedSvg = this._svgByAnnotation.get(annotation);
    if (!newSelectedSvg) {
      return;
    }
    newSelectedSvg.classList.add("selected");
    this._svg.append(newSelectedSvg); // reappend selected svg to move it to the top
    this._selectedAnnotation = annotation;
  }

  private switchEditMode(value?: boolean) {
    value = value ?? !this._editModeOn;
    this._editModeOn = value;
    if (value) {
      this._container.classList.remove("passive");
    } else {
      this._container.classList.add("passive");
      this.switchSelectedAnnotation(null);
    }
  }

  private renderAnnotation(annotation: AnnotationDict) {
    const svgWithBox = annotation.render();
    if (!svgWithBox) {
      return;
    }
    const {svg, clipPaths} = svgWithBox;
    this._svgByAnnotation.set(annotation, svg);
    svg.addEventListener("click", () => {
      this.switchSelectedAnnotation(annotation);
    });
    this._svg.append(svg);
    clipPaths.forEach(x => this._defs.append(x));
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

  private onMouseDown = (e: MouseEvent) => {

  };
  
  private onMouseUp = (e: MouseEvent) => {

  };
}
