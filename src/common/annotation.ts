import { Quadruple } from "./types";

export interface AnnotationRenderResult {
  /**svg container with all the annotation rendered helpers (boxes, handles, etc.) */
  controls: SVGGraphicsElement;
  /**container with the annotation rendered content*/
  content: HTMLDivElement;
}

export interface RenderableAnnotation {
  /**optional action callback which is called on 'pointer down' event */
  $onPointerDownAction: (e: PointerEvent) => void;  
  /**optional action callback which is called on 'pointer enter' event */
  $onPointerEnterAction: (e: PointerEvent) => void;
  /**optional action callback which is called on 'pointer leave' event */
  $onPointerLeaveAction: (e: PointerEvent) => void;

  get lastRenderResult(): AnnotationRenderResult;

  /**
   * render current annotation using SVG
   * @param viewBox view box used for SVG elements
   * @returns 
   */
  renderAsync(viewBox: Quadruple): Promise<AnnotationRenderResult>;
}
