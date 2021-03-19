// import { DocumentData } from "../document/document-data";
// import { AnnotationDict } from "../document/entities/annotations/annotation-dict";

// import { PenTempData } from "./pen-temp-data";

// interface PageCoords {
//   pageId: number;
//   pageX: number;
//   pageY: number;
// }

// export type AnnotatorMode = "select" | "stamp" | "pen" | "geometric";

// export class Annotator {
//   private _docData: DocumentData;

//   private _annotationMode: AnnotatorMode;
//   private _annotationOverlayContainer: HTMLDivElement;
//   private _annotationOverlay: HTMLDivElement;
//   private _annotationOverlaySvg: SVGGraphicsElement;
//   private _annotationOverlayMObserver: MutationObserver;
//   private _annotationOverlayRObserver: ResizeObserver;
//   private _annotationOverlayPageCoords: PageCoords;  
//   private _annotationToAdd: AnnotationDict;
//   private _annotationPenData: PenTempData;

//   constructor(docData: DocumentData) {
//     if (!this._docData) {
//       throw new Error("Document data not found");
//     }
//     this._docData = docData;
//   }

//   destroy() {    
//     this._annotationOverlayMObserver?.disconnect();
//     this._annotationOverlayRObserver?.disconnect();
//   }
  
//   private initAnnotationOverlay() {
//     const annotationOverlayContainer = document.createElement("div");
//     annotationOverlayContainer.id = "annotation-overlay-container";
    
//     const annotationOverlay = document.createElement("div");
//     annotationOverlay.id = "annotation-overlay";
    
//     const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
//     svg.classList.add("abs-stretch", "no-margin", "no-padding");
//     svg.setAttribute("transform", "matrix(1 0 0 -1 0 0)");
//     svg.setAttribute("opacity", "0.5");

//     const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
//     svg.append(g);

//     annotationOverlay.append(svg);
//     annotationOverlayContainer.append(annotationOverlay);

//     // keep overlay properly positioned depending on the viewer scroll
//     this._viewer.addEventListener("scroll", () => {
//       annotationOverlay.style.left = this._viewer.scrollLeft + "px";
//       annotationOverlay.style.top = this._viewer.scrollTop + "px";
//     });
    
//     let lastScale: number;
//     const updateSvgViewBox = () => {
//       const {width: w, height: h} = annotationOverlay.getBoundingClientRect();
//       if (!w || !h) {
//         return;
//       }

//       const viewBoxWidth = w / this._scale;
//       const viewBoxHeight = h / this._scale;
//       svg.setAttribute("viewBox", `0 0 ${viewBoxWidth} ${viewBoxHeight}`);
//       lastScale = this._scale;
//     };
//     updateSvgViewBox();

//     // add observers to keep the svg scale actual
//     const onPossibleViewerSizeChanged = () => {
//       if (this._scale === lastScale) {
//         return;
//       }
//       updateSvgViewBox();
//     };
//     const viewerRObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
//       onPossibleViewerSizeChanged();
//     });
//     const viewerMObserver = new MutationObserver((mutations: MutationRecord[]) => {
//       const record = mutations[0];
//       if (!record) {
//         return;
//       }
//       record.addedNodes.forEach(x => {
//         const element = x as HTMLElement;
//         if (element.classList.contains("page")) {
//           viewerRObserver.observe(x as HTMLElement);
//         }
//       });
//       record.removedNodes.forEach(x => viewerRObserver.unobserve(x as HTMLElement));
//       onPossibleViewerSizeChanged();
//     });
//     viewerMObserver.observe(this._viewer, {
//       attributes: false,
//       childList: true,
//       subtree: false,
//     });

//     this._annotationOverlayMObserver = viewerMObserver;
//     this._annotationOverlayRObserver = viewerRObserver;
    
//     this._annotationOverlayContainer = annotationOverlayContainer;
//     this._annotationOverlay = annotationOverlay;
//     this._annotationOverlaySvg = g;
//   }

//   private onAnnotationDeleteButtonClick = () => {
//     const annotation = this._docData.selectedAnnotation;
//     if (annotation) {
//       this._docData.removeAnnotation(annotation);
//       // rerender the page
//       this.forceRenderPageById(annotation.pageId);
//     }
//   };

//   //#region annotation modes
//   private setAnnotationMode(mode: AnnotatorMode) {
//     if (!mode || mode === this._annotationMode) {
//       return;
//     }
//     // disable previous mode
//     this.disableCurrentAnnotationMode();
//     switch (mode) {
//       case "select":
//         this._shadowRoot.querySelector("#button-annotation-mode-select").classList.add("on");
//         break;
//       case "stamp":
//         this._shadowRoot.querySelector("#button-annotation-mode-stamp").classList.add("on");
//         this._annotationOverlay.addEventListener("pointermove", 
//           this.onStampPointerMove);
//         this._annotationOverlay.addEventListener("pointerup", 
//           this.onStampPointerUp);
//         this._viewer.append(this._annotationOverlayContainer);
//         this.createTempStampAnnotationAsync();
//         break;
//       case "pen":
//         this._shadowRoot.querySelector("#button-annotation-mode-pen").classList.add("on");
//         this._annotationOverlay.addEventListener("pointerdown", 
//           this.onPenPointerDown);      
//         this._viewer.append(this._annotationOverlayContainer);
//         break;
//       case "geometric":
//         this._shadowRoot.querySelector("#button-annotation-mode-geometric").classList.add("on");
//         this._viewer.append(this._annotationOverlayContainer);
//         break;
//       default:
//         // Execution should not come here
//         throw new Error(`Invalid annotation mode: ${mode}`);
//     }
//     this._annotationMode = mode;
//   }

//   private disableCurrentAnnotationMode() {    
//     if (this._annotationMode) {  
//       this._annotationToAdd = null;    
//       this._annotationOverlayContainer.remove();
//       this._annotationOverlaySvg.innerHTML = "";
//       this._annotationOverlaySvg.removeAttribute("transform");
//       switch (this._annotationMode) {
//         case "select":
//           this._shadowRoot.querySelector("#button-annotation-mode-select").classList.remove("on");
//           this._docData.setSelectedAnnotation(null);
//           break;
//         case "stamp":
//           this._shadowRoot.querySelector("#button-annotation-mode-stamp").classList.remove("on");
//           this._annotationOverlay.removeEventListener("pointermove", 
//             this.onStampPointerMove);
//           this._annotationOverlay.removeEventListener("pointerup", 
//             this.onStampPointerUp);
//           break;
//         case "pen":
//           this._shadowRoot.querySelector("#button-annotation-mode-pen").classList.remove("on");
//           this._annotationOverlay.removeEventListener("pointerdown", 
//             this.onPenPointerDown);
//           this.removeTempPenData();
//           break;
//         case "geometric":
//           this._shadowRoot.querySelector("#button-annotation-mode-geometric").classList.remove("on");
//           break;
//       }
//     }
//   }
  
//   private onAnnotationSelectModeButtonClick = () => {
//     this.setAnnotationMode("select");
//   };

//   private onAnnotationStampModeButtonClick = () => {
//     this.setAnnotationMode("stamp");
//   };

//   private onAnnotationPenModeButtonClick = () => {
//     this.setAnnotationMode("pen");
//   };
  
//   private onAnnotationGeometricModeButtonClick = () => {
//     this.setAnnotationMode("geometric");
//   };
//   //#endregion

//   //#region stamp annotations
//   private async createTempStampAnnotationAsync() {
//     const stamp = this._docData.createStampAnnotation("draft");
//     const renderResult = await stamp.renderAsync();  

//     this._annotationOverlaySvg.innerHTML = "";  
//     this._annotationOverlaySvg.append(...renderResult.clipPaths || []);
//     this._annotationOverlaySvg.append(renderResult.svg);

//     this._annotationToAdd = stamp;
//   }

//   private onStampPointerMove = (e: PointerEvent) => {
//     if (!e.isPrimary) {
//       return;
//     }

//     const {clientX: cx, clientY: cy} = e;

//     // bottom-left overlay coords
//     const {height: oh, top, left: ox} = this._viewer.getBoundingClientRect();
//     const oy = top + oh;

//     const offsetX = (cx - ox) / this._scale;
//     const offsetY = (oy - cy) / this._scale;

//     const [x1, y1, x2, y2] = this._annotationToAdd.Rect;
//     this._annotationOverlaySvg.setAttribute("transform",
//       `translate(${offsetX - (x2 - x1) / 2} ${offsetY - (y2 - y1) / 2})`);

//     // get coords under the pointer relatively to the page under it 
//     this.updatePageCoords(cx, cy);
//   };

//   private onStampPointerUp = (e: PointerEvent) => {
//     if (!e.isPrimary) {
//       return;
//     }

//     const {clientX: cx, clientY: cy} = e;
//     const pageCoords = this.getPageCoordsUnderPointer(cx, cy);
//     this._annotationOverlayPageCoords = pageCoords;

//     if (!pageCoords || !this._annotationToAdd) {
//       return;
//     }

//     // translate the stamp to the pointer position
//     const {pageId, pageX, pageY} = this._annotationOverlayPageCoords;
//     this._annotationToAdd.moveTo(pageX, pageY);
//     this._docData.appendAnnotationToPage(pageId, this._annotationToAdd);

//     // rerender the page
//     this.forceRenderPageById(pageId);

//     // create new temp annotation
//     this.createTempStampAnnotationAsync();
//   };
//   //#endregion

//   //#region ink annotations
//   private removeTempPenData() {
//     if (this._annotationPenData) {
//       this._annotationPenData.group.remove();
//       document.removeEventListener("visiblepagesrender", this.updatePenGroupPosition);
//       this._annotationPenData = null;
//     }    
//   }

//   private resetTempPenData(pageId: number) {    
//     this.removeTempPenData();    
//     this._annotationPenData = new PenTempData({id: pageId});
//     this._annotationOverlaySvg.append(this._annotationPenData.group);

//     // update pen group matrix to position the group properly
//     document.addEventListener("visiblepagesrender", this.updatePenGroupPosition);
//     this.updatePenGroupPosition();
//   }
  
//   private onPenPointerDown = (e: PointerEvent) => {
//     if (!e.isPrimary) {
//       return;
//     }

//     const {clientX: cx, clientY: cy} = e;
//     this.updatePageCoords(cx, cy);
//     const pageCoords = this._annotationOverlayPageCoords;
//     if (!pageCoords) {
//       // return if the pointer is outside page
//       return;
//     }

//     const {pageX: px, pageY: py, pageId} = pageCoords;
//     if (!this._annotationPenData || pageId !== this._annotationPenData.id) {
//       this.resetTempPenData(pageId);
//     }
//     this._annotationPenData.newPath(new Vec2(px, py));

//     const target = e.target as HTMLElement;
//     target.addEventListener("pointermove", this.onPenPointerMove);
//     target.addEventListener("pointerup", this.onPenPointerUp);    
//     target.addEventListener("pointerout", this.onPenPointerUp);    

//     // capture pointer to make pointer events fire on same target
//     target.setPointerCapture(e.pointerId);
//   };

//   private onPenPointerMove = (e: PointerEvent) => {
//     if (!e.isPrimary || !this._annotationPenData) {
//       return;
//     }

//     const {clientX: cx, clientY: cy} = e;
//     this.updatePageCoords(cx, cy);

//     const pageCoords = this._annotationOverlayPageCoords;
//     if (!pageCoords || pageCoords.pageId !== this._annotationPenData.id) {
//       // skip move if the pointer is outside of the starting page
//       return;
//     }
    
//     this._annotationPenData.addPosition(new Vec2(pageCoords.pageX, pageCoords.pageY));
//   };

//   private onPenPointerUp = (e: PointerEvent) => {
//     if (!e.isPrimary) {
//       return;
//     }

//     const target = e.target as HTMLElement;
//     target.removeEventListener("pointermove", this.onPenPointerMove);
//     target.removeEventListener("pointerup", this.onPenPointerUp);    
//     target.removeEventListener("pointerout", this.onPenPointerUp);   

//     this._annotationPenData?.endPath();
//   };

//   private updatePenGroupPosition = () => {
//     if (!this._annotationPenData) {
//       return;
//     }
//     const page = this._renderedPages.find(x => x.id === this._annotationPenData.id);
//     if (!page) {
//       // set scale to 0 to hide pen group if it's page is not rendered
//       this._annotationPenData.setGroupMatrix(
//         [0, 0, 0, 0, 0, 0]);
//     }
//     const {height: ph, top: ptop, left: px} = page.viewContainer.getBoundingClientRect();
//     const py = ptop + ph;
//     const {height: vh, top: vtop, left: vx} = this._viewer.getBoundingClientRect();
//     const vy = vtop + vh;
//     const offsetX = (px - vx) / this._scale;
//     const offsetY = (vy - py) / this._scale;

//     this._annotationPenData.setGroupMatrix(
//       [1, 0, 0, 1, offsetX, offsetY]);
//   };
//   //#endregion

//   //#region misc
//   private updatePageCoords(clientX: number, clientY: number) {
//     const pageCoords = this.getPageCoordsUnderPointer(clientX, clientY);
//     if (!pageCoords) {
//       this._annotationOverlaySvg.classList.add("out");
//     } else {      
//       this._annotationOverlaySvg.classList.remove("out");
//     }

//     this._annotationOverlayPageCoords = pageCoords;
//   }
//   //#endregion
// }
