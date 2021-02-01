import { dictObjTypes } from "../../const";
import { EncryptionDict } from "../encryption/encryption-dict";
import { StreamDict } from "../streams/stream-dict";
import { CatalogDict } from "../structure/catalog-dict";
import { InfoDict } from "../structure/info-dict";

export class TrailerStream extends StreamDict {
  /**
   * (Required) The number one greater than the highest object number 
   * used in this section or in any section for which this shall be an update. 
   * It shall be equivalent to the Size entry in a trailer dictionary
   */
  Size: number;
  /**
   * (Present only if the file has more than one cross-reference stream; 
   * not meaningful in hybrid-reference files) 
   * The byte offset in the decoded stream from the beginning of the file 
   * to the beginning of the previous cross-reference stream. 
   * This entry has the same function as the Prev entry in the trailer dictionary
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
  /**
   * (Optional)An array containing a pair of integers for each subsection 
   * in this section. The first integer shall be the first object number 
   * in the subsection; the second integer shall be the number of entries 
   * in the subsection The array shall be sorted in ascending order by object number. 
   * Subsections cannot overlap; 
   * an object number may have at most one entry in a section
   */
  Index: number[];
  /**
   * (Required) An array of integers representing the size of the fields 
   * in a single cross-reference entry. 
   * For PDF 1.5+, W always contains three integers; the value of each integer 
   * shall be the number of bytes (in the decoded stream) of the corresponding field
   */
  W: number[];
  
  constructor() {
    super(dictObjTypes.XREF);
  }
}
