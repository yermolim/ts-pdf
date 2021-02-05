import { annotationTypes } from "../../../common/const";
import { MarkupAnnotation } from "./markup-annotation";

export const stampTypes = {
  DRAFT: "/Draft",
  NOT_APPROVED: "/NotApproved",
  APPROVED: "/Approved",
  AS_IS: "/AsIs",
  FOR_COMMENT: "/ForComment",
  EXPERIMENTAL: "/Experimental",
  FINAL: "/Final",
  SOLD: "/Sold",
  EXPIRED: "/Expired",
  PUBLIC: "/ForPublicRelease",
  NOT_PUBLIC: "/NotForPublicRelease",
  DEPARTMENTAL: "/Departmental",
  CONFIDENTIAL: "/Confidential",
  SECRET: "/TopSecret",
} as const;
export type StampType = typeof stampTypes[keyof typeof stampTypes];

export class StampAnnotation extends MarkupAnnotation {
  /**
   * (Optional) The name of an icon that shall be used in displaying the annotation
   */
  Name: StampType = stampTypes.DRAFT;
  
  constructor() {
    super(annotationTypes.STAMP);
  }
}
