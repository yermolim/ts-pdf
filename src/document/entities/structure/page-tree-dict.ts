import { dictObjTypes } from "../../const";
import { DictObj } from "../core/dict-obj";
import { PageDict } from "./page-dict";

export class PageTreeDict extends DictObj {
  /**
   * (Required except in root node; prohibited in the root node; 
   * shall be an indirect reference) The page tree node that is the immediate parent of this one
   */
  Parent: PageTreeDict;
  /**
   * (Required) An array of indirect references to the immediate children of this node. 
   * The children shall only be page objects or other page tree nodes
   */
  Kids: (PageTreeDict | PageDict)[];
  /**
   * (Required) The number of leaf nodes (page objects) 
   * that are descendants of this node within the page tree
   */
  Count: number;
  
  constructor() {
    super(dictObjTypes.PAGE_TREE);
  }
}
