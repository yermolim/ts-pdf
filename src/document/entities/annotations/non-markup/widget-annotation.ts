import { annotationTypes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { AnnotationDict } from "../annotation-dict";
import { SvgWithBox } from "../../../../common";

export class WidgetAnnotation extends AnnotationDict {
  // TODO: implement
  
  constructor() {
    super(annotationTypes.WIDGET);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
  
  render(): SvgWithBox {
    const streamRenderResult = super.render();
    if (streamRenderResult) {
      return streamRenderResult;
    }

    // TODO: implement individual render methods
    return null;
  }
}
