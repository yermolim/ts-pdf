import { dictTypes } from "../../common/const";
import { Dict } from "../core/dict";
import { PageTreeDict } from "./page-tree-dict";

export class CatalogDict extends Dict {
  /**
   * (Optional; PDF 1.4+) The version of the PDF specification 
   * to which the document conforms if later than the version 
   * specified in the file’s header. If the header specifies a later version, 
   * or if this entry is absent, the document shall conform to the version 
   * specified in the header. This entry enables a conforming writer 
   * to update the version using an incremental update; 
   * The value of this entry shall be a name object, not a number, 
   * and therefore shall be preceded by a SOLIDUS (2Fh) character (/) 
   * when written in the PDF file (for example, /1.4)
   */
  Version: string;
  /**
   * (Required; shall be an indirect reference) 
   * The page tree node that shall be the root of the document’s page tree
   */
  Pages: PageTreeDict;
  /**
   * (Optional; PDF 1.4+) A language identifier that shall specify the natural language 
   * for all text in the document except where overridden by language specifications 
   * for structure elements or marked content. If this entry is absent, 
   * the language shall be considered unknown
   */
  Lang: string;
  
  constructor() {
    super(dictTypes.CATALOG);
  }
}
