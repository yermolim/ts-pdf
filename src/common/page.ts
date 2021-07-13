export interface PageInfo {
  /**number of the page in the pdf file */
  readonly number: number;
  /**pdf object id of the page */
  readonly id: number;
  /**pdf object generation of the page */
  readonly generation: number;

  /**page width before scaling*/
  get width(): number;
  /**page height before scaling*/
  get height(): number;
  /**current page rotation*/
  get rotation(): number; 
  /**current page scale*/  
  get scale(): number;
}
