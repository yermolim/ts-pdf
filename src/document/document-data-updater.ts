import { AuthenticationResult, CryptInfo, IDataCryptor } from "./common-interfaces";
import { ReferenceData, ReferenceDataChange, UsedReference } from "./reference-data";
import { DataWriter } from "./data-writer";

import { ObjectId } from "./entities/core/object-id";
import { PdfObject } from "./entities/core/pdf-object";
import { XRef } from "./entities/x-refs/x-ref";
import { XRefStream } from "./entities/x-refs/x-ref-stream";

import { ImageStream } from "./entities/streams/image-stream";
import { XFormStream } from "./entities/streams/x-form-stream";

import { PageDict } from "./entities/structure/page-dict";
import { AnnotationDict } from "./entities/annotations/annotation-dict";
import { MarkupAnnotation } from "./entities/annotations/markup/markup-annotation";

export interface PageWithAnnotations {
  page: PageDict;
  allAnnotationIds: ObjectId[];
  supportedAnnotations: AnnotationDict[];
}

/**the class that encapsulates the logic related to PDF document update */
export class DocumentDataUpdater {
  private readonly _lastXref: XRef;
  private readonly _refData: ReferenceData;
  private readonly _changeData: ReferenceDataChange;      
  private readonly _writer: DataWriter; 

  private readonly _stringCryptor: IDataCryptor;        
  private readonly _streamCryptor: IDataCryptor;   
  
  /**ids of objects that have already been written to the data earlier during this update */
  private _writtenIds = new Set<number>();

  /**
   * 
   * @param sourceBytes source PDF document byte array (the source data is not modified)
   * @param lastXref last cross-reference section of the document
   * @param referenceData source document reference data
   * @param authResult auhentication data
   */
  constructor(sourceBytes: Uint8Array, lastXref: XRef,
    referenceData: ReferenceData, authResult: AuthenticationResult) {
    this._lastXref = lastXref;
    this._refData = referenceData;
    this._changeData = new ReferenceDataChange(referenceData);
    this._writer = new DataWriter(sourceBytes);
    
    this._stringCryptor = authResult?.stringCryptor;
    this._streamCryptor = authResult?.streamCryptor;
  }

  /**
   * apply the changes made to the source document annotations and return the final document as a byte array
   * @param data array of objects with every page and its annotations
   * @returns updated PDF document byte array
   */
  getDataWithUpdatedAnnotations(data: PageWithAnnotations[]): Uint8Array {  
    for (const {page, supportedAnnotations: annotations, allAnnotationIds: refArray} of data) {
      if (!annotations?.length) {
        // no annotations, so no changes made
        continue;
      }

      // update the page annotations
      for (const annotation of annotations) {
        if (annotation.deleted) {
          if (!annotation.ref) {
            // annotation is absent in the PDF document, so just ignore it
            continue;
          }
          // remove the reference to the current annotation from the page annotation references
          const refIndex = refArray.findIndex(x => x.id === annotation.id);
          refArray.splice(refIndex, 1);
          // mark the annotation reference as freed
          this._changeData.setRefFree(annotation.id);
          // also, delete the associated popup if present
          if (annotation instanceof MarkupAnnotation && annotation.Popup) {
            this._changeData.setRefFree(annotation.Popup.id);
          }
        } else if (!annotation.ref || annotation.edited) {
          const apStream = annotation.apStream;
          if (apStream) {
            // if the annotation has an appearance stream write it to the document
            this.writeFormXObject(apStream);
          }
          if (this.isNew(annotation)) {
            // the annotation has no id so it's a new annotation
            // write the annotation to the document and add the annotation to the ref array
            const newAnnotRef = this.writeIndirectObject(annotation);
            refArray.push(ObjectId.fromRef(newAnnotRef));
          } else {            
            // the annotation is present in the source data, so it has been edited 
            // simply rewrite the annotation
            this.writeUpdatedIndirectObject(annotation);
          }
        }
      }
 
      // update the page annotation reference array
      if (page.Annots instanceof ObjectId 
        && this._changeData.isUsedInSource(page.Annots.id)) {
        // page annotation refs are written to the indirect ref array 
        // write the updated annotation array and update the reference offset   
        const annotsRef: UsedReference = {
          id: page.Annots.id, 
          generation: page.Annots.generation, 
          byteOffset: this._writer.offset
        };
        const annotsCryptInfo: CryptInfo = {
          ref: annotsRef,
          streamCryptor: this._streamCryptor,
          stringCryptor: this._stringCryptor,
        };
        this._changeData.updateUsedRef(annotsRef);
        this._writer.writeIndirectArray(annotsCryptInfo, refArray);
      } else {
        // the page has no annotation refs yet or they are written directly to the page as the ref array
        // write a new annotation array and add or replace the reference to the page dict       
        const newAnnotsRef = this._changeData.takeFreeRef(this._writer.offset, true);
        const annotsCryptInfo: CryptInfo = {
          ref: newAnnotsRef,
          streamCryptor: this._streamCryptor,
          stringCryptor: this._stringCryptor,
        };
        this._writer.writeIndirectArray(annotsCryptInfo, refArray);
        // set ref to the annotation ref array
        page.Annots = ObjectId.fromRef(newAnnotsRef); // TODO: check it
      }

      // write the updated page dict
      this.writeUpdatedIndirectObject(page);
    }

    // append a new cross-reference section
    this.writeXref();

    // get the result
    const bytes = this._writer.getCurrentData();

    // DEBUG
    // const parser = new DataParser(bytes);
    // console.log(parser.sliceChars(parser.maxIndex - 3000, parser.maxIndex));

    return bytes;
  }

  /**check if the object is not present in the source data */
  private isNew(obj: PdfObject): boolean {
    return !obj.ref || !this._changeData.isUsedInSource(obj.id);
  } 
  
  /**add a new PDF object to the document */
  private writeIndirectObject(obj: PdfObject): UsedReference {
    if (this._writtenIds.has(obj.id)) {
      // the object with this id has already been written to the data earlier during this update
      // ignore the object to prevent duplicating
      return this._changeData.getUsedRef(obj.id);
    }

    const newRef = this._changeData.takeFreeRef(this._writer.offset, true);
    const newObjCryptInfo: CryptInfo = {
      ref: newRef,
      streamCryptor: this._streamCryptor,
      stringCryptor: this._stringCryptor,
    };
    this._writer.writeIndirectObject(newObjCryptInfo, obj);
    obj.ref = newRef;

    this._writtenIds.add(newRef.id);
    return newRef;
  }

  /**add an updated PDF object to the document */
  private writeUpdatedIndirectObject(obj: PdfObject): UsedReference {
    const objRef: UsedReference = {
      id: obj.id, 
      generation: obj.generation, 
      byteOffset: this._writer.offset
    };
    const objCryptInfo: CryptInfo = {
      ref: objRef,
      streamCryptor: this._streamCryptor,
      stringCryptor: this._stringCryptor,
    };
    this._changeData.updateUsedRef(objRef);
    this._writer.writeIndirectObject(objCryptInfo, obj);
    return objRef;
  }
  
  /**add an image external PDF object to the document */
  private writeImageXObject = (obj: ImageStream): UsedReference => {      
    const sMask = obj.sMask;
    if (this.isNew(sMask)) {
      // a new image mask is added. get a new ref and write the mask 
      const newMaskRef = this.writeIndirectObject(sMask);
      obj.SMask = ObjectId.fromRef(newMaskRef);
    } else if (sMask.edited) {
      // the image mask was changed. update the ref and write the mask
      this.writeUpdatedIndirectObject(sMask);
    }

    if (this.isNew(obj)) {                
      // the xObject has been added. get a new ref and write the xObject 
      return this.writeIndirectObject(obj);
    } else if (obj.edited) {
      // the xObject has been edited. update the ref and write the xObject 
      return this.writeUpdatedIndirectObject(obj);
    } else {
      // return reference to the unchanged source object
      return {
        id: obj.id, 
        generation: obj.generation, 
        byteOffset: this._refData.getOffset(obj.id)
      };
    }
  };

  /**add an external form PDF object to the document */
  private writeFormXObject(obj: XFormStream): UsedReference { 
    const resources = obj.Resources;
    if (resources && resources.edited) {
      [...resources.getXObjects()].forEach(([name, xObj]) => {
        // check if the xObject is an image and if it has a mask
        if (xObj instanceof ImageStream) {
          this.writeImageXObject(xObj);
        } else if (xObj instanceof XFormStream) {
          this.writeFormXObject(xObj);
        }
      });
      [...resources.getFonts()].forEach(([name, font]) => {
        if (font.encoding && this.isNew(font.encoding)) {
          this.writeIndirectObject(font.encoding);
        }
        if (font.descriptor && this.isNew(font.descriptor)) {
          this.writeIndirectObject(font.descriptor);
        }
        if (this.isNew(font)) {
          this.writeIndirectObject(font);
        } else if (font.edited) {
          this.writeUpdatedIndirectObject(font);
        }
      });
    }

    if (this.isNew(obj)) {                
      // the xObject has been added. get a new ref and write the xObject 
      return this.writeIndirectObject(obj);
    } else if (obj.edited) {
      // the xObject has been edited. update the ref and write the xObject 
      return this.writeUpdatedIndirectObject(obj);
    } else {
      // return reference to the unchanged source object
      return {
        id: obj.id, 
        generation: obj.generation, 
        byteOffset: this._refData.getOffset(obj.id)
      };
    }      
  }   
  
  /**
   * add a new cross-reference section to the document using the update data 
   * @returns the new cross-reference section 
   */
  private writeXref(): number {
    const newXrefOffset = this._writer.offset;
    const newXrefEntries = this._changeData.exportEntries();

    // DEBUG
    // console.log(newXrefEntries);

    // create a new cross-reference section based on the previous one
    const newXref = this._lastXref.createUpdate(newXrefEntries, newXrefOffset);

    if (this._lastXref instanceof XRefStream) {
      // cross-reference stream
      // write the stream as indirect object
      const newXrefRef = this._changeData.takeFreeRef(newXrefOffset, true);
      this._writer.writeIndirectObject({ref: newXrefRef}, newXref);
    } else {      
      // cross-reference table
      this._writer.writeBytes(newXref.toArray());
    }    

    this._writer.writeEof(newXrefOffset);     
    return newXrefOffset;
  }
}
