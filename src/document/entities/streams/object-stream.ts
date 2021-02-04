import { streamTypes } from "../../common/const";
import { Bounds, DocumentParser, ParseResult } from "../../parser/document-parser";
import { ObjectId } from "../common/object-id";
import { PdfStream } from "../core/pdf-stream";

export class ObjectStream extends PdfStream {
  /**
   * (Required) The number of indirect objects stored in the stream
   */
  N: number;
  /**
   * (Required) The byte offset in the decoded stream of the first compressed object
   */
  First: number;
  /**
   * (Optional) A reference to another object stream, 
   * of which the current object stream shall be considered an extension
   */
  Extends: ObjectId;

  constructor() {
    super(streamTypes.OBJECT_STREAM);
  }  
  
  static parse(parser: DocumentParser, bounds: Bounds): ParseResult<ObjectStream> {    
    const stream = new ObjectStream();
    const parseResult = stream.tryParseProps(parser, bounds);

    return parseResult
      ? {value: stream, start: bounds.start, end: bounds.end}
      : null;
  }

  toArray(): Uint8Array {
    return new Uint8Array();
  }

  /**
   * fill public properties from data using info/parser if available
   */
  protected tryParseProps(parser: DocumentParser, bounds: Bounds): boolean {
    const superIsParsed = super.tryParseProps(parser, bounds);
    if (!superIsParsed) {
      return false;
    }

    if (this.Type !== streamTypes.OBJECT_STREAM) {
      return false;
    }

    const start = bounds.contentStart || bounds.start;
    const dictBounds = parser.getDictBoundsAt(start);
    
    let i = parser.skipToNextName(start, dictBounds.contentEnd);
    if (i === -1) {
      // no required props found
      return false;
    }
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/N":
            const n = parser.parseNumberAt(i, false);
            if (n) {
              this.N = n.value;
              i = n.end + 1;
            } else {              
              throw new Error("Can't parse /N property value");
            }
            break;
          case "/First":
            const first = parser.parseNumberAt(i, false);
            if (first) {
              this.First = first.value;
              i = first.end + 1;
            } else {              
              throw new Error("Can't parse /First property value");
            }
            break;
          case "/Extends":
            const parentId = ObjectId.parseRef(parser, i);
            if (parentId) {
              this.Extends = parentId.value;
              i = parentId.end + 1;
            } else {              
              throw new Error("Can't parse /Extends property value");
            }
            break;
          default:
            // skip to next name
            i = parser.skipToNextName(i, dictBounds.contentEnd);
            break;
        }
      } else {
        break;
      }
    };

    return true;
  }
}
