import { ActionDict } from "../../core/action-dict";
import { BorderStyleDict } from "../../core/border-style-dict";
import { UriAction } from "../../core/uri-action";
import { annotationTypes, Annotation } from "../annotation";

export const highlightingModes = {
  NO: "/N",
  INVERT: "/I",
  OUTLINE: "/O",
  PUSH: "/P",
} as const;
export type HighlightingMode = typeof highlightingModes[keyof typeof highlightingModes];

export class LinkAnnotation extends Annotation {
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
  /**
   * (Optional; PDF 1.6+) A border style dictionary 
   * specifying the line width and dash pattern to be used in drawing the annotation’s border
   */
  BS: BorderStyleDict;
  
  constructor() {
    super(annotationTypes.LINK);
  }
}