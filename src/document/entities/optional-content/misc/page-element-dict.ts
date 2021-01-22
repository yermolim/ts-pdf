import { DictObj } from "../../core/dict-obj";

export const pageElementTypes = {
  HEADER_FOOTER: "/HF",
  FOREGROUND: "/FG",
  BACKGROUND: "/BG",
  LOGO: "/L",
} as const;
export type PageElementType = typeof pageElementTypes[keyof typeof pageElementTypes];

export class PageElementDict extends DictObj {
  /** (Required) */
  Subtype: PageElementType;
  
  constructor() {
    super(null);
  }
}
