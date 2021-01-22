import { DictObj } from "../../core/dict-obj";

export const creatorInfoTypes = {
  ART: "/Artwork",
  TECH: "/Technical",
} as const;
export type CreatorInfoType = typeof creatorInfoTypes[keyof typeof creatorInfoTypes];

export class CreatoInfoDict extends DictObj {
  /**
   * (Required) A name defining the type of content controlled by the group
   */
  Subtype: CreatorInfoType; 
  /**
   * (Required) A text string specifying the application that created the group
   */
  Creator: string;
  
  constructor() {
    super(null);
  }
}
