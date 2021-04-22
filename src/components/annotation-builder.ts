import { Quadruple } from "../common";
import { Vec2 } from "../math";

import { geometricIcons } from "../assets/index.html";

import { DocumentData } from "../document/document-data";

import { Annotator } from "../annotator/annotator";
import { GeometricAnnotatorFactory, geometricAnnotatorTypes } 
  from "../annotator/geometric/geometric-annotator-factory";
import { PenAnnotator } from "../annotator/pen/pen-annotator";
import { StampAnnotator, supportedStampTypes } from "../annotator/stamp/stamp-annotator";

import { Viewer } from "./viewer";
import { ContextMenu } from "./context-menu";
import { PageService, pagesRenderedEvent, PagesRenderedEvent } from "./pages/page-service";

export type AnnotationBuilderMode = "select" | "stamp" | "pen" | "geometric";

export class AnnotationBuilder {
  private readonly _annotationColors: readonly Quadruple[] = [
    [0, 0, 0, 0.5], // black
    [0.804, 0, 0, 0.5], // red
    [0, 0.804, 0, 0.5], // green
    [0, 0, 0.804, 0.5], // blue
  ];
  
  private readonly _docData: DocumentData;
  private readonly _viewer: Viewer;
  private readonly _pageService: PageService;
  
  private _contextMenu: ContextMenu;
  private _viewerResizeObserver: ResizeObserver;
  
  private _mode: AnnotationBuilderMode;  
  get mode(): AnnotationBuilderMode {
    return this._mode;
  }
  set mode(value: AnnotationBuilderMode) {
    this.setMode(value);
  }

  private _annotator: Annotator;
  get annotator(): Annotator {
    return this._annotator;
  }

  constructor(docData: DocumentData, pageService: PageService, viewer: Viewer, ) {
    if (!docData) {
      throw new Error("Document data is not defined");
    }
    if (!pageService) {
      throw new Error("Page service is not defined");
    }
    if (!viewer) {
      throw new Error("Viewer is not defined");
    }

    this._docData = docData;
    this._pageService = pageService;
    this._viewer = viewer;

    this.init();
  }

  destroy() {
    document.removeEventListener(pagesRenderedEvent, this.onPagesRendered);

    this._viewer.container.removeEventListener("contextmenu", this.onContextMenu);
    this._viewerResizeObserver?.disconnect();

    this._contextMenu?.destroy();
    this._annotator?.destroy();
  }  

  private init() {
    document.addEventListener(pagesRenderedEvent, this.onPagesRendered);    

    this._viewer.container.addEventListener("contextmenu", this.onContextMenu);
    const viewerRObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      this._contextMenu?.hide();
    });
    viewerRObserver.observe(this._viewer.container);
    this._viewerResizeObserver = viewerRObserver;
  }

  private initContextMenu() {    
    this._contextMenu?.destroy();
    switch (this.mode) {
      case "select":
        break;
      case "stamp":
        this.initStampAnnotatorContextMenu();
        break;
      case "pen":
        this.initPenAnnotatorContextMenu();
        break;
      case "geometric":
        this.initGeometricAnnotatorContextMenu();
        break;
      default:
        // Execution should not come here
        throw new Error(`Invalid annotation mode: ${this.mode}`);
    }
  }

  private setMode(mode: AnnotationBuilderMode) {
    // return if mode is same
    if (!mode || mode === this._mode) {
      return;
    }

    // disable previous mode
    this._contextMenu?.destroy();
    this._annotator?.destroy();
    this._docData.setSelectedAnnotation(null);

    this._mode = mode;
    switch (mode) {
      case "select":
        break;
      case "stamp":
        this._annotator = new StampAnnotator(this._docData, 
          this._viewer.container, this._pageService.renderedPages);
        break;
      case "pen":
        this._annotator = new PenAnnotator(this._docData, 
          this._viewer.container, this._pageService.renderedPages);
        break;
      case "geometric":
        this._annotator = GeometricAnnotatorFactory.CreateAnnotator(this._docData, 
          this._viewer.container, this._pageService.renderedPages);
        break;
      default:
        // Execution should not come here
        throw new Error(`Invalid annotation mode: ${mode}`);
    }
    this.initContextMenu();
  }
  
  private onContextMenu = (event: MouseEvent) => {
    if (this._contextMenu?.enabled) {
      event.preventDefault();
      this._contextMenu.show(new Vec2(event.clientX, event.clientY), this._viewer.container);
    }
  };

  private onPagesRendered = (event: PagesRenderedEvent) => {    
    this.initContextMenu();
  };

  private initStampAnnotatorContextMenu() {
    const stampTypes = supportedStampTypes;

    // init a stamp type picker
    const contextMenuContent = document.createElement("div");
    contextMenuContent.classList.add("context-menu-content", "column");
    stampTypes.forEach(x => {          
      const item = document.createElement("div");
      item.classList.add("context-menu-stamp-select-button");
      item.addEventListener("click", () => {
        this._contextMenu.hide();
        this._annotator?.destroy();
        this._annotator = new StampAnnotator(this._docData,
          this._viewer.container, this._pageService.renderedPages, x.type);
      });
      const stampName = document.createElement("div");
      stampName.innerHTML = x.name;
      item.append(stampName);
      contextMenuContent.append(item);
    });
    
    this._contextMenu = new ContextMenu();
    // set the stamp type picker as the context menu content
    this._contextMenu.content = [contextMenuContent];
    // enable the context menu
    this._contextMenu.enabled = true;
  }

  private initPenAnnotatorContextMenu() {
    // init a pen color picker
    const contextMenuColorPicker = document.createElement("div");
    contextMenuColorPicker.classList.add("context-menu-content", "row");
    this._annotationColors.forEach(x => {          
      const item = document.createElement("div");
      item.classList.add("panel-button");
      item.addEventListener("click", () => {
        this._contextMenu.hide();
        this._annotator?.destroy();
        this._annotator = new PenAnnotator(this._docData, this._viewer.container, 
          this._pageService.renderedPages, {color:x});
      });
      const colorIcon = document.createElement("div");
      colorIcon.classList.add("context-menu-color-icon");
      colorIcon.style.backgroundColor = `rgb(${x[0]*255},${x[1]*255},${x[2]*255})`;
      item.append(colorIcon);
      contextMenuColorPicker.append(item);
    });

    // init a pen stroke width slider
    const contextMenuWidthSlider = document.createElement("div");
    contextMenuWidthSlider.classList.add("context-menu-content", "row");
    const slider = document.createElement("input");
    slider.setAttribute("type", "range");
    slider.setAttribute("min", "1");
    slider.setAttribute("max", "32");
    slider.setAttribute("step", "1");
    slider.setAttribute("value", "3");
    slider.classList.add("context-menu-slider");
    slider.addEventListener("change", () => {      
      this._annotator?.destroy();
      this._annotator = new PenAnnotator(this._docData, this._viewer.container, 
        this._pageService.renderedPages, {strokeWidth: slider.valueAsNumber});
    });
    contextMenuWidthSlider.append(slider);

    this._contextMenu = new ContextMenu();
    // set the context menu content    
    this._contextMenu.content = [contextMenuColorPicker, contextMenuWidthSlider];
    // enable the context menu
    this._contextMenu.enabled = true;
  }

  private initGeometricAnnotatorContextMenu() {
    const contextMenuSubmodePicker = document.createElement("div");
    contextMenuSubmodePicker.classList.add("context-menu-content", "row");
    geometricAnnotatorTypes.forEach(x => {   
      const item = document.createElement("div");
      item.classList.add("panel-button");
      item.addEventListener("click", () => {
        this._contextMenu.hide();
        this._annotator?.destroy();
        this._annotator = GeometricAnnotatorFactory.CreateAnnotator(this._docData, this._viewer.container, 
          this._pageService.renderedPages, {}, x);
      });
      const submodeIcon = document.createElement("div");
      submodeIcon.classList.add("context-menu-color-icon");
      submodeIcon.innerHTML = geometricIcons[x];
      item.append(submodeIcon);
      contextMenuSubmodePicker.append(item);
    });
    // init a geometry color picker
    const contextMenuColorPicker = document.createElement("div");
    contextMenuColorPicker.classList.add("context-menu-content", "row");
    this._annotationColors.forEach(x => {          
      const item = document.createElement("div");
      item.classList.add("panel-button");
      item.addEventListener("click", () => {
        this._contextMenu.hide();
        this._annotator?.destroy();
        this._annotator = GeometricAnnotatorFactory.CreateAnnotator(this._docData, this._viewer.container, 
          this._pageService.renderedPages, {color:x});
      });
      const colorIcon = document.createElement("div");
      colorIcon.classList.add("context-menu-color-icon");
      colorIcon.style.backgroundColor = `rgb(${x[0]*255},${x[1]*255},${x[2]*255})`;
      item.append(colorIcon);
      contextMenuColorPicker.append(item);
    });
    // init a pen stroke width slider
    const contextMenuWidthSlider = document.createElement("div");
    contextMenuWidthSlider.classList.add("context-menu-content", "row");
    const slider = document.createElement("input");
    slider.setAttribute("type", "range");
    slider.setAttribute("min", "1");
    slider.setAttribute("max", "32");
    slider.setAttribute("step", "1");
    slider.setAttribute("value", "3");
    slider.classList.add("context-menu-slider");
    slider.addEventListener("change", () => {      
      this._annotator?.destroy();
      this._annotator = GeometricAnnotatorFactory.CreateAnnotator(this._docData, this._viewer.container, 
        this._pageService.renderedPages, {strokeWidth: slider.valueAsNumber});
    });
    contextMenuWidthSlider.append(slider);
    
    this._contextMenu = new ContextMenu();
    // set the context menu content    
    this._contextMenu.content = [contextMenuSubmodePicker, contextMenuColorPicker, contextMenuWidthSlider];
    // enable the context menu
    this._contextMenu.enabled = true;
  }
}
