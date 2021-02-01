import { keywordCodes } from "../../codes";
import { Parser, ParseResult } from "../../parser";
import { ObjId } from "./obj-id";

export class ObjInfo {
  public dictStart: number;
  public dictEnd: number;
  public streamStart: number;
  public streamEnd: number;

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

    const startIndex = objIndex.end + 1;
    const objEndIndex = parser.findSubarrayIndex(keywordCodes.OBJ_END, 
      {minIndex: startIndex, closedOnly: true});
    if (!objEndIndex) {
      return null;
    }
    let lastIndex = objEndIndex.start - 1;    

    const dictStartIndex = parser.findSubarrayIndex(keywordCodes.DICT_START,
      {direction: "straight", minIndex: startIndex, closedOnly: true});
    if (!dictStartIndex) {
      return null;
    }
    
    const info = new ObjInfo(id.value, id.start, objEndIndex.end);

    const streamEndIndex = parser.findSubarrayIndex(keywordCodes.STREAM_END, { 
      direction: "reverse", 
      minIndex: dictStartIndex.end + keywordCodes.DICT_END.length + keywordCodes.STREAM_START.length + 1, 
      maxIndex: lastIndex, 
      closedOnly: true
    });
    if (streamEndIndex) {      
      const streamStartIndex = parser.findSubarrayIndex(keywordCodes.STREAM_START, {
        direction: "reverse", 
        maxIndex: streamEndIndex.start - 1, 
        closedOnly: true
      });
      if (streamStartIndex) {
        info.streamStart = parser.findNonSpaceIndex("straight", streamStartIndex.end + 1);
        info.streamEnd = parser.findNonSpaceIndex("reverse", streamEndIndex.start - 1);
        lastIndex = parser.findNonSpaceIndex("reverse", streamStartIndex.start - 1);
      }
    }  

    const dictEndIndex = parser.findSubarrayIndex(keywordCodes.DICT_END, {
      direction: "reverse", 
      minIndex: dictStartIndex.end + 1, 
      maxIndex: lastIndex
    });  
    info.dictStart = dictStartIndex.end + 1;
    info.dictEnd = dictEndIndex.start - 1;    

    console.log(parser.sliceChars(info.dictStart, info.dictEnd));

    return {
      value: info,
      start: id.start,
      end: objEndIndex.end,
    };
  }
}
