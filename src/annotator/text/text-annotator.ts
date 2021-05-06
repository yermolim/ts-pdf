import { Quadruple } from "../../common/types";

import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";

import { Annotator, AnnotatorDataChangeEvent } from "../annotator";

export interface TextAnnotatorOptions {
  strokeWidth?: number;  
  color?: Quadruple;
}

export abstract class TextAnnotator extends Annotator { 
  protected _color: Quadruple;
  protected _strokeWidth: number;
  
  protected constructor(docService: DocumentService, pageService: PageService, 
    parent: HTMLDivElement, options: TextAnnotatorOptions) {
    super(docService, pageService, parent);
    
    this._color = options?.color || [0, 0, 0, 1];
    this._strokeWidth = options?.strokeWidth || 3;
  }

  protected emitDataChanged(count: number, 
    saveable?: boolean, clearable?: boolean, undoable?: boolean) {
    this._docService.eventService.dispatchEvent(new AnnotatorDataChangeEvent({
      annotatorType: "text",
      elementCount: count,
      undoable,
      clearable,
      saveable,
    }));
  }
}
