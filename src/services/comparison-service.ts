import { Quadruple } from "ts-viewers-core";

export type PdfPageComparisonResult = Quadruple[];
export type PdfDocComparisonResult = Map<number, PdfPageComparisonResult>;

export class ComparisonService {
  private _comparisonResult: PdfDocComparisonResult;
  
  constructor() {}
  
  destroy() {}

  getComparisonResult(): PdfDocComparisonResult {
    return this._comparisonResult;
  }

  getComparisonResultForPage(pageIndex: number): PdfPageComparisonResult {
    const comparisonResult = this.getComparisonResult();
    return comparisonResult?.get(pageIndex);
  }

  clearComparisonResult() {
    return this._comparisonResult = null;
  }

  async compareAsync(): Promise<PdfDocComparisonResult> {
    // TODO: implement
    const result: PdfDocComparisonResult = null;
    this._comparisonResult = result;
    return this._comparisonResult;
  }
}
