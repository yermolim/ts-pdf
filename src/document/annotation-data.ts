import { DocumentData, PageUpdateAnnotsInfo } from "./document-data";
import { AnnotationDict } from "./entities/annotations/annotation-dict";

export class AnnotationData {
  private _sourceData: Uint8Array;
  private _documentData: DocumentData;
  private _annotationsByPageId: Map<number, AnnotationDict[]>;

  constructor(pdfData: Uint8Array) {
    if (!pdfData?.length) {
      throw new Error("Data is empty");
    }

    this._sourceData = pdfData;
    this._documentData = new DocumentData(pdfData);
  }

  tryAuthenticate(password = ""): boolean {
    if (!this._documentData.authenticated) {
      return this._documentData.authenticate(password);
    }
    return true;
  }

  /**
   * append an update section to the source data to remove annotations
   * supported by Annotator and return the result.
   * returned data is used to render the remaining file content in PDF.js
   */
  getRefinedData(): Uint8Array {
    const annotationMap = this.getAnnotationMap();
    const updateInfos: PageUpdateAnnotsInfo[] = [];

    const annotationMarkedToDelete: AnnotationDict[] = [];
    if (annotationMap?.size) {
      this.getAnnotationMap().forEach((v, k) => {
        const annotations = v.slice();
        // mark all parsed annotations as deleted
        annotations.forEach(x => {
          if (!x.deleted) {
            x.markAsDeleted(true);
            annotationMarkedToDelete.push(x);
          }
        });
        const updateInfo: PageUpdateAnnotsInfo = {
          pageId: k,
          annotations: annotations,
        };
        updateInfos.push(updateInfo);
      });
    }

    const refined = this._documentData.getUpdatedData(updateInfos);
    // remove redundant "isDeleted" flags
    annotationMarkedToDelete.forEach(x => x.markAsDeleted(false));

    return refined;
  }

  /**
   * get the data with all changes made to annotations applied.
   */
  getExportedData(): Uint8Array {
    return null;
  }

  getPageAnnotations(pageId: number): AnnotationDict[] {     
    const annotations = this.getAnnotationMap().get(pageId);
    return annotations || [];
  }

  addAnnotation(pageId: number, annotation: AnnotationDict) {
    const pageAnnotations = this.getAnnotationMap().get(pageId);
    if (pageAnnotations) {
      pageAnnotations.push(annotation);
    } else {
      this.getAnnotationMap().set(pageId, [annotation]);
    }
  }

  removeAnnotation(annotation: AnnotationDict) {
    annotation.markAsDeleted(true);
  }

  private getAnnotationMap(): Map<number, AnnotationDict[]> {
    if (this._annotationsByPageId) {
      return this._annotationsByPageId;
    }
    if (!this._documentData.authenticated) {
      throw new Error("Unauthorized access to file data");
    }    
    this._annotationsByPageId = this._documentData.getSupportedAnnotations();
    return this._annotationsByPageId;
  }
}
