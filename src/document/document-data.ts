import { keywordCodes } from "./codes";
import { DataCryptHandler } from "./encryption/data-crypt-handler";
import { annotationTypes, dictTypes } from "./const";
import { AnnotationDict } from "./entities/annotations/annotation-dict";
import { FreeTextAnnotation } from "./entities/annotations/markup/free-text-annotation";
import { CircleAnnotation } from "./entities/annotations/markup/geometric/circle-annotation";
import { LineAnnotation } from "./entities/annotations/markup/geometric/line-annotation";
import { SquareAnnotation } from "./entities/annotations/markup/geometric/square-annotation";
import { InkAnnotation } from "./entities/annotations/markup/ink-annotation";
import { StampAnnotation } from "./entities/annotations/markup/stamp-annotation";
import { TextAnnotation } from "./entities/annotations/markup/text-annotation";
import { ObjectId } from "./entities/core/object-id";
import { EncryptionDict } from "./entities/encryption/encryption-dict";
import { ObjectStream } from "./entities/streams/object-stream";
import { CatalogDict } from "./entities/structure/catalog-dict";
import { PageDict } from "./entities/structure/page-dict";
import { PageTreeDict } from "./entities/structure/page-tree-dict";
import { XRef } from "./entities/x-refs/x-ref";
import { XRefStream } from "./entities/x-refs/x-ref-stream";
import { XRefTable } from "./entities/x-refs/x-ref-table";
import { DataParser, ParseInfo, ParseResult } from "./data-parser";
import { DataWriter } from "./data-writer";
import { ReferenceData, ReferenceDataChange, UsedReference } from "./reference-data";
import { AuthenticationResult, CryptInfo } from "./common-interfaces";
import { PolygonAnnotation } from "./entities/annotations/markup/geometric/polygon-annotation";
import { PolylineAnnotation } from "./entities/annotations/markup/geometric/polyline-annotation";
import { MarkupAnnotation } from "./entities/annotations/markup/markup-annotation";
import { ImageStream } from "./entities/streams/image-stream";
import { PdfObject } from "./entities/core/pdf-object";
import { XFormStream } from "./entities/streams/x-form-stream";

export interface PageUpdateAnnotsInfo {
  pageId: number;
  annotations: AnnotationDict[];
}

export class DocumentData {
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

  get size(): number {
    if (this._xrefs?.length) {
      return this._xrefs[0].size;
    } else {
      return 0;
    }
  }
  
  get encrypted(): boolean {
    return !!this._encryption;
  }

  get authenticated(): boolean {
    return !this._encryption || !!this._authResult;
  }

  constructor(data: Uint8Array) {
    this._data = data;
    this._docParser = new DataParser(data);
    this._version = this._docParser.getPdfVersion();
    
    const lastXrefIndex = this._docParser.getLastXrefIndex();
    if (!lastXrefIndex) {{
      throw new Error("File doesn't contain update section");
    }}
    const xrefs = DocumentData.parseAllXrefs(this._docParser, lastXrefIndex.value);
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
  }    

  private static parseXref(parser: DataParser, start: number, max: number): XRef {
    if (!parser || !start) {
      return null;
    }

    const offset = start;
    
    const xrefTableIndex = parser.findSubarrayIndex(keywordCodes.XREF_TABLE, 
      {minIndex: start, closedOnly: true});
    if (xrefTableIndex && xrefTableIndex.start === start) {      
      const xrefStmIndexProp = parser.findSubarrayIndex(keywordCodes.XREF_HYBRID,
        {minIndex: start, maxIndex: max, closedOnly: true});
      if (xrefStmIndexProp) {
        // HYBRID
        const streamXrefIndex = parser.parseNumberAt(xrefStmIndexProp.end + 1);
        if (!streamXrefIndex) {
          return null;
        }
        start = streamXrefIndex.value;
      } else {
        // TABLE
        const xrefTable = XRefTable.parse(parser, start, offset);
        return xrefTable?.value;
      }
    } else {
      // STREAM
    }

    const id = ObjectId.parse(parser, start, false);
    if (!id) {
      return null;
    }
    const xrefStreamBounds = parser.getIndirectObjectBoundsAt(id.end + 1);   
    if (!xrefStreamBounds) {      
      return null;
    }       
    const xrefStream = XRefStream.parse({parser: parser, bounds: xrefStreamBounds}, offset);
    return xrefStream?.value; 
  }  
  
  private static parseAllXrefs(parser: DataParser, start: number): XRef[] {    
    const xrefs: XRef[] = [];
    let max = parser.maxIndex;
    let xref: XRef;
    while (start) {
      xref = DocumentData.parseXref(parser, start, max);
      if (xref) {
        xrefs.push(xref);        
        max = start;
        start = xref.prev;
      } else {
        break;
      }
    }
    return xrefs;
  }

  authenticate(password: string): boolean {
    if (this.authenticated) {
      return true;
    }

    const cryptOptions = this._encryption.toCryptOptions();
    const fileId = this._xrefs[0].id[0].hex;
    const cryptorSource = new DataCryptHandler(cryptOptions, fileId);
    this._authResult = cryptorSource.authenticate(password);
    return this.authenticated;
  }

  getSupportedAnnotations(): Map<number, AnnotationDict[]> {
    this.checkAuthentication();

    if (!this._catalog) {      
      this.parsePageTree(); 
      // DEBUG
      // console.log(this._catalog);
      console.log(this._pages);
    }

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
      this._annotIdsByPageId.set(page.ref.id, annotationIds);

      const annotations: AnnotationDict[] = [];
      for (const objectId of annotationIds) {
        const info = this.getObjectParseInfo(objectId.id);  
        info.rect = page.MediaBox;
        const annotationType = info.parser.parseDictSubtype(info.bounds);
        let annot: ParseResult<AnnotationDict>;
        switch (annotationType) {
          case annotationTypes.STAMP:
            annot = StampAnnotation.parse(info);
            break;
          case annotationTypes.TEXT:
            annot = TextAnnotation.parse(info);
            break;
          case annotationTypes.FREE_TEXT:
            annot = FreeTextAnnotation.parse(info);
            break;
          case annotationTypes.CIRCLE:
            annot = CircleAnnotation.parse(info);
            break;
          case annotationTypes.SQUARE:
            annot = SquareAnnotation.parse(info);
            break;
          case annotationTypes.POLYGON:
            annot = PolygonAnnotation.parse(info);
            break;
          case annotationTypes.POLYLINE:
            annot = PolylineAnnotation.parse(info);
            break;
          case annotationTypes.LINE:
            annot = LineAnnotation.parse(info);
            break;
          case annotationTypes.INK:
            annot = InkAnnotation.parse(info);
            break;
          default:
            break;
        }
        if (annot) {
          annotations.push(annot.value);

          // DEBUG
          console.log(annot.value);
        }
      }
      
      annotationMap.set(page.id, annotations);
    }

    return annotationMap;
  }  

  getUpdatedData(infos: PageUpdateAnnotsInfo[]): Uint8Array {
    this.checkAuthentication();   

    const changeData = new ReferenceDataChange(this._referenceData);       
    const writer = new DataWriter(this._data);
    const refData = this._referenceData; 
    const stringCryptor = this._authResult?.stringCryptor;
    const streamCryptor = this._authResult?.streamCryptor;
    
    const writeIndirectObject = (obj: PdfObject): UsedReference => {
      const newRef = changeData.takeFreeRef(writer.offset, true);
      const newObjCryptInfo: CryptInfo = {
        ref: newRef,
        streamCryptor,
        stringCryptor,
      };
      writer.writeIndirectObject(newObjCryptInfo, obj);
      obj.ref = newRef;
      return newRef;
    };

    const writeUpdatedIndirectObject = (obj: PdfObject): UsedReference => {
      const objRef: UsedReference = {
        id: obj.id, 
        generation: obj.generation, 
        byteOffset: writer.offset
      };
      const objCryptInfo: CryptInfo = {
        ref: objRef,
        streamCryptor,
        stringCryptor,
      };
      changeData.updateUsedRef(objRef);
      writer.writeIndirectObject(objCryptInfo, obj);
      return objRef;
    };

    const writeImageXObject = (obj: ImageStream): UsedReference => {      
      const sMask = obj.sMask;
      if (!sMask.ref) {
        // a new image mask is added. get a new ref and write the mask 
        const newMaskRef = writeIndirectObject(sMask);
        obj.SMask = ObjectId.fromRef(newMaskRef);
      } else if (sMask.edited) {
        // the image mask was changed. update the ref and write the mask
        writeUpdatedIndirectObject(sMask);
      }

      if (!obj.ref) {                
        // the xObject has been added. get a new ref and write the xObject 
        return writeIndirectObject(obj);
      } else if (obj.edited) {
        // the xObject has been edited. update the ref and write the xObject 
        return writeUpdatedIndirectObject(obj);
      } else {
        // return reference to the unchanged source object
        return {
          id: obj.id, 
          generation: obj.generation, 
          byteOffset: refData.getOffset(obj.id)
        };
      }
    };

    const writeFormXObject = (obj: XFormStream): UsedReference => { 
      const resources = obj.Resources;
      if (resources && resources.edited) {
        [...resources.getXObjects()].forEach(([name, xObj]) => {
          // check if the xObject is an image and if it has a mask
          if (xObj instanceof ImageStream) {
            writeImageXObject(xObj);
          } else {
            writeFormXObject(xObj);
          }
        });
      }

      if (!obj.ref) {                
        // the xObject has been added. get a new ref and write the xObject 
        return writeIndirectObject(obj);
      } else if (obj.edited) {
        // the xObject has been edited. update the ref and write the xObject 
        return writeUpdatedIndirectObject(obj);
      } else {
        // return reference to the unchanged source object
        return {
          id: obj.id, 
          generation: obj.generation, 
          byteOffset: refData.getOffset(obj.id)
        };
      }      
    };

    for (const info of infos) {
      if (!info.annotations?.length) {
        // no changes made
        continue;
      }

      const page = this._pageById.get(info.pageId);
      if (!page) {
        throw new Error(`Page with id '${info.pageId}' not found`);
      }
      const refArray = this._annotIdsByPageId.get(info.pageId);

      for (const annotation of info.annotations || []) {
        if (annotation.deleted) {
          if (!annotation.ref) {
            // annotation is absent in the PDF document, so just ignore it
            continue;
          }
          const refIndex = refArray.findIndex(x => x.id === annotation.id);
          refArray.splice(refIndex, 1);
          changeData.setRefFree(annotation.id);
          // also, delete the associated popup if present
          if (annotation instanceof MarkupAnnotation && annotation.Popup) {
            changeData.setRefFree(annotation.Popup.id);
          }
        } else if (annotation.added || annotation.edited) {     
          const apStream = annotation.apStream;
          if (apStream) {
            writeFormXObject(apStream);
          }
          if (annotation.added) {
            // the annotation has no id so it's a new annotation
            // write the annotation and add the annotation to the ref array
            const newAnnotRef = writeIndirectObject(annotation);
            refArray.push(ObjectId.fromRef(newAnnotRef));
          } else {            
            // the annotation has been edited. rewrite the annotation
            writeUpdatedIndirectObject(annotation);
          }
        }
      }
   
      // update the page annotation reference array
      if (page.Annots instanceof ObjectId) {
        // page annotation refs are written to the indirect ref array 
        // write the updated annotation array and update the reference offset   
        const annotsRef: UsedReference = {
          id: page.Annots.id, 
          generation: page.Annots.generation, 
          byteOffset: writer.offset
        };
        const annotsCryptInfo: CryptInfo = {
          ref: annotsRef,
          streamCryptor,
          stringCryptor,
        };
        changeData.updateUsedRef(annotsRef);
        writer.writeIndirectArray(annotsCryptInfo, refArray);
      } else {
        // the page has no annotation refs yet or they are written directly to the page as the ref array
        // write a new annotation array and add or replace the reference to the page dict       
        const newAnnotsRef = changeData.takeFreeRef(writer.offset, true);
        const annotsCryptInfo: CryptInfo = {
          ref: newAnnotsRef,
          streamCryptor,
          stringCryptor,
        };
        writer.writeIndirectArray(annotsCryptInfo, refArray);
        // set ref to the annotation ref array
        page.Annots = ObjectId.fromRef(newAnnotsRef);
      }

      // write the updated page dict
      writeUpdatedIndirectObject(page);
    }

    this.writeXref(changeData, writer);
    const bytes = writer.getCurrentData();

    // DEBUG
    const parser = new DataParser(bytes);
    console.log(parser.sliceChars(parser.maxIndex - 1000, parser.maxIndex));

    return bytes;
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

  private writeXref(changeData: ReferenceDataChange, writer: DataWriter) {
    const lastXref = this._xrefs[0];
    const newXrefOffset = writer.offset;
    const newXrefRef = changeData.takeFreeRef(newXrefOffset, true);
    const newXrefEntries = changeData.exportEntries();
    const newXref = lastXref.createUpdate(newXrefEntries, newXrefOffset);
    writer.writeIndirectObject({ref: newXrefRef}, newXref);
    writer.writeEof(newXrefOffset);  
  }
}
