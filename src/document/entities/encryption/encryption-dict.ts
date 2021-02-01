import { dictObjTypes } from "../../const";
import { DictObj } from "../core/dict-obj";

export class EncryptionDict extends DictObj {
  /**
   * (Required) The name of the preferred security handler for this document. 
   * It shall be the name of the security handler that was used 
   * to encrypt the document. If SubFilter is not present, 
   * only this security handler shall be used when opening the document. 
   * If it is present, a conforming reader can use any security handler 
   * that implements the format specified by SubFilter
   */
  Filter = "/Standard";
  /**
   * (Optional; PDF 1.3+) A name that completely specifies the format and 
   * interpretation of the contents of the encryption dictionary. 
   * It allows security handlers other than the one specified by Filter 
   * to decrypt the document. If this entry is absent, other security 
   * handlers shall not decrypt the document
   */
  SubFilter: string;
  /** 
   * (Optional) A code specifying the algorithm to be used in encrypting 
   * and decrypting the document: 
   * 
   * - 0 An algorithm that is undocumented. This value shall not be used 
   * - 1 "Algorithm 1: Encryption of data using the RC4 or AES algorithms" 
   * with an encryption key length of 40 bits 
   * - 2 (PDF 1.4+) "Algorithm 1: Encryption of data using the RC4 or AES algorithms"
   * but permitting encryption key lengths greater than 40 bits 
   * - 3 (PDF 1.4+)An unpublished algorithm that permits encryption key lengths 
   * ranging from 40 to 128 bits. This value shall not appear in a conforming PDF file
   * - 4 (PDF 1.5) The security handler defines the use of encryption 
   * and decryption in the document, using the rules specified by the CF, StmF, and StrF entries. 
   * 
   * The default value if this entry is omitted shall be 0, 
   * but when present should be a value of 1 or greater
  */
  V: 0 | 1 | 2 | 3 | 4 = 0;
  /** 
   * (Optional; PDF 1.4+; only if V is 2 or 3) The length of the encryption key, 
   * in bits. The value shall be a multiple of 8, in the range 40 to 128
   * */
  Length = 40;
  /** 
   * (Optional; meaningful only when the value of V is 4; PDF 1.5+) 
   * A dictionary whose keys shall be crypt filter names and 
   * whose values shall be the corresponding crypt filter dictionaries. 
   * Every crypt filter used in the document shall have an entry in this dictionary, 
   * except for the standard crypt filter names
   * */
  CF: DictObj;
  /** 
   * (Optional; meaningful only when the value of V is 4; PDF 1.5+) 
   * The name of the crypt filter that shall be used by default 
   * when decrypting streams. The name shall be a key in the CF dictionary 
   * or a standard crypt filter name. All streams in the document, 
   * except for cross-reference streams or streams that have a Crypt entry 
   * in their Filterarray, shall be decrypted by the security handler, 
   * using this crypt filter
   * */
  StmF = "/Identity";
  /** 
   * (Optional; meaningful only when the value of V is 4; PDF 1.5+) 
   * The name of the crypt filter that shall be used when decrypting all strings 
   * in the document. The name shall be a key in the CF dictionary 
   * or a standard crypt filter name
   * */
  StrF = "/Identity";
  /** 
   * (Optional; meaningful only when the value of V is 4; PDF 1.6+) 
   * The name of the crypt filter that shall be used when encrypting 
   * embedded file streams that do not have their own crypt filter specifier; 
   * it shall correspond to a key in the CF dictionary 
   * or a standard crypt filter name
   * */
  EFF: string;
  
  constructor() {
    super(dictObjTypes.EMPTY);
  }
}
