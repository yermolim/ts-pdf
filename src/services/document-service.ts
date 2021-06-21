import { AnnotationDto } from "../common/annotation";

import { dictTypes } from "../document/spec-constants";
import { AuthenticationResult } from "../document/encryption/interfaces";

import { DataParser } from "../document/data-parse/data-parser";
import { DefaultDataParser } from "../document/data-parse/default-data-parser";
import { ParserInfo } from "../document/data-parse/parser-info";
import { DataUpdater, PageUpdateInfo } from "../document/data-save/data-updater";
import { DataCryptHandler } from "../document/encryption/data-crypt-handler";

import { ObjectId } from "../document/entities/core/object-id";
import { ObjectStream } from "../document/entities/streams/object-stream";
import { EncryptionDict } from "../document/entities/encryption/encryption-dict";

import { XrefParser } from "../document/data-parse/xref-parser";
import { XRef } from "../document/entities/x-refs/x-ref";
import { ReferenceData } from "../document/references/reference-data";

import { CatalogDict } from "../document/entities/structure/catalog-dict";
import { PageDict } from "../document/entities/structure/page-dict";
import { PageTreeDict } from "../document/entities/structure/page-tree-dict";
import { FontDict } from "../document/entities/appearance/font-dict";

import { AnnotationParser } from "../document/data-parse/annotation-parser";
import { AnnotationDict } from "../document/entities/annotations/annotation-dict";

import { ElementEventService } from "./element-event-service";

//#region custom events
export const annotSelectionRequestEvent = "tspdf-annotselectionrequest" as const;
export const annotFocusRequestEvent = "tspdf-annotfocusrequest" as const;
export const annotChangeEvent = "tspdf-annotchange" as const;
export const docServiceStateChangeEvent = "tspdf-docservicechange" as const;

export interface AnnotSelectionRequestEventDetail {
  annotation: AnnotationDict;
}
export interface AnnotFocusRequestEventDetail {
  annotation: AnnotationDict;
}
export interface AnnotEventDetail {
  type: "focus" | "select" | "add" | "edit" | "delete" | "render";
  annotations: AnnotationDto[];
}
export interface DocServiceStateChangeEventDetail {
  undoableCount: number;
}

export class AnnotSelectionRequestEvent extends CustomEvent<AnnotSelectionRequestEventDetail> {
  constructor(detail: AnnotSelectionRequestEventDetail) {
    super(annotSelectionRequestEvent, {detail});
  }
}
export class AnnotFocusRequestEvent extends CustomEvent<AnnotFocusRequestEventDetail> {
  constructor(detail: AnnotFocusRequestEventDetail) {
    super(annotFocusRequestEvent, {detail});
  }
}
export class AnnotEvent extends CustomEvent<AnnotEventDetail> {
  constructor(detail: AnnotEventDetail) {
    super(annotChangeEvent, {detail});
  }
}
export class DocServiceStateChangeEvent extends CustomEvent<DocServiceStateChangeEventDetail> {
  constructor(detail: DocServiceStateChangeEventDetail) {
    super(docServiceStateChangeEvent, {detail});
  }
}

declare global {
  interface HTMLElementEventMap {
    [annotSelectionRequestEvent]: AnnotSelectionRequestEvent;
    [annotFocusRequestEvent]: AnnotFocusRequestEvent;
    [annotChangeEvent]: AnnotEvent;
    [docServiceStateChangeEvent]: DocServiceStateChangeEvent;
  }
}
//#endregion

interface ExecutedAsyncCommand {
  timestamp: number;  
  undo(): Promise<void>;
  redo?(): Promise<void>;
}

export class DocumentService {
  protected readonly _eventService: ElementEventService;
  get eventService(): ElementEventService {
    return this._eventService;
  }

  private readonly _userName: string; 
  get userName(): string {
    return this._userName;
  }

  private readonly _data: Uint8Array; 
  private readonly _docParser: DataParser;
  private readonly _version: string; 

  private readonly _xrefs: XRef[];
  private readonly _referenceData: ReferenceData;

  private _encryption: EncryptionDict;  
  private _authResult: AuthenticationResult;

  private _catalog: CatalogDict;
  private _pages: PageDict[];
  private _pageById = new Map<number, PageDict>();
  
  private _annotIdsByPageId = new Map<number, ObjectId[]>();
  private _supportedAnnotsByPageId: Map<number, AnnotationDict[]>;
  
  private _focusedAnnotation: AnnotationDict;
  get focusedAnnotation(): AnnotationDict {
    return this._focusedAnnotation;
  }

  private _selectedAnnotation: AnnotationDict;
  get selectedAnnotation(): AnnotationDict {
    return this._selectedAnnotation;
  }

  private _fontMap: Map<string, FontDict>;
  get fontMap(): Map<string, FontDict> {
    return this._fontMap;
  }  

  private _lastCommands: ExecutedAsyncCommand[] = [];

  /**max PDF object id + 1 */
  get size(): number {
    if (this._xrefs?.length) {
      return this._xrefs[0].size;
    } else {
      return 0;
    }
  }
  
  /**check if the document is encrypted */
  get encrypted(): boolean {
    return !!this._encryption;
  }

  /**check if a document user is authenticated */
  get authenticated(): boolean {
    return !this._encryption || !!this._authResult;
  }

  constructor(eventService: ElementEventService, data: Uint8Array, userName: string) {
    if (!eventService) {
      throw new Error("Event controller is not defined");
    }
    this._eventService = eventService;

    this._data = data;
    this._docParser = new DefaultDataParser(data);    
    const xrefParser = new XrefParser(this._docParser);

    this._version = xrefParser.getPdfVersion();
    if (!this._version) {      
      throw new Error("Error parsing PDF version number");
    }

    const lastXrefIndex = xrefParser.getLastXrefIndex();
    if (!lastXrefIndex) {{
      throw new Error("File doesn't contain update section");
    }}
    const xrefs = xrefParser.parseAllXrefs(lastXrefIndex.value);
    if (!xrefs.length) {{
      throw new Error("Failed to parse cross-reference sections");
    }}
    this._xrefs = xrefs;
    // DEBUG
    // console.log(this._xrefs); 

    this._referenceData = new ReferenceData(xrefs);   
    // DEBUG
    // console.log(this._referenceData);   

    this.parseEncryption();
    // DEBUG
    // console.log(this._encryption);

    this._userName = userName;

    this._fontMap = FontDict.newFontMap();
    
    this._eventService.addListener(annotSelectionRequestEvent, this.onAnnotationSelectionRequest);
    this._eventService.addListener(annotFocusRequestEvent, this.onAnnotationFocusRequest);
  }

  /**free the resources that can prevent garbage to be collected */
  destroy() {
    this._lastCommands.length = 0;
    this.emitStateChanged();

    this.getAllSupportedAnnotationsAsync().then(map => map.forEach(x => {
      // clear public actions to prevent memory leak
      x.$onEditAction = null;
      x.$onRenderUpdatedAction = null;
    }));

    this._eventService.removeListener(annotSelectionRequestEvent, this.onAnnotationSelectionRequest);
    this._eventService.removeListener(annotFocusRequestEvent, this.onAnnotationFocusRequest);
  }

  tryAuthenticate(password = ""): boolean {
    if (!this.authenticated) {
      return this.authenticate(password);
    }
    return true;
  }

  /**
   * get a copy of the current document data
   * @returns the document underlying byte array
   */
  getPlainData(): Uint8Array {
    return this._data.slice();
  }
  
  /**undo the most recent command */
  async undoAsync() {
    this.undoCommandAsync();
  }

  //#region public annotations
  /**
   * get a PDF document byte array with all supported annotation being deleted to avoid duplication.
   * @returns
   */
  async getDataWithoutSupportedAnnotationsAsync(): Promise<Uint8Array> {
    const annotationMap = await this.getSupportedAnnotationMapAsync();
    const annotationMarkedToDelete: AnnotationDict[] = [];
    if (annotationMap?.size) {
      annotationMap.forEach((v, k) => {
        const annotations = v.slice();
        // mark all parsed annotations as deleted
        annotations.forEach(x => {
          if (!x.deleted) {
            x.markAsDeleted(true);
            annotationMarkedToDelete.push(x);
          }
        });
      });
    }

    const refined = await this.getDataWithUpdatedAnnotationsAsync();

    // remove redundant "isDeleted" flags
    annotationMarkedToDelete.forEach(x => x.markAsDeleted(false));

    return refined;
  }

  /**
   * apply all the changes made to the supported annotations and return the final document as a byte array
   * @returns 
   */
  async getDataWithUpdatedAnnotationsAsync(): Promise<Uint8Array> {    
    const annotationMap = await this.getSupportedAnnotationMapAsync();
    const updaterData: PageUpdateInfo[] = [];
    annotationMap.forEach((pageAnnotations, pageId) => {
      const page = this._pageById.get(pageId);
      if (page) {
        const allAnnotationIds = this._annotIdsByPageId.get(pageId).slice() || [];
        updaterData.push({
          page,
          allAnnotationIds,
          supportedAnnotations: pageAnnotations || [],
        });
      } else {
        // throw new Error(`Page with id '${pageId}' not found`);
        console.log(`Page with id '${pageId}' not found`);
      }
    });    

    const updater = new DataUpdater(this._data, this._xrefs[0],
      this._referenceData, this._authResult);
    const updatedBytes = updater.getDataWithUpdatedAnnotations(updaterData);
    return updatedBytes;
  }  

  /**get all aupported annotations for the specified page */
  async getPageAnnotationsAsync(pageId: number): Promise<AnnotationDict[]> {  
    const annotationMap = await this.getSupportedAnnotationMapAsync(); 
    const annotations = annotationMap.get(pageId);
    return annotations || [];
  }

  /**
   * serialize supported annotations to the data-transfer objecst
   * @param addedOnly serialize only newly added annotations
   * @returns 
   */
  async serializeAnnotationsAsync(addedOnly = false): Promise<AnnotationDto[]> {
    const result: AnnotationDto[] = [];
    const annotationMap = await this.getSupportedAnnotationMapAsync(); 
    annotationMap.forEach((v, k) => {
      v.forEach(x => {
        if (!addedOnly || x.added) {
          result.push(x.toDto());
        }
      });
    });
    return result;
  }

  /**
   * append an annotation to the page.
   * any annotation can be appended only to one page at a time.
   * appending an annotation to another page removes it from the first one
   */
  async appendAnnotationToPageAsync(pageId: number, annotation: AnnotationDict) {
    await this.appendAnnotationAsync(pageId, annotation, true);
  } 

  /**
   * append annotations described using the passed data-transfer objects
   * @param dtos previously exported data-transfer objects
   */
  async appendSerializedAnnotationsAsync(dtos: AnnotationDto[]) {
    let annotation: AnnotationDict;
    for (const dto of dtos) {
      annotation = await AnnotationParser.ParseAnnotationFromDtoAsync(dto, this._fontMap);
      await this.appendAnnotationToPageAsync(dto.pageId, annotation);
    }
  }

  /**mark an annotation as deleted */
  removeAnnotationFromPage(annotation: AnnotationDict) {
    this.removeAnnotation(annotation, true);
  }

  /**mark the currently selected annotation as deleted */
  removeSelectedAnnotation() {
    const annotation = this._selectedAnnotation;
    if (annotation) {
      this.removeAnnotation(annotation, true);
    }
  }
  
  /** set an annotation as the selected one */
  setSelectedAnnotation(annotation: AnnotationDict): AnnotationDict {
    if (annotation === this._selectedAnnotation) {
      return;
    }

    if (this._selectedAnnotation) {
      this._selectedAnnotation.$translationEnabled = false;
      const oldSelectedSvg = this._selectedAnnotation?.lastRenderResult?.controls;
      oldSelectedSvg?.classList.remove("selected");
    }

    const newSelectedSvg = annotation?.lastRenderResult?.controls;
    if (!newSelectedSvg) {
      this._selectedAnnotation = null;
    } else {
      annotation.$translationEnabled = true;    
      newSelectedSvg.classList.add("selected");
      this._selectedAnnotation = annotation;
    }

    // dispatch corresponding event
    this._eventService.dispatchEvent(new AnnotEvent({      
      type: "select",
      annotations: this._selectedAnnotation
        ? [this._selectedAnnotation.toDto()]
        : [],
    }));

    return this._selectedAnnotation;
  } 
  
  /** set an annotation as the focused one */
  setFocusedAnnotation(annotation: AnnotationDict): AnnotationDict {
    if (annotation === this._focusedAnnotation) {
      return;
    }

    if (this._focusedAnnotation) {
      this._focusedAnnotation.$translationEnabled = false;
      const oldFocusedSvg = this._focusedAnnotation?.lastRenderResult?.controls;
      oldFocusedSvg?.classList.remove("focused");
    }

    const newFocusedSvg = annotation?.lastRenderResult?.controls;
    if (!newFocusedSvg) {
      this._focusedAnnotation = null;
    } else {
      annotation.$translationEnabled = true;    
      newFocusedSvg.classList.add("focused");
      this._focusedAnnotation = annotation;
    }

    // dispatch corresponding event
    this._eventService.dispatchEvent(new AnnotEvent({      
      type: "focus",
      annotations: this._focusedAnnotation
        ? [this._focusedAnnotation.toDto()]
        : [],
    }));

    return this._focusedAnnotation;
  } 

  getSelectedAnnotationTextContent(): string {
    return this._selectedAnnotation?.Contents?.literal;
  }

  async setSelectedAnnotationTextContentAsync(text: string) {
    await this._selectedAnnotation?.setTextContentAsync(text);
  }
  //#endregion

  private pushCommand(command: ExecutedAsyncCommand) {
    this._lastCommands.push(command);
    this.emitStateChanged();
  }

  private async undoCommandAsync() {
    if (!this._lastCommands.length) {
      return;
    }
    const lastCommand = this._lastCommands.pop();
    await lastCommand.undo();    
    this.emitStateChanged();
  }

  private emitStateChanged() {
    this._eventService.dispatchEvent(new DocServiceStateChangeEvent({
      undoableCount: this._lastCommands.length,
    }));    
  }

  private async appendAnnotationAsync(pageId: number, annotation: AnnotationDict, undoable: boolean) {
    if (!annotation) {
      throw new Error("Annotation is not defined");
    }

    const page = this._pageById.get(pageId);
    if (!page) {
      throw new Error(`Page with id ${pageId} is not found`);
    }

    annotation.markAsDeleted(false);
    annotation.$pageId = page.id;
    annotation.$onEditAction = this.getOnAnnotEditAction(annotation);
    annotation.$onRenderUpdatedAction = this.getOnAnnotRenderUpdatedAction(annotation);
    const annotationMap = await this.getSupportedAnnotationMapAsync();
    const pageAnnotations = annotationMap.get(pageId);
    if (pageAnnotations) {
      pageAnnotations.push(annotation);
    } else {
      annotationMap.set(pageId, [annotation]);
    }

    if (undoable) {
      this.pushCommand({
        timestamp: Date.now(),
        undo: async () => {
          this.removeAnnotation(annotation, false);
        }
      });
    }

    this._eventService.dispatchEvent(new AnnotEvent({   
      type: "add",   
      annotations: [annotation.toDto()],
    }));
  } 
  
  /**mark an annotation as deleted */
  private removeAnnotation(annotation: AnnotationDict, undoable: boolean) {
    if (!annotation) {
      return;
    }

    annotation.markAsDeleted(true);
    this.setSelectedAnnotation(null);
    
    if (undoable) {
      this.pushCommand({
        timestamp: Date.now(),
        undo: async () => {
          this.appendAnnotationAsync(annotation.$pageId, annotation, false);
        }
      });
    }
    
    this._eventService.dispatchEvent(new AnnotEvent({  
      type: "delete",
      annotations: [annotation.toDto()],
    }));
  }

  private getOnAnnotEditAction(annotation: AnnotationDict): (undo: () => Promise<void>) => void {
    if (!annotation) {
      return null;
    }

    return (undo?: () => Promise<void>) => {
      if (!annotation.$pageId) {
        // do not emit annotation edit events until the annotation is not appended to the page
        return;
      }

      if (undo) {
        this.pushCommand({ timestamp: Date.now(), undo });
      }
      this._eventService.dispatchEvent(new AnnotEvent({
        type: "edit",
        annotations: [annotation.toDto()],
      }));
    };
  }
  
  private getOnAnnotRenderUpdatedAction(annotation: AnnotationDict): () => void {
    if (!annotation) {
      return null;
    }

    return () => this._eventService.dispatchEvent(new AnnotEvent({
      type: "render",
      annotations: [annotation.toDto()],
    }));
  }
  
  /**
   * returns a proper parser instance and byte bounds for the object by its id.
   * returns null if an object with the specified id not found.
   * @param id 
   */
  private getObjectParseInfo = (id: number): ParserInfo => {
    if (!id) {
      return null;
    }
    const offset = this._referenceData?.getOffset(id);
    if (isNaN(offset)) {
      return null;
    } 
    
    const objectId = ObjectId.parse(this._docParser, offset);
    if (!objectId) {
      return null;
    }   

    const bounds = this._docParser.getIndirectObjectBoundsAt(objectId.end + 1, true);
    if (!bounds) {
      return null;
    }
    const parseInfoGetter = this.getObjectParseInfo;
    const info: ParserInfo = {
      parser: this._docParser, 
      bounds, 
      parseInfoGetter, 
      cryptInfo: {
        ref: {id: objectId.value.id, generation: objectId.value.generation},
        stringCryptor: this._authResult?.stringCryptor,
        streamCryptor: this._authResult?.streamCryptor,
      },
    };

    if (objectId.value.id === id) {
      // object id equals the sought one, so this is the needed object
      return info;
    } 

    // object id at the given offset is not equal to the sought one
    // check if the object is an object stream and try to find the needed object inside it
    const stream = ObjectStream.parse(info);
    if (!stream) {
      return;
    }
    const objectParseInfo = stream.value.getObjectData(id, DefaultDataParser);
    if (objectParseInfo) {
      // the object is found inside the stream
      objectParseInfo.parseInfoGetter = parseInfoGetter;
      return objectParseInfo;
    }

    return null;
  };
  
  //#region authentication and encryption
  private authenticate(password: string): boolean {
    if (this.authenticated) {
      return true;
    }

    const cryptOptions = this._encryption.toCryptOptions();
    const fileId = this._xrefs[0].id[0].hex;
    const cryptorSource = new DataCryptHandler(cryptOptions, fileId);
    this._authResult = cryptorSource.authenticate(password);
    return this.authenticated;
  }

  private checkAuthentication() {    
    if (!this.authenticated) {      
      throw new Error("Unauthorized access to file data");
    }
  }

  private parseEncryption() {    
    const encryptionId = this._xrefs[0].encrypt;
    if (!encryptionId) {
      return;
    }

    const encryptionParseInfo = this.getObjectParseInfo(encryptionId.id);
    const encryption = EncryptionDict.parse(encryptionParseInfo);
    if (!encryption) {
      throw new Error("Encryption dict can't be parsed");
    }
    this._encryption = encryption.value;
  }
  //#endregion

  //#region parsing annotations
  private parsePages(output: PageDict[], tree: PageTreeDict) {
    if (!tree.Kids.length) {
      return;
    }

    for (const kid of tree.Kids) {
      const parseInfo = this.getObjectParseInfo(kid.id);
      if (!parseInfo) {
        continue;
      }

      const type = parseInfo.parser.parseDictType(parseInfo.bounds);
      if (type === dictTypes.PAGE_TREE) {          
        const kidTree = PageTreeDict.parse(parseInfo);
        if (kidTree) {
          this.parsePages(output, kidTree.value);
        }
      } else if (type === dictTypes.PAGE) {
        const kidPage = PageDict.parse(parseInfo);
        if (kidPage) {
          output.push(kidPage.value);
        }
      }
    }
  }; 

  private parsePageTree() {  
    const catalogId = this._xrefs[0].root;
    const catalogParseInfo = this.getObjectParseInfo(catalogId.id);
    const catalog = CatalogDict.parse(catalogParseInfo);
    if (!catalog) {
      throw new Error("Document root catalog not found");
    }
    this._catalog = catalog.value;

    const pageRootId = catalog.value.Pages;
    const pageRootParseInfo = this.getObjectParseInfo(pageRootId.id);
    const pageRootTree = PageTreeDict.parse(pageRootParseInfo);
    if (!pageRootTree) {
      throw new Error("Document root page tree not found");
    }

    const pages: PageDict[] = [];
    this.parsePages(pages, pageRootTree.value);
    this._pages = pages;

    this._pageById.clear();
    pages.forEach(x => this._pageById.set(x.ref.id, x));

    // DEBUG
    // console.log(this._pageById);
  }   

  private async parseSupportedAnnotationsAsync() {
    this.checkAuthentication();

    if (!this._catalog) {      
      this.parsePageTree(); 
      // DEBUG
      // console.log(this._catalog);
      // console.log(this._pages);
    }

    const annotIdsByPageId = new Map<number, ObjectId[]>();
    const annotationMap = new Map<number, AnnotationDict[]>();
    
    for (const page of this._pages) {      
      const annotationIds: ObjectId[] = [];
      if (Array.isArray(page.Annots)) {
        annotationIds.push(...page.Annots);
      } else if (page.Annots instanceof ObjectId) {
        const parseInfo = this.getObjectParseInfo(page.Annots.id);
        if (parseInfo) {
          const annotationRefs = ObjectId.parseRefArray(parseInfo.parser, 
            parseInfo.bounds.contentStart);
          if (annotationRefs?.value?.length) {
            annotationIds.push(...annotationRefs.value);
          }
        }        
      }
      annotIdsByPageId.set(page.ref.id, annotationIds);

      const annotations: AnnotationDict[] = [];   
      // fake async function to keep user interface responsible   
      const processAnnotation = (objectId: ObjectId) => 
        new Promise<AnnotationDict>((resolve, reject) => {
          setTimeout(() => {          
            const info = this.getObjectParseInfo(objectId.id);  
            info.rect = page.MediaBox;
            const annot = AnnotationParser.ParseAnnotationFromInfo(info, this._fontMap);
            resolve(annot);
          }, 0);
        });
      for (const objectId of annotationIds) {
        const annot = await processAnnotation(objectId);
        if (annot) {
          annotations.push(annot);
          annot.$pageId = page.id;
          annot.$onEditAction = this.getOnAnnotEditAction(annot);
          annot.$onRenderUpdatedAction = this.getOnAnnotRenderUpdatedAction(annot);
        }
      }
      
      annotationMap.set(page.id, annotations);
    }

    // DEBUG
    // console.log(annotationMap);

    this._annotIdsByPageId = annotIdsByPageId;
    this._supportedAnnotsByPageId = annotationMap;
  }   
  
  private async getSupportedAnnotationMapAsync(): Promise<Map<number, AnnotationDict[]>> {
    this.checkAuthentication();

    if (this._supportedAnnotsByPageId) {
      return this._supportedAnnotsByPageId;
    } 

    await this.parseSupportedAnnotationsAsync();
    return this._supportedAnnotsByPageId;
  } 

  private async getAllSupportedAnnotationsAsync(): Promise<AnnotationDict[]> {
    const result: AnnotationDict[] = [];
    const annotationMap = await this.getSupportedAnnotationMapAsync();
    annotationMap.forEach((v, k) => {
      result.push(...v);
    });
    return result;
  }
  //#endregion
  
  private onAnnotationSelectionRequest = (e: AnnotSelectionRequestEvent) => {
    if (e.detail?.annotation) {
      this.setSelectedAnnotation(e.detail.annotation);
    } else {
      this.setSelectedAnnotation(null);
    }
  };

  private onAnnotationFocusRequest = (e: AnnotFocusRequestEvent) => {    
    if (e.detail?.annotation) {
      this.setFocusedAnnotation(e.detail.annotation);
    } else {
      this.setFocusedAnnotation(null);
    }
  };
}
