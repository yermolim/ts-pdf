/* eslint-disable @typescript-eslint/no-use-before-define */
import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import { PDFDocumentLoadingTask, PDFDocumentProxy } from "pdfjs-dist/types/display/api";

import { clamp } from "mathador";

import { mainHtml, passwordDialogHtml } from "./assets/index.html";
import { styles } from "./assets/styles.html";

import { downloadFile, htmlToElements } from "./common/dom";
import { getSelectionInfosFromSelection } from "./common/text-selection";
import { CustomStampCreationInfo } from "./drawing/stamps";

import { ElementEventService } from "./services/element-event-service";
import { PageService, currentPageChangeEvent, 
  CurrentPageChangeEvent } from "./services/page-service";
import { DocumentService, annotChangeEvent, AnnotEvent, 
  AnnotEventDetail, AnnotationDto, DocServiceStateChangeEvent, docServiceStateChangeEvent } from "./services/document-service";
import { customStampEvent, CustomStampEvent, CustomStampEventDetail, 
  CustomStampService } from "./services/custom-stamp-service";
import { AnnotationService } from "./services/annotation-service";

import { Loader } from "./components/loader";
import { Viewer, ViewerMode, viewerModes } from "./components/viewer";
import { Previewer } from "./components/previewer";
import { PageView } from "./components/pages/page-view";

import { annotatorDataChangeEvent, AnnotatorDataChangeEvent, 
  annotatorTypes, 
  TextSelectionChangeEvent, 
  textSelectionChangeEvent} from "./annotator/annotator";

type AnnotatorMode = "select" | "stamp" | "pen" | "geometric" | "text";

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
  /**
   * action to execute instead of the default file open action
   * f.e. to open a custom dialog that allows the user to select a file from the database
   */
  fileOpenAction?: () => void;
  /**
   * action to execute instead of the default file download action
   * f.e. to save the file bytes to the database instead of downloading it
   */
  fileSaveAction?: () => void;
  /**
   * action to execute instead of the default file close action
   * f.e. to discard all the changes made to the file
   */
  fileCloseAction?: () => void;

  /**
   * action to execute on annotation change event 
   * f.e. to save the changes to the database
   */
  annotChangeCallback?: (detail: AnnotEventDetail) => void;

  /**
   * array of objects describing custom stamps
   */
  customStamps?: CustomStampCreationInfo[];

  /**
   * action to execute on custom stamp change event.
   * fires when a new custom stamp is added or an old one is deleted.
   * can be used for managing custom stamp library
   */
  customStampChangeCallback?: (detail: CustomStampEventDetail) => void;
  
  /**
   * number of pages that should be prerendered outside view 
   * higher values can reduce performance and will increase memory use
   */
  visibleAdjPages?: number;
  /**page preview canvas width in px */
  previewWidth?: number;

  minScale?: number;
  maxScale?: number;
}

export {AnnotationDto, AnnotEvent, AnnotEventDetail, 
  CustomStampEvent, CustomStampEventDetail};

export class TsPdfViewer {
  //#region private fields
  private readonly _userName: string;

  private readonly _outerContainer: HTMLDivElement;
  private readonly _shadowRoot: ShadowRoot;
  private readonly _mainContainer: HTMLDivElement;
  
  private readonly _eventService: ElementEventService;
  private readonly _pageService: PageService;
  private readonly _customStampsService: CustomStampService;

  private readonly _loader: Loader;
  private readonly _viewer: Viewer;
  private readonly _previewer: Previewer;  

  private _fileName: string; 

  private _docService: DocumentService;  
  private _annotationService: AnnotationService;

  private _fileOpenAction: () => void;
  private _fileSaveAction: () => void;
  private _fileCloseAction: () => void;
  private _annotChangeCallback: (detail: AnnotEventDetail) => void;
  private _customStampChangeCallback: (detail: CustomStampEventDetail) => void;

  private _mainContainerRObserver: ResizeObserver;
  private _panelsHidden: boolean;

  private _fileInput: HTMLInputElement;
  
  private _pdfLoadingTask: PDFDocumentLoadingTask;
  private _pdfDocument: PDFDocumentProxy;  
  
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
    this._customStampChangeCallback = options.customStampChangeCallback;
    
    const visibleAdjPages = options.visibleAdjPages || 0;
    const previewWidth = options.previewWidth || 100;
    const minScale = options.minScale || 0.25;
    const maxScale = options.maxScale || 4;

    this._shadowRoot = this._outerContainer.attachShadow({mode: "open"});
    this._shadowRoot.innerHTML = styles + mainHtml;    
    this._mainContainer = this._shadowRoot.querySelector("div#main-container") as HTMLDivElement;

    this._eventService = new ElementEventService(this._mainContainer);
    this._pageService = new PageService(this._eventService,
      {visibleAdjPages: visibleAdjPages});      

    this._customStampsService = new CustomStampService(this._mainContainer, this._eventService);
    this._customStampsService.importCustomStamps(options.customStamps);

    this._loader = new Loader();
    this._previewer = new Previewer(this._pageService, this._shadowRoot.querySelector("#previewer"), 
      {canvasWidth: previewWidth});
    this._viewer = new Viewer(this._pageService, this._shadowRoot.querySelector("#viewer"), 
      {minScale: minScale, maxScale: maxScale}); 
    this._viewer.container.addEventListener("contextmenu", e => e.preventDefault());

    this.initMainContainerEventHandlers();
    this.initViewControls();
    this.initFileButtons(options.fileButtons || []);
    this.initModeSwitchButtons();
    this.initAnnotationButtons();

    this._eventService.addListener(annotChangeEvent, this.onAnnotationChange);
    this._eventService.addListener(currentPageChangeEvent, this.onCurrentPagesChanged);
    this._eventService.addListener(annotatorDataChangeEvent, this.onAnnotatorDataChanged);
    this._eventService.addListener(customStampEvent, this.onCustomStampChanged);
    this._eventService.addListener(docServiceStateChangeEvent, this.onDocServiceStateChange);
    
    document.addEventListener("selectionchange", this.onTextSelectionChange); 
  }

  //#region public API
  /**free resources to let GC clean them to avoid memory leak */
  destroy() {
    this._annotChangeCallback = null;

    this._pdfLoadingTask?.destroy();    

    this._annotationService?.destroy();

    this._viewer.destroy();
    this._previewer.destroy();
    this._pageService.destroy();
    
    if (this._pdfDocument) {
      this._pdfDocument.cleanup();
      this._pdfDocument.destroy();
    }  
    this._docService?.destroy();  
    
    this._customStampsService.destroy();
    this._eventService.destroy();

    this._mainContainerRObserver?.disconnect();
    this._shadowRoot.innerHTML = "";
    
    document.removeEventListener("selectionchange", this.onTextSelectionChange); 
  }
  
  async openPdfAsync(src: string | Blob | Uint8Array, 
    fileName?: string): Promise<void> {
    this._loader.show(this._mainContainer);
    
    // close the currently opened file if present
    await this.closePdfAsync();

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
      this._loader.hide();
      throw new Error(`Cannot load file data: ${e.message}`);
    }

    // create DocumentData
    const docService = new DocumentService(this._eventService, data, this._userName);
    let password: string;
    while (true) {
      const authenticated = docService.tryAuthenticate(password);
      if (!authenticated) {
        password = await this.showPasswordDialogAsync();
        if (password === null) {
          this._loader.hide();
          throw new Error("File loading cancelled: authentication aborted");
        }
        continue;
      }
      break;
    }

    // try open the data with PDF.js
    try {
      if (this._pdfLoadingTask) {
        await this.closePdfAsync();
        return this.openPdfAsync(data);
      }

      // remove supported annotations from the data before supplying it to PDF.js
      const dataWithoutAnnotations = 
        await docService.getDataWithoutSupportedAnnotationsAsync();

      this._pdfLoadingTask = getDocument({
        // get the pdf data with the supported annotations cut out
        data: dataWithoutAnnotations, 
        password,
      });
      this._pdfLoadingTask.onProgress = this.onPdfLoadingProgress;
      doc = await this._pdfLoadingTask.promise;    
      this._pdfLoadingTask = null;
    } catch (e) {
      this._loader.hide();
      throw new Error(`Cannot open PDF: ${e.message}`);
    }

    // update viewer state
    this._pdfDocument = doc;
    this._docService = docService;
    this._fileName = fileName;

    // load pages from the document
    await this.refreshPagesAsync();

    // create an annotation builder and set its mode to 'select'
    this._annotationService = new AnnotationService(this._docService, 
      this._pageService, this._customStampsService, this._viewer);
    this.setAnnotationMode("select");

    this._mainContainer.classList.remove("disabled");
    
    this._loader.hide();
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
    // remove unneeded classes from the main container
    this._mainContainer.classList.remove("annotation-focused");
    this._mainContainer.classList.remove("annotation-selected");

    // reset viewer state to default
    this.setViewerMode();

    if (this._pdfDocument) {
      this._pdfDocument.destroy();
      this._pdfDocument = null;

      this._annotationService?.destroy();
      
      this._docService?.destroy();
      this._docService = null;

      this._fileName = null;
    }

    await this.refreshPagesAsync();
  }
  
  /**
   * import previously exported TsPdf annotations
   * @param dtos annotation data transfer objects
   */
  async importAnnotationsAsync(dtos: AnnotationDto[]) {
    try {
      await this._docService?.appendSerializedAnnotationsAsync(dtos);
    } catch (e) {
      console.log(`Error while importing annotations: ${e.message}`);      
    }
  }
  
  /**
   * import previously exported serialized TsPdf annotations
   * @param json serialized annotation data transfer objects
   */
  async importAnnotationsFromJsonAsync(json: string) {
    try {
      const dtos: AnnotationDto[] = JSON.parse(json);
      await this._docService?.appendSerializedAnnotationsAsync(dtos);
    } catch (e) {
      console.log(`Error while importing annotations: ${e.message}`);      
    }
  }
  
  /**
   * export TsPdf annotations as data transfer objects
   * @returns 
   */
  async exportAnnotationsAsync(): Promise<AnnotationDto[]> {
    const dtos = await this._docService?.serializeAnnotationsAsync(true);
    return dtos;
  }  
  
  /**
   * export TsPdf annotations as a serialized array of data transfer objects
   * @returns 
   */
  async exportAnnotationsToJsonAsync(): Promise<string> {
    const dtos = await this._docService?.serializeAnnotationsAsync(true);
    return JSON.stringify(dtos);
  }

  importCustomStamps(customStamps: CustomStampCreationInfo[]) {  
    try {
      this._customStampsService.importCustomStamps(customStamps);
    } catch (e) {
      console.log(`Error while importing custom stamps: ${e.message}`);      
    }   
  }
  
  importCustomStampsFromJson(json: string) { 
    try {
      const customStamps: CustomStampCreationInfo[] = JSON.parse(json); 
      this._customStampsService.importCustomStamps(customStamps);
    } catch (e) {
      console.log(`Error while importing custom stamps: ${e.message}`);      
    } 
  }
  
  /**
   * export TsPdf custom stamps
   * @returns 
   */
  exportCustomStamps(): CustomStampCreationInfo[] {
    const customStamps = this._customStampsService.getCustomStamps();
    return customStamps;
  }  
  
  /**
   * export TsPdf custom stamps as a serialized array of the corresponding objects
   * @returns 
   */
  exportCustomStampsToJson(): string {
    const customStamps = this._customStampsService.getCustomStamps();
    return JSON.stringify(customStamps);
  }

  /**
   * get the current pdf file with baked TsPdf annotations as Blob
   * @returns 
   */
  async getCurrentPdfAsync(): Promise<Blob> {    
    const data = await this._docService?.getDataWithUpdatedAnnotationsAsync();
    if (!data?.length) {
      return null;
    }
    const blob = new Blob([data], {
      type: "application/pdf",
    });
    return blob;
  }
  //#endregion

  //#region text selection
  protected onTextSelectionChange = () => {
    const selection = this._shadowRoot.getSelection();
    if (!selection.rangeCount) {
      return;
    }
    
    if (this._eventService.hasListenersForKey(textSelectionChangeEvent)) {
      // get selection text and coordinates
      const selectionInfos = getSelectionInfosFromSelection(selection);
      this._eventService.dispatchEvent(new TextSelectionChangeEvent({selectionInfos}));
    }
  };
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
      if (width < 400) {        
        this._mainContainer.classList.add("compact");
      } else {
        this._mainContainer.classList.remove("compact");
      }
    });
    mcResizeObserver.observe(this._mainContainer);
    this._mainContainerRObserver = mcResizeObserver;
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

    this._shadowRoot.querySelector("#rotate-clockwise")
      .addEventListener("click", this.onRotateClockwiseClick);
    this._shadowRoot.querySelector("#rotate-counter-clockwise")
      .addEventListener("click", this.onRotateCounterClockwiseClick);

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
      saveButton.addEventListener("click", this._fileSaveAction || this.onSaveFileButtonClickAsync);
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

    this.openPdfAsync(files[0], files[0].name);    

    this._fileInput.value = null;
  };

  private onOpenFileButtonClick = () => {    
    this._shadowRoot.getElementById("open-file-input").click();
  };

  private onSaveFileButtonClickAsync = async () => {
    const blob = await this.getCurrentPdfAsync();
    if (!blob) {
      return;
    }

    // DEBUG
    // this.openPdfAsync(blob);

    downloadFile(blob, this._fileName || `file_${new Date().toISOString()}.pdf`);
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
    this._shadowRoot.querySelector("#button-annotation-mode-text")
      .addEventListener("click", this.onAnnotationTextModeButtonClick); 

    // select buttons
    this._shadowRoot.querySelector("#button-annotation-edit-text")
      .addEventListener("click", this.onAnnotationEditTextButtonClick);   
    this._shadowRoot.querySelector("#button-annotation-delete")
      .addEventListener("click", this.onAnnotationDeleteButtonClick); 
      
    // stamp buttons
    this._shadowRoot.querySelector("#button-annotation-stamp-undo")
      .addEventListener("click", this.annotatorUndo);
    this._shadowRoot.querySelector("#button-annotation-stamp-clear")
      .addEventListener("click", this.annotatorClear);    

    // pen buttons
    this._shadowRoot.querySelector("#button-annotation-pen-undo")
      .addEventListener("click", this.annotatorUndo);
    this._shadowRoot.querySelector("#button-annotation-pen-clear")
      .addEventListener("click", this.annotatorClear);
    this._shadowRoot.querySelector("#button-annotation-pen-save")
      .addEventListener("click", this.annotatorSave);
      
    // geometric buttons
    this._shadowRoot.querySelector("#button-annotation-geometric-undo")
      .addEventListener("click", this.annotatorUndo);
    this._shadowRoot.querySelector("#button-annotation-geometric-clear")
      .addEventListener("click", this.annotatorClear);
    this._shadowRoot.querySelector("#button-annotation-geometric-save")
      .addEventListener("click", this.annotatorSave);
      
    // text buttons
    this._shadowRoot.querySelector("#button-annotation-text-undo")
      .addEventListener("click", this.annotatorUndo);
    this._shadowRoot.querySelector("#button-annotation-text-clear")
      .addEventListener("click", this.annotatorClear);
    this._shadowRoot.querySelector("#button-annotation-text-save")
      .addEventListener("click", this.annotatorSave);

    this._shadowRoot.querySelector("#button-command-undo")
      .addEventListener("click", this.docServiceUndo);      
  }
  //#endregion


  //#region viewer modes
  private setViewerMode(mode?: ViewerMode) {
    mode = mode || "text"; // 'text' is the default mode

    // disable previous viewer mode
    viewerModes.forEach(x => {
      this._mainContainer.classList.remove("mode-" + x);
      this._shadowRoot.querySelector("#button-mode-" + x).classList.remove("on");
    });
    this.setAnnotationMode("select");

    this._mainContainer.classList.add("mode-" + mode);
    this._shadowRoot.querySelector("#button-mode-" + mode).classList.add("on");
    this._viewer.mode = mode;
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


  //#region page rotation
  private onRotateCounterClockwiseClick = () => {
    this._pageService.getCurrentPage().rotateCounterClockwise();
    this.setAnnotationMode(this._annotationService.mode);
  };
  
  private onRotateClockwiseClick = () => {
    this._pageService.getCurrentPage().rotateCounterClockwise();
    this.setAnnotationMode(this._annotationService.mode);
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
  private annotatorUndo = () => {
    this._annotationService.annotator?.undo();
  };

  private annotatorClear = () => {
    this._annotationService.annotator?.clear();
  };
  
  private annotatorSave = () => {
    this._annotationService.annotator?.saveAnnotationAsync();
  };
  
  private onCustomStampChanged = (e: CustomStampEvent) => {
    this.setAnnotationMode("stamp");

    // execute change callback if present
    if (this._customStampChangeCallback) {
      this._customStampChangeCallback(e.detail);
    }
  };

  private onAnnotationChange = (e: AnnotEvent) => {
    if (!e.detail) {
      return;
    }

    const annotations = e.detail.annotations;
    switch(e.detail.type) {
      case "focus":      
        if (annotations?.length) {
          this._mainContainer.classList.add("annotation-focused");
        } else {
          this._mainContainer.classList.remove("annotation-focused");
        }
        const annotation = annotations[0];
        if (annotation) {
          (<HTMLParagraphElement>this._shadowRoot.querySelector("#focused-annotation-author"))
            .textContent = annotation.author || "";
          (<HTMLParagraphElement>this._shadowRoot.querySelector("#focused-annotation-date"))
            .textContent = new Date(annotation.dateModified || annotation.dateCreated).toDateString();
          (<HTMLParagraphElement>this._shadowRoot.querySelector("#focused-annotation-text"))
            .textContent = annotation.textContent || "";
        } else {
          (<HTMLParagraphElement>this._shadowRoot.querySelector("#focused-annotation-author"))
            .textContent = "";
          (<HTMLParagraphElement>this._shadowRoot.querySelector("#focused-annotation-date"))
            .textContent = "";
          (<HTMLParagraphElement>this._shadowRoot.querySelector("#focused-annotation-text"))
            .textContent = "";
        }
        break;
      case "select":      
        if (annotations?.length) {
          this._mainContainer.classList.add("annotation-selected");
          this._mainContainer.classList.add("annotation-focused"); // for touch devices
        } else {
          this._mainContainer.classList.remove("annotation-selected");
          this._mainContainer.classList.remove("annotation-focused"); // for touch devices
        }
        break;
      case "add":
      case "delete":
      case "render":
        // rerender affected pages
        if (annotations?.length) {
          const pageIdSet = new Set<number>(annotations.map(x => x.pageId));
          this._pageService.renderSpecifiedPages(pageIdSet);
        }
        break;
      case "edit":
        // there is no need to rerender page on edit 
        // because the annotation render may be still in process.
        // so just wait for the 'render' event
        break;
    }
    
    // execute change callback if present
    if (this._annotChangeCallback) {
      this._annotChangeCallback(e.detail);
    }
  };

  private onAnnotatorDataChanged = (event: AnnotatorDataChangeEvent) => {
    annotatorTypes.forEach(x => {
      this._mainContainer.classList.remove(x + "-annotator-data-saveable");
      this._mainContainer.classList.remove(x + "-annotator-data-undoable");
      this._mainContainer.classList.remove(x + "-annotator-data-clearable");
    });

    if (event.detail.saveable) {
      this._mainContainer.classList.add(event.detail.annotatorType + "-annotator-data-saveable");
    }
    if (event.detail.undoable) {
      this._mainContainer.classList.add(event.detail.annotatorType + "-annotator-data-undoable");
    }
    if (event.detail.clearable) {
      this._mainContainer.classList.add(event.detail.annotatorType + "-annotator-data-clearable");
    }
  };

  private setAnnotationMode(mode: AnnotatorMode) {
    if (!this._annotationService || !mode) {
      return;
    }

    const prevMode = this._annotationService.mode;
    this._shadowRoot.querySelector(`#button-annotation-mode-${prevMode}`)?.classList.remove("on");
    this._shadowRoot.querySelector(`#button-annotation-mode-${mode}`)?.classList.add("on");

    this._annotationService.mode = mode;
  }
   
  private onAnnotationEditTextButtonClick = async () => {
    const initialText = this._docService?.getSelectedAnnotationTextContent();
    const text = await this._viewer.showTextDialogAsync(initialText);
    if (text === null) {
      return;
    }
    this._docService?.setSelectedAnnotationTextContent(text);
  };

  private onAnnotationDeleteButtonClick = () => {
    this._docService?.removeSelectedAnnotation();
  };

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

  private onAnnotationTextModeButtonClick = () => {
    this.setAnnotationMode("text");
  };
  //#endregion


  //#region misc
  private onPdfLoadingProgress = (progressData: { loaded: number; total: number }) => {
    // TODO: implement progress display
  };

  private docServiceUndo = () => {
    this._docService?.undo();
  };

  private onDocServiceStateChange = (e: DocServiceStateChangeEvent) => {
    if (e.detail.undoableCount) {
      this._mainContainer.classList.add("undoable-commands");
    } else {      
      this._mainContainer.classList.remove("undoable-commands");
    }
  };

  /**
   * refresh the loaded pdf file page views and previews
   * @returns 
   */
  private async refreshPagesAsync(): Promise<void> {
    const docPagesNumber = this._pdfDocument?.numPages || 0;
    this._shadowRoot.getElementById("paginator-total").innerHTML = docPagesNumber + "";

    const pages: PageView[] = [];
    if (docPagesNumber) {
      for (let i = 0; i < docPagesNumber; i++) {    
        const pageProxy = await this._pdfDocument.getPage(i + 1);
        const page = new PageView(this._docService, pageProxy, this._previewer.canvasWidth);
        pages.push(page);
      }
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
          if (!this._pdfDocument) {
            return; // hide panels only if document is open
          }
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

      const dialog = htmlToElements(passwordDialogHtml)[0];
      this._mainContainer.append(dialog);

      let value = "";      
      const input = dialog.querySelector(".password-input") as HTMLInputElement;
      input.placeholder = "Enter password...";
      input.addEventListener("change", () => value = input.value);

      const ok = () => {
        dialog.remove();
        resolve(value);
      };
      const cancel = () => {
        dialog.remove();
        resolve(null);
      };

      dialog.addEventListener("click", (e: Event) => {
        if (e.target === dialog) {
          cancel();
        }
      });
      
      dialog.querySelector(".password-ok").addEventListener("click", ok);
      dialog.querySelector(".password-cancel").addEventListener("click", cancel);
    });

    return passwordPromise;
  }
  //#endregion
}
