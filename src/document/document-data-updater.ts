import { AuthenticationResult, CryptInfo, IDataCryptor } from "./common-interfaces";
import { ReferenceData, ReferenceDataChange, UsedReference } from "./reference-data";
import { DataParser } from "./data-parser";
import { DataWriter } from "./data-writer";

import { ObjectId } from "./entities/core/object-id";
import { PdfObject } from "./entities/core/pdf-object";
import { XRef } from "./entities/x-refs/x-ref";

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

export class DocumentDataUpdater {
  private readonly _lastXref: XRef;
  private readonly _refData: ReferenceData;
  private readonly _changeData: ReferenceDataChange;      
  private readonly _writer: DataWriter; 

  private readonly _stringCryptor: IDataCryptor;        
  private readonly _streamCryptor: IDataCryptor;     

  constructor(sourceBytes: Uint8Array, lastXref: XRef,
    referenceData: ReferenceData, authResult: AuthenticationResult) {
    this._lastXref = lastXref;
    this._refData = referenceData;
    this._changeData = new ReferenceDataChange(referenceData);
    this._writer = new DataWriter(sourceBytes);
    
    this._stringCryptor = authResult?.stringCryptor;
    this._streamCryptor = authResult?.streamCryptor;
  }

  getDataWithUpdatedAnnotations(data: PageWithAnnotations[]) {  
    for (const {page, supportedAnnotations: annotations, 
      allAnnotationIds: refArray} of data) {
      if (!annotations?.length) {
        // no changes made
        continue;
      }

      for (const annotation of annotations) {
        if (annotation.deleted) {
          if (!annotation.ref) {
            // annotation is absent in the PDF document, so just ignore it
            continue;
          }
          const refIndex = refArray.findIndex(x => x.id === annotation.id);
          refArray.splice(refIndex, 1);
          this._changeData.setRefFree(annotation.id);
          // also, delete the associated popup if present
          if (annotation instanceof MarkupAnnotation && annotation.Popup) {
            this._changeData.setRefFree(annotation.Popup.id);
          }
        } else if (!annotation.ref || annotation.edited) {
          const apStream = annotation.apStream;
          if (apStream) {
            this.writeFormXObject(apStream);
          }
          if (this.isNew(annotation)) {
          // the annotation has no id so it's a new annotation
          // write the annotation and add the annotation to the ref array
            const newAnnotRef = this.writeIndirectObject(annotation);
            refArray.push(ObjectId.fromRef(newAnnotRef));
          } else {            
          // the annotation has been edited. rewrite the annotation
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
        page.Annots = ObjectId.fromRef(newAnnotsRef); // TODO: FIX!!111
      }

      // write the updated page dict
      this.writeUpdatedIndirectObject(page);
    }

    this.writeXref();
    const bytes = this._writer.getCurrentData();

    // DEBUG
    // const parser = new DataParser(bytes);
    // console.log(parser.sliceChars(parser.maxIndex - 3000, parser.maxIndex));

    return bytes;
  }

  private isNew(obj: PdfObject): boolean {
    return !obj.ref || !this._changeData.isUsedInSource(obj.id);
  } 
  
  private writeIndirectObject(obj: PdfObject): UsedReference {
    const newRef = this._changeData.takeFreeRef(this._writer.offset, true);
    const newObjCryptInfo: CryptInfo = {
      ref: newRef,
      streamCryptor: this._streamCryptor,
      stringCryptor: this._stringCryptor,
    };
    this._writer.writeIndirectObject(newObjCryptInfo, obj);
    obj.ref = newRef;
    return newRef;
  }

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

  private writeFormXObject(obj: XFormStream): UsedReference { 
    const resources = obj.Resources;
    if (resources && resources.edited) {
      [...resources.getXObjects()].forEach(([name, xObj]) => {
        // check if the xObject is an image and if it has a mask
        if (xObj instanceof ImageStream) {
          this.writeImageXObject(xObj);
        } else {
          this.writeFormXObject(xObj);
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

  private writeXref(): number {
    const newXrefOffset = this._writer.offset;
    const newXrefRef = this._changeData.takeFreeRef(newXrefOffset, true);
    const newXrefEntries = this._changeData.exportEntries();

    // DEBUG
    // console.log(newXrefEntries);

    const newXref = this._lastXref.createUpdate(newXrefEntries, newXrefOffset);
    this._writer.writeIndirectObject({ref: newXrefRef}, newXref);
    this._writer.writeEof(newXrefOffset); 
    
    return newXrefOffset;
  }
}
