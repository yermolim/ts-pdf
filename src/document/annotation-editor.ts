import { XRef } from "./entities/x-refs/x-ref";
import { DataParser } from "./parser/data-parser";
import { AnnotationDict } from "./entities/annotations/annotation-dict";
import { DocumentData } from "./parser/document-data";

export class AnnotationEditor {
  private _sourceData: Uint8Array;

  private _parser: DataParser;
  private _documentData: DocumentData;

  private _annotations: AnnotationDict[];
  get annotations(): AnnotationDict[] {
    // use proxy to detect changes in annotations
    return this._annotations.map(x => 
      new Proxy<AnnotationDict>(x, this.onAnnotationDictChange));
  }  

  private onAnnotationDictChange: ProxyHandler<AnnotationDict> = {
    set: (target: AnnotationDict, prop: string, value: any) => true,
  };

  constructor(pdfData: Uint8Array) {
    if (!pdfData?.length) {
      throw new Error("Data is empty");
    }

    this._sourceData = pdfData;

    this._parser = new DataParser(pdfData);
    this._documentData = new DocumentData(this._parser);

    this._documentData.parse();
  }

  /**
   * append an update section to the source data to remove annotations
   * supported by Annotator and return the result.
   * returned data is used to render the remaining file content in PDF.js
   */
  getRefinedData(): Uint8Array {
    return null;
  }

  /**
   * get the data with all changes made by Annotator applied.
   */
  getExportedData(): Uint8Array {
    return null;
  }

  addAnnotationDict(annotation: AnnotationDict) {
    this._annotations.push(annotation);
  }
  
  private updateData() {

  }

  private extractSupportedAnnotationDicts() {

  }
}
