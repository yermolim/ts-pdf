import { Hextuple, Quadruple } from "./types";

export interface AnnotationRenderResult {
  /**svg container with all the annotation rendered helpers (boxes, handles, etc.) */
  controls: SVGGraphicsElement;
  /**container with the annotation rendered content*/
  content: HTMLDivElement;
}

export interface AnnotationDto {
  annotationType: string;
  uuid: string;
  pageId: number;

  dateCreated: string;
  dateModified: string;
  author: string;

  textContent: string;

  /**
   * annotation AABB min and max coordinates after all translations 
   * (annotation dictionary 'Rect' property value)
   */
  rect: Quadruple;
  /**
   * annotation AABB min and max coordinates before all translations 
   * (appearance stream 'BBox' property value) 
   */
  bbox?: Quadruple;
  /**
   * annotation transformation matrix for 'BBox' to fit inside 'Rect'
   * (appearance stream 'Matrix' property value)
   */
  matrix?: Hextuple;
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
  
  /**
   * serialize the annotation to a data transfer object
   * @returns 
   */
  toDto(): AnnotationDto;
}
