import { AnnotationDict } from "./entities/annotations/annotation-dict";
import { DocumentData } from "./document-data";

export class AnnotationEditor {
  private _sourceData: Uint8Array;

  private _documentData: DocumentData;

  private _annotationsByPageId: Map<number, AnnotationDict[]>;

  private onAnnotationDictChange: ProxyHandler<AnnotationDict> = {
    set: (target: AnnotationDict, prop: string, value: any) => true,
  };

  constructor(pdfData: Uint8Array) {
    if (!pdfData?.length) {
      throw new Error("Data is empty");
    }

    this._sourceData = pdfData;
    this._documentData = new DocumentData(pdfData);
    this._annotationsByPageId = this._documentData.getSupportedAnnotations();
  }

  /**
   * append an update section to the source data to remove annotations
   * supported by Annotator and return the result.
   * returned data is used to render the remaining file content in PDF.js
   */
  getRefinedData(): Uint8Array {
    const idsToDelete: number[] = [];
    this._annotationsByPageId.forEach(x => {
      x.forEach(y => {
        // checking if the annotation has an id i.e. it is parsed from the file
        if (y.id) {
          idsToDelete.push(y.id);
        }
      });
    });

    return this._documentData.getRefinedData(idsToDelete);
  }

  /**
   * get the data with all changes made by AnnotationEditor applied.
   */
  getExportedData(): Uint8Array {
    return null;
  }

  getPageAnnotations(pageId: number): AnnotationDict[] {   
    const annotations = this._annotationsByPageId.get(pageId);
    if (!annotations) {
      return [];
    }
    return annotations.map(x => 
      new Proxy<AnnotationDict>(x, this.onAnnotationDictChange));
  }

  addAnnotation(pageId: number, annotation: AnnotationDict) {
    const pageAnnotations = this._annotationsByPageId.get(pageId);
    if (pageAnnotations) {
      pageAnnotations.push(annotation);
    } else {
      this._annotationsByPageId.set(pageId, [annotation]);
    }
  }
}
