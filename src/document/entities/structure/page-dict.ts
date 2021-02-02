import { dictTypes } from "../../common/const";
import { AnnotationDict } from "../annotations/annotation-dict";
import { DateString } from "../../common/date-string";
import { Dict } from "../core/dict";
import { PageTreeDict } from "./page-tree-dict";

export class PageDict extends Dict {
  /**
   * (Required; shall be an indirect reference) 
   * The page tree node that is the immediate parent of this page object
   */
  Parent: PageTreeDict;
  /**
   * (Required if PieceInfo is present; optional otherwise; PDF 1.3+) 
   * The date and time when the page’s contents were most recently modified. 
   * If a page-piece dictionary (PieceInfo) is present, 
   * the modification date shall be used to ascertain 
   * which of the application data dictionaries 
   * that it contains correspond to the current content of the page
   */
  LastModified: DateString;
  /**
   * (Required; inheritable) A rectangle , expressed in default user space units, 
   * that shall define the boundaries of the physical medium 
   * on which the page shall be displayed or printed
   */
  MediaBox: number[];
  /**
   * (Optional; inheritable) The number of degrees by which the page shall be rotated 
   * clockwise when displayed or printed. The value shall be a multiple of 90
   */
  Rotate: 0 | 90 | 180 | 270 = 0;
  /**
   * (Optional) An array of annotation dictionaries that shall contain indirect 
   * references to all annotations associated with the page
   */
  Annots: AnnotationDict[];
  
  constructor() {
    super(dictTypes.PAGE);
  }
}
