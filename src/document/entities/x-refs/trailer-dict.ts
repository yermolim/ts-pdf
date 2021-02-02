import { dictTypes } from "../../common/const";
import { Dict } from "../core/dict";
import { EncryptionDict } from "../encryption/encryption-dict";
import { CatalogDict } from "../structure/catalog-dict";
import { InfoDict } from "../structure/info-dict";

export class TrailerDict extends Dict {
  /**
   * (Required; shall not be an indirect reference) 
   * The total number of entries in the file’s cross-reference table, 
   * as defined by the combination of the original section and all update sections. 
   * Equivalently, this value shall be 1 greater than the highest object number 
   * defined in the file. Any object in a cross-reference section 
   * whose number is greater than this value shall be ignored and
   * defined to be missing by a conforming reader
   */
  Size: number;
  /**
   * (Present only if the file has more than one cross-reference section; 
   * shall be an indirect reference) The byte offset in the decoded stream 
   * from the beginning of the file to the beginning 
   * of the previous cross-reference section
   */
  Prev: number;
  /**
   * (Required; shall be an indirect reference) The catalog dictionary 
   * for the PDF document contained in the file
   */
  Root: CatalogDict;
  /**
   * (Required if document is encrypted; PDF 1.1+) 
   * The document’s encryption dictionary
   */
  Encrypt: EncryptionDict;
  /**
   * (Optional; shall be an indirect reference) 
   * The document’s information dictionary
   */
  Info: InfoDict;
  /**
   * (Required if an Encrypt entry is present; optional otherwise; PDF 1.1+) 
   * An array of two byte-strings constituting a file identifier for the file. 
   * If there is an Encrypt entry this array and the two byte-strings 
   * shall be direct objects and shall be unencrypted
   */
  ID: [];
  
  constructor() {
    super(dictTypes.EMPTY);
  }
}
