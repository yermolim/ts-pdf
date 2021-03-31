import { Hextuple, Double, Quadruple } from "../common";

export interface AnnotationDto {
  annotationType: string;
  uuid: string;
  pageId: number;

  dateCreated: string;
  dateModified: string;
  author: string;

  rect: Quadruple;
  matrix: Hextuple;
}

export interface StampAnnotationDto extends AnnotationDto {
  stampType: string;
  stampImageData?: number[];
}

export interface InkAnnotationDto extends AnnotationDto {
  inkList: number[][];
  color: Quadruple;
  strokeWidth: number;
  strokeDashGap?: Double;
}

//#region custom events
export const annotChangeEvent = "tspdf-annotchange" as const;
export interface AnnotEventDetail {
  type: "select" | "add" | "edit" | "delete";
  annotations: AnnotationDto[];
}
export class AnnotEvent extends CustomEvent<AnnotEventDetail> {
  constructor(detail: AnnotEventDetail) {
    super(annotChangeEvent, {detail});
  }
}
declare global {
  interface DocumentEventMap {
    [annotChangeEvent]: AnnotEvent;
  }
}
//#endregion
