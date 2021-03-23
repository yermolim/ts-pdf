import { Matrix, Pair, Rect } from "../document/common-interfaces";

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
