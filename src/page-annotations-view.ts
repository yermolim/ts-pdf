import { AnnotationData } from "./document/annotation-data";
import { AnnotationDict } from "./document/entities/annotations/annotation-dict";
import { Vec2 } from "./math";

export class PageAnnotationView {  
  private readonly _pageId: number;
  private readonly _pageDimensions: Vec2;

  private _annotationData: AnnotationData;
  private _pageAnnotations: AnnotationDict[];
  private _svgByAnnotation = new Map<AnnotationDict, SVGGraphicsElement>();

  private _container: HTMLDivElement;
  private _svg: SVGSVGElement;

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
    this._container.append(this._svg);

    this._pageAnnotations = annotationData.getPageAnnotations(pageId);

    this.switchEditMode(false);
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

  private switchEditMode(value?: boolean) {
    value = value ?? !this._editModeOn;
    this._editModeOn = value;
    if (value) {
      this._container.classList.remove("passive");
    } else {
      this._container.classList.add("passive");
    }
  }

  private renderAnnotation(annotation: AnnotationDict) {
    const svgWithBox = annotation.render();
    if (!svgWithBox) {
      return;
    }
    const {svg, box} = svgWithBox;
    this._svgByAnnotation.set(annotation, svg);
    this._svg.append(svg);
  }

  private async renderAnnotationsAsync(): Promise<boolean> {    
    this.clear();

    for (let i = 0; i < this._pageAnnotations?.length || 0; i++) {
      setTimeout(() => this.renderAnnotation(this._pageAnnotations[i]), 0);
    }

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
