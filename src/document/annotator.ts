import { AnnotationDict } from "./entities/annotations/annotation-dict";

export class Annotator {
  protected _sourceData: Uint8Array;

  private _lastXRef: any;
  private _catalog: any;
  
  private _extractAnnotationDictsXRef: any;

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
    this.parseData();
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

  private parseData() {

  }

  private updateData() {

  }

  private extractSupportedAnnotationDicts() {

  }
}
