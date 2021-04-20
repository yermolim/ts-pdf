/* eslint-disable @typescript-eslint/no-use-before-define */
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist/types/display/api";

import { html, passwordDialogHtml } from "./assets/index.html";
import { styles } from "./assets/styles.html";

import { Quadruple } from "./common";
import { clamp, Vec2 } from "./math";

import { DocumentData } from "./document/document-data";

import { ContextMenu } from "./components/context-menu";
import { Viewer } from "./components/viewer";
import { Previewer } from "./components/previewer";
import { PageView } from "./components/pages/page-view";
import { PageService, currentPageChangeEvent, CurrentPageChangeEvent, 
  pagesRenderedEvent, PagesRenderedEvent } from "./components/pages/page-service";

import { Annotator } from "./annotator/annotator";
import { StampAnnotator, supportedStampTypes } from "./annotator/stamp/stamp-annotator";
import { pathChangeEvent, PathChangeEvent, PenAnnotator } from "./annotator/pen/pen-annotator";
import { GeometricAnnotatorFactory, geometricAnnotatorTypes, GeometricAnnotatorType } 
  from "./annotator/geometric/geometric-annotator-factory";
import { AnnotationDto, annotChangeEvent, AnnotEvent, AnnotEventDetail } from "./document/entities/annotations/annotation-dict";

type ViewerMode = "text" | "hand" | "annotation";
type AnnotatorMode = "select" | "stamp" | "pen" | "geometric";

type FileButtons = "open" | "save" | "close";

export interface TsPdfViewerOptions {
  /**parent container CSS selector */
  containerSelector: string;
  /**path to the PDF.js worker */
  workerSource: string;
  /**current user name (used for annotations) */
  userName?: string;

  /**list of the file interaction buttons shown*/
  fileButtons?: FileButtons[];
  /**action to execute instead of the default file open action*/
  fileOpenAction?: () => void;
  /**action to execute instead of the default file download action*/
  fileSaveAction?: () => void;
  fileCloseAction?: () => void;

  /**action to execute on annotation change event */
  annotChangeCallback?: (detail: AnnotEventDetail) => void;
  
  /**number of pages that should be prerendered outside view */
  visibleAdjPages?: number;
  /**page preview canvas width in px */
  previewWidth?: number;
  minScale?: number;
  maxScale?: number;
}

export {AnnotationDto, AnnotEvent, AnnotEventDetail};

export class TsPdfViewer {
  //#region private fields
  private readonly _userName: string;

  // TODO: move readonly properties to the main options
  private readonly _annotationColors: readonly Quadruple[] = [
    [0, 0, 0, 0.5], // black
    [0.804, 0, 0, 0.5], // red
    [0, 0.804, 0, 0.5], // green
    [0, 0, 0.804, 0.5], // blue
  ];

  private readonly _outerContainer: HTMLDivElement;
  private readonly _shadowRoot: ShadowRoot;
  private readonly _mainContainer: HTMLDivElement;

  private readonly _contextMenu: ContextMenu;
  private readonly _pageService: PageService;
  private readonly _viewer: Viewer;
  private readonly _previewer: Previewer;

  private _fileOpenAction: () => void;
  private _fileSaveAction: () => void;
  private _fileCloseAction: () => void;
  private _annotChangeCallback: (detail: AnnotEventDetail) => void;

  private _mainContainerRObserver: ResizeObserver;
  private _panelsHidden: boolean;

  private _fileInput: HTMLInputElement;
  
  private _pdfLoadingTask: PDFDocumentLoadingTask;
  private _pdfDocument: PDFDocumentProxy;  

  private _docData: DocumentData;
  
  private _annotatorMode: AnnotatorMode;
  private _annotatorGeometricMode: GeometricAnnotatorType;
  private _annotator: Annotator;
  
  /**common timers */
  private _timers = {    
    hidePanels: 0,
  };
  //#endregion

  constructor(options: TsPdfViewerOptions) {
    if (!options) {
      throw new Error("No options provided");
    }

    const container = document.querySelector(options.containerSelector);
    if (!container) {
      throw new Error("Container not found");
    } else if (!(container instanceof HTMLDivElement)) {
      throw new Error("Container is not a DIV element");
    } else {
      this._outerContainer = container;
    }
    
    if (!options.workerSource) {
      throw new Error("Worker source path not defined");
    }
    GlobalWorkerOptions.workerSrc = options.workerSource;

    this._userName = options.userName || "Guest";
    this._fileOpenAction = options.fileOpenAction;
    this._fileSaveAction = options.fileSaveAction;
    this._fileCloseAction = options.fileCloseAction;
    this._annotChangeCallback = options.annotChangeCallback;
    
    const visibleAdjPages = options.visibleAdjPages || 0;
    const previewWidth = options.previewWidth || 100;
    const minScale = options.minScale || 0.25;
    const maxScale = options.maxScale || 4;

    this._shadowRoot = this._outerContainer.attachShadow({mode: "open"});
    this._shadowRoot.innerHTML = styles + html;   
    this._mainContainer = this._shadowRoot.querySelector("div#main-container") as HTMLDivElement;    
    this._contextMenu = new ContextMenu();  

    this._pageService = new PageService(
      {visibleAdjPages: visibleAdjPages});
    this._previewer = new Previewer(this._pageService, this._shadowRoot.querySelector("#previewer"), 
      {canvasWidth: previewWidth});
    this._viewer = new Viewer(this._pageService, this._shadowRoot.querySelector("#viewer"), 
      {minScale: minScale, maxScale: maxScale}); 

    this.initMainContainerEventHandlers();
    this.initViewControls();
    this.initFileButtons(options.fileButtons || []);
    this.initModeSwitchButtons();
    this.initAnnotationButtons();
    
    document.addEventListener(annotChangeEvent, this.onAnnotationChange);
    document.addEventListener(currentPageChangeEvent, this.onCurrentPagesChanged);
    document.addEventListener(pagesRenderedEvent, this.onPagesRendered);
    document.addEventListener(pathChangeEvent, this.onPenPathsChanged);
  }

  /**create a temp download link and click on it */
  private static downloadFile(blob: Blob, name?: string) {
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("download", name);
    link.href = url;
    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  //#region public API
  /**free resources to let GC clean them to avoid memory leak */
  destroy() {
    document.removeEventListener(annotChangeEvent, this.onAnnotationChange);
    document.removeEventListener(currentPageChangeEvent, this.onCurrentPagesChanged);
    document.removeEventListener(pagesRenderedEvent, this.onPagesRendered);
    document.removeEventListener(pathChangeEvent, this.onPenPathsChanged);

    this._annotChangeCallback = null;

    this._pdfLoadingTask?.destroy();
    this._viewer.destroy();
    this._previewer.destroy();
    this._pageService.destroy();
    if (this._pdfDocument) {
      this._pdfDocument.cleanup();
      this._pdfDocument.destroy();
    }  
    this._annotator?.destroy();
    this._docData?.destroy();  

    this._contextMenu?.destroy();
    this._mainContainerRObserver?.disconnect();
    this._shadowRoot.innerHTML = "";
  }
  
  async openPdfAsync(src: string | Blob | Uint8Array): Promise<void> {
    let data: Uint8Array;
    let doc: PDFDocumentProxy;

    // get the plain pdf data as a byte array
    try {
      if (src instanceof Uint8Array) {
        data = src;
      } else {
        let blob: Blob;  
        if (typeof src === "string") {
          const res = await fetch(src);
          blob = await res.blob();
        } else {
          blob = src;
        }  
        const buffer = await blob.arrayBuffer();
        data = new Uint8Array(buffer);
      }
    } catch (e) {
      throw new Error(`Cannot load file data: ${e.message}`);
    }

    // create DocumentData
    const docData = new DocumentData(data, this._userName);
    let password: string;
    while (true) {      
      const authenticated = docData.tryAuthenticate(password);
      if (!authenticated) {        
        password = await this.showPasswordDialogAsync();
        if (password === null) {          
          throw new Error("File loading cancelled: authentication aborted");
        }
        continue;
      }
      break;
    }

    // get the pdf data with the supported annotations cut out
    data = docData.getDataWithoutSupportedAnnotations();

    // try open the data with PDF.js
    try {
      if (this._pdfLoadingTask) {
        await this.closePdfAsync();
        return this.openPdfAsync(data);
      }
  
      this._pdfLoadingTask = getDocument({data, password});
      this._pdfLoadingTask.onProgress = this.onPdfLoadingProgress;
      doc = await this._pdfLoadingTask.promise;    
      this._pdfLoadingTask = null;
    } catch (e) {
      throw new Error(`Cannot open PDF: ${e.message}`);
    }

    // update viewer state
    this._pdfDocument = doc;
    this._docData = docData;
    this.setAnnotationMode("select");
    await this.refreshPagesAsync();

    this._mainContainer.classList.remove("disabled");
  }

  async closePdfAsync(): Promise<void> {
    // destroy a running loading task if present
    if (this._pdfLoadingTask) {
      if (!this._pdfLoadingTask.destroyed) {
        await this._pdfLoadingTask.destroy();
      }
      this._pdfLoadingTask = null;
    }

    this._mainContainer.classList.add("disabled");

    // reset viewer state to default
    this.setViewerMode();

    if (this._pdfDocument) {
      this._pdfDocument.destroy();
      this._pdfDocument = null;

      this._annotator?.destroy();
      this._annotator = null;
      
      this._docData?.destroy();
      this._docData = null;
    }
    await this.refreshPagesAsync();
  }
  
  /**
   * import previously exported TsPdf annotations
   * @param dtos annotation data transfer objects
   */
  importAnnotations(dtos: AnnotationDto[]) {
    try {
      this._docData?.appendSerializedAnnotations(dtos);
    } catch (e) {
      console.log(`Error while importing annotations: ${e.message}`);      
    }
  }
  
  /**
   * export TsPdf annotations as data transfer objects
   * @returns 
   */
  exportAnnotations(): AnnotationDto[] {
    const dtos = this._docData?.serializeAnnotations(true);
    return dtos;
  }  
  
  /**
   * import previously exported serialized TsPdf annotations
   * @param json serialized annotation data transfer objects
   */
  importAnnotationsFromJson(json: string) {
    try {
      const dtos: AnnotationDto[] = JSON.parse(json);
      this._docData?.appendSerializedAnnotations(dtos);
    } catch (e) {
      console.log(`Error while importing annotations: ${e.message}`);      
    }
  }
  
  /**
   * export TsPdf annotations as a serialized array of data transfer objects
   * @returns 
   */
  exportAnnotationsToJson(): string {
    const dtos = this._docData?.serializeAnnotations(true);
    return JSON.stringify(dtos);
  }

  /**
   * get the current pdf file with baked TsPdf annotations as Blob
   * @returns 
   */
  getCurrentPdf(): Blob {    
    const data = this._docData?.getDataWithUpdatedAnnotations();
    if (!data?.length) {
      return null;
    }
    const blob = new Blob([data], {
      type: "application/pdf",
    });
    return blob;
  }
  //#endregion


  //#region GUI initialization methods
  private initMainContainerEventHandlers() { 
    const mcResizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {    
      const {width} = this._mainContainer.getBoundingClientRect();
      if (width < 721) {      
        this._mainContainer.classList.add("mobile");
      } else {      
        this._mainContainer.classList.remove("mobile");
      }
      this._contextMenu.hide();
    });
    mcResizeObserver.observe(this._mainContainer);
    this._mainContainerRObserver = mcResizeObserver;
    
    this._mainContainer.addEventListener("contextmenu", (e: MouseEvent) => {
      if (this._contextMenu.enabled) {
        e.preventDefault();
        this._contextMenu.show(new Vec2(e.clientX, e.clientY), this._mainContainer);
      }
    });
    this._mainContainer.addEventListener("pointermove", this.onMainContainerPointerMove);
  }
  
  /**add event listemers to interface general buttons */
  private initViewControls() {
    const paginatorInput = this._shadowRoot.getElementById("paginator-input") as HTMLInputElement;
    paginatorInput.addEventListener("input", this.onPaginatorInput);
    paginatorInput.addEventListener("change", this.onPaginatorChange);    
    this._shadowRoot.querySelector("#paginator-prev")
      .addEventListener("click", this.onPaginatorPrevClick);
    this._shadowRoot.querySelector("#paginator-next")
      .addEventListener("click", this.onPaginatorNextClick);

    this._shadowRoot.querySelector("#zoom-out")
      .addEventListener("click", this.onZoomOutClick);
    this._shadowRoot.querySelector("#zoom-in")
      .addEventListener("click", this.onZoomInClick);
    this._shadowRoot.querySelector("#zoom-fit-viewer")
      .addEventListener("click", this.onZoomFitViewerClick);
    this._shadowRoot.querySelector("#zoom-fit-page")
      .addEventListener("click", this.onZoomFitPageClick);

    this._shadowRoot.querySelector("#toggle-previewer")
      .addEventListener("click", this.onPreviewerToggleClick);  
  }

  private initFileButtons(fileButtons: FileButtons[]) {
    const openButton = this._shadowRoot.querySelector("#button-open-file");
    const saveButton = this._shadowRoot.querySelector("#button-save-file");
    const closeButton = this._shadowRoot.querySelector("#button-close-file");

    if (fileButtons.includes("open")) {
      this._fileInput = this._shadowRoot.getElementById("open-file-input") as HTMLInputElement;
      this._fileInput.addEventListener("change", this.onFileInput);
      openButton.addEventListener("click", this._fileOpenAction || this.onOpenFileButtonClick);
    } else {
      openButton.remove();
    }

    if (fileButtons.includes("save")) {
      saveButton.addEventListener("click", this._fileSaveAction || this.onSaveFileButtonClick);
    } else {
      saveButton.remove();
    }
    
    if (fileButtons.includes("close")) {
      closeButton.addEventListener("click", this._fileCloseAction || this.onCloseFileButtonClick);
    } else {
      closeButton.remove();
    }
  }

  //#region default file buttons actions
  private onFileInput = () => {
    const files = this._fileInput.files;    
    if (files.length === 0) {
      return;
    }

    this.openPdfAsync(files[0]);    

    this._fileInput.value = null;
  };

  private onOpenFileButtonClick = () => {    
    this._shadowRoot.getElementById("open-file-input").click();
  };

  private onSaveFileButtonClick = () => {
    const blob = this.getCurrentPdf();
    if (!blob) {
      return;
    }

    // DEBUG
    // this.openPdfAsync(blob);

    TsPdfViewer.downloadFile(blob, `file_${new Date().toISOString()}.pdf`);
  };
  
  private onCloseFileButtonClick = () => {
    this.closePdfAsync();
  };
  //#endregion

  private initModeSwitchButtons() {
    this._shadowRoot.querySelector("#button-mode-text")
      .addEventListener("click", this.onTextModeButtonClick);
    this._shadowRoot.querySelector("#button-mode-hand")
      .addEventListener("click", this.onHandModeButtonClick);
    this._shadowRoot.querySelector("#button-mode-annotation")
      .addEventListener("click", this.onAnnotationModeButtonClick);
    this.setViewerMode();    
  }

  private initAnnotationButtons() {
    // mode buttons
    this._shadowRoot.querySelector("#button-annotation-mode-select")
      .addEventListener("click", this.onAnnotationSelectModeButtonClick);
    this._shadowRoot.querySelector("#button-annotation-mode-stamp")
      .addEventListener("click", this.onAnnotationStampModeButtonClick);
    this._shadowRoot.querySelector("#button-annotation-mode-pen")
      .addEventListener("click", this.onAnnotationPenModeButtonClick);
    this._shadowRoot.querySelector("#button-annotation-mode-geometric")
      .addEventListener("click", this.onAnnotationGeometricModeButtonClick); 

    // select buttons
    this._shadowRoot.querySelector("#button-annotation-delete")
      .addEventListener("click", this.onAnnotationDeleteButtonClick);     

    // pen buttons
    this._shadowRoot.querySelector("#button-annotation-pen-undo")
      .addEventListener("click", () => {
        if (this._annotator instanceof PenAnnotator) {
          this._annotator.undoPath();
        }
      });
    this._shadowRoot.querySelector("#button-annotation-pen-clear")
      .addEventListener("click", () => {
        if (this._annotator instanceof PenAnnotator) {
          this._annotator.clearPaths();
        }
      });
    this._shadowRoot.querySelector("#button-annotation-pen-save")
      .addEventListener("click", () => {
        if (this._annotator instanceof PenAnnotator) {
          this._annotator.savePathsAsInkAnnotation();
        }
      });
  }
  //#endregion


  //#region viewer modes
  private setViewerMode(mode?: ViewerMode) {
    mode = mode || "text"; // 'text' is the default mode

    // return if mode not changed
    if (!mode || mode === this._viewer.mode) {
      return;
    }

    // disable previous viewer mode
    this.disableCurrentViewerMode();

    switch (mode) {
      case "text":
        this._mainContainer.classList.add("mode-text");
        this._shadowRoot.querySelector("#button-mode-text").classList.add("on");
        break;
      case "hand":
        this._mainContainer.classList.add("mode-hand");
        this._shadowRoot.querySelector("#button-mode-hand").classList.add("on");
        break;
      case "annotation":
        this._mainContainer.classList.add("mode-annotation");
        this._shadowRoot.querySelector("#button-mode-annotation").classList.add("on");
        break;
      default:
        // Execution should not come here
        throw new Error(`Invalid viewer mode: ${mode}`);
    }
    this._viewer.mode = mode;
  }

  private disableCurrentViewerMode() { 
    this._contextMenu.clear();
    this._contextMenu.enabled = false;
    
    switch (this._viewer.mode) {
      case "text":
        this._mainContainer.classList.remove("mode-text");
        this._shadowRoot.querySelector("#button-mode-text").classList.remove("on");
        break;
      case "hand":
        this._mainContainer.classList.remove("mode-hand");
        this._shadowRoot.querySelector("#button-mode-hand").classList.remove("on");
        break;
      case "annotation":
        this._mainContainer.classList.remove("mode-annotation");
        this._shadowRoot.querySelector("#button-mode-annotation").classList.remove("on");
        this.setAnnotationMode("select");
        break;
      default:
        // mode hasn't been set yet. do nothing
        break;
    }
  }  
  
  private onTextModeButtonClick = () => {
    this.setViewerMode("text");
  };

  private onHandModeButtonClick = () => {
    this.setViewerMode("hand");
  };
  
  private onAnnotationModeButtonClick = () => {
    this.setViewerMode("annotation");
  };
  //#endregion

  //#region viewer zoom
  private onZoomOutClick = () => {
    this._viewer.zoomOut();
  };

  private onZoomInClick = () => {
    this._viewer.zoomIn();
  };
  
  private onZoomFitViewerClick = () => {
    this._viewer.zoomFitViewer();
  };
  
  private onZoomFitPageClick = () => {
    this._viewer.zoomFitPage();
  };
  //#endregion


  //#region paginator
  private onPaginatorInput = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      event.target.value = event.target.value.replace(/[^\d]+/g, "");
    }
  };
  
  private onPaginatorChange = (event: Event) => {
    if (event.target instanceof HTMLInputElement) {
      const pageNumber = Math.max(Math.min(+event.target.value, this._pdfDocument.numPages), 1);
      if (pageNumber + "" !== event.target.value) {        
        event.target.value = pageNumber + "";
      }
      this._pageService.requestSetCurrentPageIndex(pageNumber - 1);
    }
  };
  
  private onPaginatorPrevClick = () => {
    const pageIndex = clamp(this._pageService.currentPageIndex - 1, 0, this._pageService.length - 1);
    this._pageService.requestSetCurrentPageIndex(pageIndex);
  };

  private onPaginatorNextClick = () => {
    const pageIndex = clamp(this._pageService.currentPageIndex + 1, 0, this._pageService.length - 1);
    this._pageService.requestSetCurrentPageIndex(pageIndex);
  };
  
  private onCurrentPagesChanged = (event: CurrentPageChangeEvent) => {
    const {newIndex} = event.detail;
    (<HTMLInputElement>this._shadowRoot.getElementById("paginator-input")).value = newIndex + 1 + "";
  };
  //#endregion
  

  //#region annotations  
  private onPagesRendered = (event: PagesRenderedEvent) => {    
    this._annotator?.updateDimensions(this._pageService.renderedPages, this._viewer.scale);
  };
  
  private onPenPathsChanged = (event: PathChangeEvent) => {
    if (event.detail.pathCount) {
      this._mainContainer.classList.add("pen-path-present");
    } else {
      this._mainContainer.classList.remove("pen-path-present");
    }
  };

  private onAnnotationDeleteButtonClick = () => {
    this._docData?.deleteSelectedAnnotation();
  };

  private setAnnotationMode(mode: AnnotatorMode) {
    // return if mode is same
    if (!mode || mode === this._annotatorMode) {
      return;
    }

    // disable previous mode
    this._contextMenu.clear();
    this._contextMenu.enabled = false;
    this._annotator?.destroy();

    switch (this._annotatorMode) {
      case "select":
        this._shadowRoot.querySelector("#button-annotation-mode-select").classList.remove("on");
        this._docData.setSelectedAnnotation(null);
        break;
      case "stamp":
        this._shadowRoot.querySelector("#button-annotation-mode-stamp").classList.remove("on");
        break;
      case "pen":
        this._shadowRoot.querySelector("#button-annotation-mode-pen").classList.remove("on");
        break;
      case "geometric":
        this._shadowRoot.querySelector("#button-annotation-mode-geometric").classList.remove("on");
        break;
      default:
        // mode hasn't been set. do nothing
        break;
    }

    this._annotatorMode = mode;
    switch (mode) {
      case "select":
        this._shadowRoot.querySelector("#button-annotation-mode-select").classList.add("on");
        break;
      case "stamp":
        this._shadowRoot.querySelector("#button-annotation-mode-stamp").classList.add("on");
        this._annotator = new StampAnnotator(this._docData, this._viewer.container);
        this.initStampAnnotatorContextMenu();
        break;
      case "pen":
        this._shadowRoot.querySelector("#button-annotation-mode-pen").classList.add("on");
        this._annotator = new PenAnnotator(this._docData, this._viewer.container);
        this.initPenAnnotatorContextMenu();
        break;
      case "geometric":
        this._shadowRoot.querySelector("#button-annotation-mode-geometric").classList.add("on");
        // TODO: init one of the geometric annotators
        this.initGeometricAnnotatorContextMenu();
        break;
      default:
        // Execution should not come here
        throw new Error(`Invalid annotation mode: ${mode}`);
    }
    this._annotator?.updateDimensions(this._pageService.renderedPages, this._viewer.scale);
  }

  private onAnnotationSelectModeButtonClick = () => {
    this.setAnnotationMode("select");
  };

  private onAnnotationStampModeButtonClick = () => {
    this.setAnnotationMode("stamp");
  };

  private onAnnotationPenModeButtonClick = () => {
    this.setAnnotationMode("pen");
  };
  
  private onAnnotationGeometricModeButtonClick = () => {
    this.setAnnotationMode("geometric");
  };

  private onAnnotationChange = (e: AnnotEvent) => {
    if (!e.detail) {
      return;
    }

    const annotations = e.detail.annotations;
    switch(e.detail.type) {
      case "select":      
        if (annotations?.length) {
          this._mainContainer.classList.add("annotation-selected");
        } else {
          this._mainContainer.classList.remove("annotation-selected");
        }
        break;
      case "add":
        break;
      case "edit":
        break;
      case "delete":
        break;
    }
    
    // execute change callback if present
    if (this._annotChangeCallback) {
      this._annotChangeCallback(e.detail);
    }

    // rerender changed pages
    if (annotations?.length) {
      const pageIdSet = new Set<number>(annotations.map(x => x.pageId));
      this._pageService.renderSpecifiedPages(pageIdSet);
    }
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
        this._annotator = new StampAnnotator(this._docData, this._viewer.container, x.type);
        this._annotator.updateDimensions(this._pageService.renderedPages, this._viewer.scale);
      });
      const stampName = document.createElement("div");
      stampName.innerHTML = x.name;
      item.append(stampName);
      contextMenuContent.append(item);
    });

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
        this._annotator = new PenAnnotator(this._docData, this._viewer.container, {
          color:x,
        });
        this._annotator.updateDimensions(this._pageService.renderedPages, this._viewer.scale);
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
      this._annotator = new PenAnnotator(this._docData, this._viewer.container, {
        strokeWidth: slider.valueAsNumber,
      });
      this._annotator.updateDimensions(this._pageService.renderedPages, this._viewer.scale);
    });
    contextMenuWidthSlider.append(slider);

    // set the context menu content
    this._contextMenu.content = [contextMenuColorPicker, contextMenuWidthSlider];
    // enable the context menu
    this._contextMenu.enabled = true;
  }

  private initGeometricAnnotatorContextMenu() {
    // TODO: add submode selection
    const contextMenuSubmodePicker = document.createElement("div");
    // init a geometry color picker
    const contextMenuColorPicker = document.createElement("div");
    contextMenuColorPicker.classList.add("context-menu-content", "row");
    this._annotationColors.forEach(x => {          
      const item = document.createElement("div");
      item.classList.add("panel-button");
      item.addEventListener("click", () => {
        this._contextMenu.hide();
        this._annotator?.destroy();
        this._annotator = new PenAnnotator(this._docData, this._viewer.container, { // FIX!
          color:x,
        });
        this._annotator.updateDimensions(this._pageService.renderedPages, this._viewer.scale);
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
      this._annotator = new PenAnnotator(this._docData, this._viewer.container, { // TODO: FIX!
        strokeWidth: slider.valueAsNumber,
      });
      this._annotator.updateDimensions(this._pageService.renderedPages, this._viewer.scale);
    });
    contextMenuWidthSlider.append(slider);
    
    // set the context menu content
    this._contextMenu.content = [contextMenuSubmodePicker, contextMenuColorPicker, contextMenuWidthSlider];
    // enable the context menu
    this._contextMenu.enabled = true;
  }
  //#endregion


  //#region misc
  private onPdfLoadingProgress = (progressData: { loaded: number; total: number }) => {
    // TODO: implement progress display
  };

  /**
   * refresh the loaded pdf file page views and previews
   * @returns 
   */
  private async refreshPagesAsync(): Promise<void> {
    const docPagesNumber = this._pdfDocument?.numPages || 0;
    this._shadowRoot.getElementById("paginator-total").innerHTML = docPagesNumber + "";
    if (!docPagesNumber) {
      return;
    }

    const pages: PageView[] = [];
    for (let i = 0; i < docPagesNumber; i++) {    
      const pageProxy = await this._pdfDocument.getPage(i + 1);
      const page = new PageView(pageProxy, this._docData, this._previewer.canvasWidth);
      pages.push(page);
    } 

    this._pageService.pages = pages;
  }

  private onPreviewerToggleClick = () => {
    if (this._previewer.hidden) {
      this._mainContainer.classList.remove("hide-previewer");
      this._shadowRoot.querySelector("div#toggle-previewer").classList.add("on");
      this._previewer.show();
    } else {      
      this._mainContainer.classList.add("hide-previewer");
      this._shadowRoot.querySelector("div#toggle-previewer").classList.remove("on");
      this._previewer.hide();
    }
  };

  private onMainContainerPointerMove = (event: PointerEvent) => {
    const {clientX, clientY} = event;
    const {x: rectX, y: rectY, width, height} = this._mainContainer.getBoundingClientRect();

    const l = clientX - rectX;
    const t = clientY - rectY;
    const r = width - l;
    const b = height - t;

    if (Math.min(l, r, t, b) > 150) {
      // hide panels if pointer is far from the container edges
      if (!this._panelsHidden && !this._timers.hidePanels) {
        this._timers.hidePanels = setTimeout(() => {
          this._mainContainer.classList.add("hide-panels");
          this._panelsHidden = true;
          this._timers.hidePanels = null;
        }, 5000);
      }      
    } else {
      // show panels otherwise
      if (this._timers.hidePanels) {
        clearTimeout(this._timers.hidePanels);
        this._timers.hidePanels = null;
      }
      if (this._panelsHidden) {        
        this._mainContainer.classList.remove("hide-panels");
        this._panelsHidden = false;
      }
    }
  };

  private async showPasswordDialogAsync(): Promise<string> {

    const passwordPromise = new Promise<string>((resolve, reject) => {

      const dialogContainer = document.createElement("div");
      dialogContainer.id = "password-dialog";
      dialogContainer.innerHTML = passwordDialogHtml;
      this._mainContainer.append(dialogContainer);

      let value = "";      
      const input = this._shadowRoot.getElementById("password-input") as HTMLInputElement;
      input.placeholder = "Enter password...";
      input.addEventListener("change", () => value = input.value);

      const ok = () => {
        dialogContainer.remove();
        resolve(value);
      };
      const cancel = () => {
        dialogContainer.remove();
        resolve(null);
      };

      dialogContainer.addEventListener("click", (e: Event) => {
        if (e.target === dialogContainer) {
          cancel();
        }
      });
      
      this._shadowRoot.getElementById("password-ok").addEventListener("click", ok);
      this._shadowRoot.getElementById("password-cancel").addEventListener("click", cancel);
    });

    return passwordPromise;
  }
  //#endregion
}
