import { PDFPageProxy } from "pdfjs-dist/types/src/display/api";

import { EventService } from "ts-viewers-core";

import { DocumentService } from "./document-service";
import { PdfLoaderService } from "./pdf-loader-service";
import { ComparisonService, PdfPageComparisonResult } from "./comparison-service";

export type DocType = "main" | "compared";

//#region custom events
export const docChangeEvent = "tspdf-docchangeevent" as const;

export interface DocChangeEventDetail {
  action: "open" | "close";
  type: DocType;
}

export class DocChangeEvent extends CustomEvent<DocChangeEventDetail> {
  constructor(detail: DocChangeEventDetail) {
    super(docChangeEvent, {detail});
  }
}

declare global {
  interface HTMLElementEventMap {
    [docChangeEvent]: DocChangeEvent;
  }
}
//#endregion

export class DocManagerService {
  private readonly _eventService: EventService;
  private readonly _dummyDiv = document.createElement("div");
  private readonly _docLoaders: {
    [key in DocType]: PdfLoaderService;
  };
  private readonly _comparisonService: ComparisonService;  
  get comparisonService(): ComparisonService {
    return this._comparisonService;
  }

  get docService(): DocumentService {
    return this._docLoaders.main.docService;
  }
  
  get pageCount(): number {
    return this._docLoaders.main.pageCount;
  }
  
  get docLoaded(): boolean {
    return this._docLoaders.main.docLoaded;
  }

  get fileName(): string {
    return this._docLoaders.main.fileName;
  }

  constructor(mainEventService: EventService) {
    if (!mainEventService) {
      throw new Error("Main event service is not defined");
    }
    this._eventService = mainEventService;

    this._docLoaders = {
      main: new PdfLoaderService(mainEventService),
      compared: new PdfLoaderService(new EventService(this._dummyDiv)),
    };
    this._comparisonService = new ComparisonService();
  }

  destroy() {
    this._comparisonService.destroy();
    Object.keys(this._docLoaders).forEach(key => {
      this._docLoaders[key].destroy();
    });
  }
  
  //#region main doc
  async openPdfAsync(type: DocType, src: string | Blob | Uint8Array, 
    fileName: string, userName: string,
    getPasswordAsync: () => Promise<string>,
    onProgress?: (progressData: { loaded: number; total: number }) => void): Promise<void> {

    await this._docLoaders[type].openPdfAsync(src, fileName, userName, getPasswordAsync, onProgress);

    if (type === "main") {
      await this.closePdfAsync("compared");
      this._eventService.dispatchEvent(new DocChangeEvent({action: "open", type: "main"}));
    } else if (type === "compared") {      
      await this.runComparisonAsync();
      this._eventService.dispatchEvent(new DocChangeEvent({action: "open", type: "compared"}));
    }
  }
  
  async closePdfAsync(type: DocType): Promise<void> {
    await this._docLoaders[type].closePdfAsync();
    
    if (type === "main") {
      await this.closePdfAsync("compared");
      this._eventService.dispatchEvent(new DocChangeEvent({action: "close", type: "main"}));
    } else if (type === "compared") {
      await this._comparisonService.clearComparisonResult();
      this._eventService.dispatchEvent(new DocChangeEvent({action: "close", type: "compared"}));
    }
  }

  async runComparisonAsync() {
    await this._comparisonService.compareAsync(
      this._docLoaders.main.docProxy, this._docLoaders.compared.docProxy);    
  }
  
  getPageProxy(type: DocType, pageIndex: number): PDFPageProxy {
    return this._docLoaders[type].getPage(pageIndex);
  }
  //#endregion
  
  //#region compared doc
  getComparisonResultForPage(pageIndex: number): PdfPageComparisonResult {
    return this._comparisonService.getComparisonResultForPage(pageIndex);
  }
  //#endregion
}
