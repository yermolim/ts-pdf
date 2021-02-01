import { keywordCodes } from "../../codes";
import { Parser, ParseResult } from "../../parser";
import { ObjId } from "./obj-id";

export class ObjInfo {
  constructor(public id: ObjId,
    public start: number,
    public end: number) { }
    
  static parse(parser: Parser, index: number, 
    skipEmpty = true): ParseResult<ObjInfo> {
    const id = ObjId.parse(parser, index, skipEmpty);
    if (!id) {
      return null;
    }

    const objIndexSupposed = id.end + 2;
    const objIndex = parser.findSubarrayIndex(keywordCodes.OBJ, 
      {minIndex: objIndexSupposed, closedOnly: true});
    if (!objIndex || objIndex.start !== objIndexSupposed) {
      return null;
    }    

    const objEndIndex = parser.findSubarrayIndex(keywordCodes.OBJ_END, 
      {minIndex: objIndex.end + 1, closedOnly: true});
    if (!objEndIndex) {
      return null;
    }

    return {
      value: new ObjInfo(id.value, id.start, objEndIndex.end),
      start: id.start,
      end: objEndIndex.end,
    };
  }
}
