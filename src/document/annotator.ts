import { XRef } from "../document/entities/x-refs/x-ref";
import { Parser } from "./parser";
import { AnnotationDict } from "./entities/annotations/annotation-dict";
import { XRefParser } from "./entities/x-refs/x-ref-parser";

export class Annotator {
  private _sourceData: Uint8Array;

  private _parser: Parser;
  private _xrefParser: XRefParser;

  private _version: string;

  private _lastXref: XRef;
  
  private _catalog: any;

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

    this._parser = new Parser(pdfData);
    this._xrefParser = new XRefParser(this._parser);

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
    this._version = this._parser.getPdfVersion();

    const xrefs = this._xrefParser.parseAllXrefs();
    console.log(xrefs); 
    xrefs.forEach(x => {
      const entries = x.getEntries();
      console.log(entries);
    });
  }
  
  private updateData() {

  }

  private extractSupportedAnnotationDicts() {

  }
}
