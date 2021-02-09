import { annotationTypes } from "../../../common/const";
import { MarkupAnnotation } from "./markup-annotation";

export class SoundAnnotation extends MarkupAnnotation {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.SOUND);
  }
  
  toArray(): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
}
