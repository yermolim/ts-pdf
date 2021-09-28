// export class PageComparisonView {
//   private _container: HTMLDivElement;
//   private _svg: SVGSVGElement;

//   private _destroyed: boolean;

//   constructor(docService: DocumentService, pageInfo: PageInfo, pageDimensions: Vec2) {
//     if (!docService || !pageInfo || !pageDimensions) {
//       throw new Error("Required argument not found");
//     }
//     this._pageInfo = pageInfo;
//     this._viewbox = [0, 0, pageDimensions.x, pageDimensions.y];

//     this._docService = docService;

//     this._container = document.createElement("div");
//     this._container.classList.add("page-annotations");

//     this._svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//     this._svg.classList.add("page-annotations-controls");
//     this._svg.setAttribute("data-page-id", pageInfo + "");
//     this._svg.setAttribute("viewBox", `0 0 ${pageDimensions.x} ${pageDimensions.y}`);
//     // flip Y to match PDF coords where 0,0 is the lower-left corner
//     this._svg.setAttribute("transform", "scale(1, -1)");
//     // handle annotation selection
//     this._svg.addEventListener("pointerdown", (e: PointerEvent) => {
//       if (e.target === this._svg) {
//         docService.setSelectedAnnotation(null);
//       }
//     });    
//   } 

//   /**free the resources that can prevent garbage to be collected */
//   destroy() {
//     this._destroyed = true;

//     this.remove();
//     this._container = null;

//     this._rendered.forEach(x => {
//       x.$onPointerDownAction = null;
//       x.$onPointerEnterAction = null;
//       x.$onPointerLeaveAction = null;
//     });
//     this._rendered.clear();
//   }

//   /**remove the container from DOM */
//   remove() {    
//     this._container?.remove();
//     this._docService.eventService.removeListener(annotChangeEvent, this.onAnnotationSelectionChange);
//   }  

//   /**
//    * render the page annotations and append them to the specified parent container
//    * @param parent 
//    * @returns 
//    */
//   async appendAsync(parent: HTMLElement) {
//     if (this._destroyed) {
//       return;
//     }
    
//     parent.append(this._container);
    
//     const renderResult = await this.renderAnnotationsAsync();
//     if (!renderResult) {
//       this._container?.remove();
//       return;
//     }

//     this._docService.eventService.addListener(annotChangeEvent, this.onAnnotationSelectionChange);
//   }

//   private clear() {
//     this._container.innerHTML = "";
//     this._svg.innerHTML = "";
//   }
// }
