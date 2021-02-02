import { StreamFilter, StreamType } from "../../common/const";
import { Dict } from "./dict";
import { FlateParamsDict } from "../encoding/flate-params-dict";
import { IndirectStreamObject } from "./indirect-object";
import { IndirectObjectInfo } from "./indirect-object-info";

export abstract class Stream extends IndirectStreamObject {
  readonly start: number;
  readonly end: number;

  /** (Optional) The  type  of  PDF  object  that  this  dictionary  describes */
  readonly Type: StreamType;

  /**
   * (Required) The number of bytes from the beginning of the line 
   * following the keyword stream to the last byte just before the keyword endstream. 
   * (There may be an additional EOL marker, preceding endstream, 
   * that is not included in the count and is not logically part of the stream data.
   */
  Length: number;
  /**
   * (Optional) The name of a filter that shall be applied in processing the stream data 
   * found between the keywords stream and endstream, or an array of zero, one or several names. 
   * Multiple filters shall be specified in the order in which they are to be applied
   */
  Filter: StreamFilter | StreamFilter[];
  /**
   * (Optional) A parameter dictionary or an array of such dictionaries, 
   * used by the filters specified by Filter
   */
  DecodeParams: (Dict | FlateParamsDict)[] | Dict | FlateParamsDict;
  /**
   * (Optional; PDF 1.5+) A non-negative integer representing the number of bytes 
   * in the decoded (defiltered) stream. It can be used to determine, for example, 
   * whether enough disk space is available to write a stream to a file
   */
  DL: number;
  
  protected constructor(info: IndirectObjectInfo, type: StreamType = null) {
    super(info);
    this.Type = type;
  }

  decode(): Uint8Array {
    return new Uint8Array();
  }
}
