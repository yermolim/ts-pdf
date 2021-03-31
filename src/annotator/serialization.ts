import { Matrix, Pair, Rect } from "../common";

export interface AnnotationDto {
  annotationType: string;
  uuid: string;
  pageId: number;

  dateCreated: string;
  dateModified: string;
  author: string;

  rect: Rect;
  matrix: Matrix;
}

export interface StampAnnotationDto extends AnnotationDto {
  stampType: string;
  stampImageData?: number[];
}

export interface InkAnnotationDto extends AnnotationDto {
  inkList: number[][];
  color: Rect;
  strokeWidth: number;
  strokeDashGap?: Pair;
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
