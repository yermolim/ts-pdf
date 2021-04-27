import { ElementEventController } from "../common/element-event-controller";
import { dictTypes } from "./const";
import { AuthenticationResult } from "./common-interfaces";

import { DataCryptHandler } from "./encryption/data-crypt-handler";
import { DataParser, ParseInfo } from "./data-parser";

import { ReferenceData } from "./reference-data";
import { DocumentDataUpdater, PageWithAnnotations } from "./document-data-updater";

import { ObjectId } from "./entities/core/object-id";
import { ObjectStream } from "./entities/streams/object-stream";
import { EncryptionDict } from "./entities/encryption/encryption-dict";

import { XrefParser } from "./xref-parser";
import { XRef } from "./entities/x-refs/x-ref";

import { CatalogDict } from "./entities/structure/catalog-dict";
import { PageDict } from "./entities/structure/page-dict";
import { PageTreeDict } from "./entities/structure/page-tree-dict";

import { AnnotationParseFactory } from "./annotation-parser";
import { AnnotationDict, AnnotationDto, AnnotEvent, annotSelectionRequestEvent, 
  AnnotSelectionRequestEvent } from "./entities/annotations/annotation-dict";

export class DocumentData {
  protected readonly _eventController: ElementEventController;
  get eventController(): ElementEventController {
    return this._eventController;
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
  private _selectedAnnotation: AnnotationDict;
  get selectedAnnotation(): AnnotationDict {
    return this._selectedAnnotation;
  }

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

  constructor(eventController: ElementEventController, data: Uint8Array, userName: string) {
    if (!eventController) {
      throw new Error("Event controller is not defined");
    }
    this._eventController = eventController;

    this._data = data;
    this._docParser = new DataParser(data);
    this._version = this._docParser.getPdfVersion();
    
    const lastXrefIndex = this._docParser.getLastXrefIndex();
    if (!lastXrefIndex) {{
      throw new Error("File doesn't contain update section");
    }}
    const xrefs = new XrefParser(this._docParser).parseAllXrefs(lastXrefIndex.value);
    if (!xrefs.length) {{
      throw new Error("Failed to parse cross-reference sections");
    }}

    this._xrefs = xrefs;
    this._referenceData = new ReferenceData(xrefs);
    // DEBUG
    // console.log(this._xrefs);    
    // console.log(this._referenceData);   

    this.parseEncryption();
    // DEBUG
    // console.log(this._encryption);

    this._userName = userName;
    
    this._eventController.addListener(annotSelectionRequestEvent, this.onSelectionRequest);
  }

  /**free the resources that can prevent garbage to be collected */
  destroy() {
    // clear onEditedAction to prevent memory leak
    this.getAllSupportedAnnotations().forEach(x => x.$onEditedAction = null);

    this._eventController.removeListener(annotSelectionRequestEvent, this.onSelectionRequest);
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

  //#region public annotations
  /**
   * get a PDF document byte array with all supported annotation being deleted to avoid duplication.
   * @returns
   */
  getDataWithoutSupportedAnnotations(): Uint8Array {
    const annotationMap = this.getSupportedAnnotationMap();
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

    const refined = this.getDataWithUpdatedAnnotations();

    // remove redundant "isDeleted" flags
    annotationMarkedToDelete.forEach(x => x.markAsDeleted(false));

    return refined;
  }

  /**
   * apply all the changes made to the supported annotations and return the final document as a byte array
   * @returns 
   */
  getDataWithUpdatedAnnotations(): Uint8Array {    
    const annotationMap = this.getSupportedAnnotationMap();
    const updaterData: PageWithAnnotations[] = [];
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

    const updater = new DocumentDataUpdater(this._data, this._xrefs[0],
      this._referenceData, this._authResult);
    const updatedBytes = updater.getDataWithUpdatedAnnotations(updaterData);
    return updatedBytes;
  }  

  /**get all aupported annotations for the specified page */
  getPageAnnotations(pageId: number): AnnotationDict[] {     
    const annotations = this.getSupportedAnnotationMap().get(pageId);
    return annotations || [];
  }

  /**
   * serialize supported annotations to the data-transfer objecst
   * @param addedOnly serialize only newly added annotations
   * @returns 
   */
  serializeAnnotations(addedOnly = false): AnnotationDto[] {
    const result: AnnotationDto[] = [];
    this.getSupportedAnnotationMap().forEach((v, k) => {
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
  appendAnnotationToPage(pageId: number, annotation: AnnotationDict) {
    if (isNaN(pageId) || !annotation) {
      throw new Error("Undefined argument exception");
    }

    annotation.$pageId = pageId;
    annotation.$onEditedAction = this.getOnAnnotationEditAction(annotation);
    const pageAnnotations = this.getSupportedAnnotationMap().get(pageId);
    if (pageAnnotations) {
      pageAnnotations.push(annotation);
    } else {
      this.getSupportedAnnotationMap().set(pageId, [annotation]);
    }

    this._eventController.dispatchEvent(new AnnotEvent({   
      type: "add",   
      annotations: [annotation.toDto()],
    }));
  } 

  /**
   * append annotations described using the passed data-transfer objects
   * @param dtos previously exported data-transfer objects
   */
  appendSerializedAnnotations(dtos: AnnotationDto[]) {
    let annotation: AnnotationDict;
    for (const dto of dtos) {
      annotation = AnnotationParseFactory.ParseAnnotationFromDto(dto);
      this.appendAnnotationToPage(dto.pageId, annotation);
    }
  }

  /**mark an annotation as deleted */
  removeAnnotation(annotation: AnnotationDict) {
    if (!annotation) {
      return;
    }

    annotation.markAsDeleted(true);
    this.setSelectedAnnotation(null);
    
    this._eventController.dispatchEvent(new AnnotEvent({  
      type: "delete",
      annotations: [annotation.toDto()],
    }));
  }

  /**mark the currently selected annotation as deleted */
  removeSelectedAnnotation() {
    const annotation = this.selectedAnnotation;
    if (annotation) {
      this.removeAnnotation(annotation);
    }
  }
  
  /** set an annotation as the selected one */
  setSelectedAnnotation(annotation: AnnotationDict): AnnotationDict {
    if (annotation === this._selectedAnnotation) {
      return;
    }

    if (this._selectedAnnotation) {
      this._selectedAnnotation.$translationEnabled = false;
      const oldSelectedSvg = this._selectedAnnotation?.lastRenderResult?.svg;
      oldSelectedSvg?.classList.remove("selected");
    }

    const newSelectedSvg = annotation?.lastRenderResult.svg;
    if (!newSelectedSvg) {
      this._selectedAnnotation = null;
    } else {
      annotation.$translationEnabled = true;    
      newSelectedSvg.classList.add("selected");
      this._selectedAnnotation = annotation;
    }

    // dispatch corresponding event
    this._eventController.dispatchEvent(new AnnotEvent({      
      type: "select",
      annotations: this._selectedAnnotation
        ? [this._selectedAnnotation.toDto()]
        : [],
    }));

    return this._selectedAnnotation;
  } 

  getSelectedAnnotationTextContent(): string {
    return this._selectedAnnotation?.Contents?.literal;
  }

  setSelectedAnnotationTextContent(text: string) {
    this.selectedAnnotation?.setTextContent(text);
  }
  //#endregion

  private getOnAnnotationEditAction(annotation: AnnotationDict): () => void {
    if (!annotation) {
      return null;
    }

    return () => this._eventController.dispatchEvent(new AnnotEvent({
      type: "edit",
      annotations: [annotation.toDto()],
    }));
  }
  
  /**
   * returns a proper parser instance and byte bounds for the object by its id.
   * returns null if an object with the specified id not found.
   * @param id 
   */
  private getObjectParseInfo = (id: number): ParseInfo => {
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
    const info: ParseInfo = {
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
    const objectParseInfo = stream.value.getObjectData(id);
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
  }   

  private parseSupportedAnnotations(): Map<number, AnnotationDict[]> {
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
      for (const objectId of annotationIds) {
        const info = this.getObjectParseInfo(objectId.id);  
        info.rect = page.MediaBox;
        const annot = AnnotationParseFactory.ParseAnnotationFromInfo(info);
        if (annot) {
          annotations.push(annot);
          annot.$pageId = page.id;
          annot.$onEditedAction = this.getOnAnnotationEditAction(annot);

          // DEBUG
          console.log(annot);
        }
      }
      
      annotationMap.set(page.id, annotations);
    }

    this._annotIdsByPageId = annotIdsByPageId;
    this._supportedAnnotsByPageId = annotationMap;

    return this._supportedAnnotsByPageId;
  }   
  
  private getSupportedAnnotationMap(): Map<number, AnnotationDict[]> {
    this.checkAuthentication();

    if (this._supportedAnnotsByPageId) {
      return this._supportedAnnotsByPageId;
    } 
    this._supportedAnnotsByPageId = this.parseSupportedAnnotations();
    return this._supportedAnnotsByPageId;
  } 

  private getAllSupportedAnnotations(): AnnotationDict[] {
    const result: AnnotationDict[] = [];
    this.getSupportedAnnotationMap().forEach((v, k) => {
      result.push(...v);
    });
    return result;
  }
  //#endregion
  
  private onSelectionRequest = (e: AnnotSelectionRequestEvent) => {
    if (e.detail?.annotation) {
      this.setSelectedAnnotation(e.detail.annotation);
    } else {
      this.setSelectedAnnotation(null);
    }
  };
}
