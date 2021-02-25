import { annotationTypes, HighlightingMode, highlightingModes } from "../../../const";
import { CryptInfo } from "../../../common-interfaces";
import { ActionDict } from "../../actions/action-dict";
import { UriAction } from "../../actions/uri-action";
import { AnnotationDict } from "../annotation-dict";
import { RenderToSvgResult } from "../../../../common";

export class LinkAnnotation extends AnnotationDict {
  /**
   * (Optional; PDF 1.1+) An action that shall be performed 
   * when the link annotation is activated
   */
  A: ActionDict;
  /**
   * (Optional; not permitted if an A entry is present) A destination 
   * that shall be displayed when the annotation is activated
   */
  Dest: string | string[];
  /**
   * (Optional; PDF 1.2+) The annotation’s highlighting mode, the visual effect that shall be used 
   * when the mouse button is pressed or held down inside its active area
   */
  H: HighlightingMode = highlightingModes.INVERT;
  /**
   * (Optional; PDF 1.3+) A URI action formerly associated with this annotation
   */
  PA: UriAction;
  /**
   * (Optional; PDF 1.6+) An array of 8×n numbers specifying the coordinates of n quadrilaterals 
   * in default user space that comprise the region in which the link should be activated.
   * If this entry is not present or the conforming reader does not recognize it, 
   * the region specified by the Rect entry should be used
   */
  QuadPoints: number[];
  
  constructor() {
    super(annotationTypes.LINK);
  }
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    // TODO: implement
    return new Uint8Array();
  }
  
  render(): RenderToSvgResult {
    const streamRenderResult = super.render();
    if (streamRenderResult) {
      return streamRenderResult;
    }

    // TODO: implement individual render methods
    return null;
  }
}
