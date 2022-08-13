import { getDocument } from "pdfjs-dist";
import { PDFDocumentLoadingTask, PDFDocumentProxy, PDFPageProxy } from "pdfjs-dist/types/src/display/api";

import { DomUtils, EventService } from "ts-viewers-core";

import { DocumentService } from "./document-service";

export class PdfLoaderService {
  protected readonly _eventService: EventService;
  
  private _pdfLoadingTask: PDFDocumentLoadingTask;
  private _pdfDocument: PDFDocumentProxy;
  private _pdfPageProxies: Map<number, PDFPageProxy>;

  get pageCount(): number {
    return this._pdfDocument?.numPages || 0;
  }
  
  get docLoaded(): boolean {
    return !!this._pdfDocument;
  }

  private _docService: DocumentService;  
  get docService(): DocumentService {
    return this._docService;
  }

  get docProxy(): PDFDocumentProxy {
    return this._pdfDocument;
  }

  private _fileName: string; 
  get fileName(): string {
    return this._fileName;
  }

  constructor(eventService: EventService) {
    if (!eventService) {
      throw new Error("Event controller is not defined");
    }      
    this._eventService = eventService;
  }
  
  /**free resources to let GC clean them to avoid memory leak */
  destroy() {
    this._pdfLoadingTask?.destroy();
    
    if (this._pdfDocument) {
      this._pdfDocument.cleanup();
      this._pdfDocument.destroy();
    }  
    this._docService?.destroy();
  }
  
  async openPdfAsync(src: string | Blob | Uint8Array, fileName: string, userName: string,
    getPasswordAsync: () => Promise<string>,
    onProgress?: (progressData: { loaded: number; total: number }) => void): Promise<void> {
    
    // close the currently opened file if present
    await this.closePdfAsync();

    let data: Uint8Array;
    let doc: PDFDocumentProxy;

    // get the plain pdf data as a byte array
    try {
      data = await DomUtils.loadFileDataAsync(src);
    } catch (e) {
      throw new Error(`Cannot load file data: ${e.message}`);
    }

    // create DocumentData
    const docService = await DocumentService.createNewAsync(this._eventService, data, userName);
    let password: string;
    while (true) {
      const authenticated = docService.tryAuthenticate(password);
      if (!authenticated) {
        password = await getPasswordAsync();
        if (password === null) {
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
        return this.openPdfAsync(data, userName, fileName, getPasswordAsync, onProgress);
      }

      // remove supported annotations from the data before supplying it to PDF.js
      const dataWithoutAnnotations = 
        await docService.getDataWithoutSupportedAnnotationsAsync();

      this._pdfLoadingTask = getDocument({
        // get the pdf data with the supported annotations cut out
        data: dataWithoutAnnotations, 
        password,
      });
      if (onProgress) {
        this._pdfLoadingTask.onProgress = onProgress;
      }
      doc = await this._pdfLoadingTask.promise;    
      this._pdfLoadingTask = null;
    } catch (e) {
      throw new Error(`Cannot open PDF: ${e.message}`);
    }

    // update viewer state
    this._pdfDocument = doc;

    const pageMap = new Map<number, PDFPageProxy>();
    for (let i = 0; i < doc.numPages; i++) {      
      const pageProxy = await this._pdfDocument?.getPage(i + 1);
      pageMap.set(i, pageProxy);
    }
    this._pdfPageProxies = pageMap;
    
    this._docService = docService;
    this._fileName = fileName;
  }
  
  async closePdfAsync(): Promise<void> {
    // destroy a running loading task if present
    if (this._pdfLoadingTask) {
      if (!this._pdfLoadingTask.destroyed) {
        await this._pdfLoadingTask.destroy();
      }
      this._pdfLoadingTask = null;
    }

    this._pdfPageProxies = null;
    this._pdfDocument?.destroy();
    this._pdfDocument = null;    
    
    this._docService?.destroy();
    this._docService = null;
    this._fileName = null;
  }

  getPage(pageIndex: number): PDFPageProxy {
    if (!this._pdfPageProxies?.size) {
      return null;
    }
    return this._pdfPageProxies.get(pageIndex);
  }
}
