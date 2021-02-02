import { Dict } from "../core/dict";
import { MetadataStream } from "./metadata-stream";
import { IndirectObjectId } from "../core/indirect-object-id";
import { StreamDict } from "./stream-dict";
import { streamTypes } from "../../common/const";

export class XFormStream extends StreamDict {
  /**
   * (Required) The type of XObject that this dictionary describes
   */
  readonly Subtype: "/Form" = "/Form";
  /**
   * (Optional) A code identifying the type of form XObject that this dictionary describes. 
   * The only valid value is 1
   */
  readonly FormType: 1 = 1;
  /**
   * (Required) An array of four numbers in the form coordinate system (see above), 
   * giving the coordinates of the left, bottom, right, and top edges, respectively, 
   * of the form XObject’s bounding box
   */
  BBox: number[];
  /**
   * (Optional) An array of six numbers specifying the form matrix, 
   * which maps form space into user space
   */
  Matrix: number[] = [1,0,0,1,0,0];
  /**
   * (Optional but strongly recommended; PDF 1.2+) A dictionary specifying any resources 
   * (such as fonts and images) required by the form
   */
  Resources: Dict | IndirectObjectId;
  /**
   * (Optional; PDF 1.4+) A metadata stream containing metadata for the form XObject
   */
  Metadata: MetadataStream;

  //TODO: add remaining properties
  
  constructor() {
    super(streamTypes.FORM_XOBJECT);
  }
}
