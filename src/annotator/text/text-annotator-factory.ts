import { Quadruple } from "../../common/types";

import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";

import { TextAnnotator, TextAnnotatorOptions } from "./text-annotator";
import { TextHighlightAnnotator } from "./text-highlight-annotator";
import { TextSquigglyAnnotator } from "./text-squiggly-annotator";
import { TextStrikeoutAnnotator } from "./text-strikeout-annotator";
import { TextUnderlineAnnotator } from "./text-underline-annotator";

export const textAnnotatorTypes = ["highlight", "strikeout", "squiggly", "underline", 
  "popupText", "freeText", "freeTextCallout"] as const;
export type TextAnnotatorType =  typeof textAnnotatorTypes[number];

export class TextAnnotatorFactory {
  protected _lastType: TextAnnotatorType;
  protected _lastColor: Quadruple;
  protected _lastStrokeWidth: number;

  createAnnotator(docService: DocumentService, pageService: PageService, parent: HTMLDivElement,
    options?: TextAnnotatorOptions, type?: TextAnnotatorType): TextAnnotator {
    
    type ||= this._lastType || "popupText";
    this._lastType = type;

    const color = options?.color || this._lastColor || [0, 0, 0, 0.9];
    this._lastColor = color;

    const strokeWidth = options?.strokeWidth || this._lastStrokeWidth || 2;
    this._lastStrokeWidth = strokeWidth;

    const combinedOptions: TextAnnotatorOptions = {
      color,
      strokeWidth,
    };

    switch (type) {
      // TODO: implement all annotators
      case "popupText":
        return null;
        // return new TextPopupAnnotator(docService, pageService, parent, combinedOptions);
      case "freeText":
        return null;
        // return new TextFreeAnnotator(docService, pageService, parent, combinedOptions);
      case "freeTextCallout":
        return null;
        // return new TextFreeCalloutAnnotator(docService, pageService, parent, combinedOptions);
      case "highlight":
        return new TextHighlightAnnotator(docService, pageService, parent, combinedOptions);
      case "squiggly":
        return new TextSquigglyAnnotator(docService, pageService, parent, combinedOptions);
      case "strikeout":
        return new TextStrikeoutAnnotator(docService, pageService, parent, combinedOptions);
      case "underline":
        return new TextUnderlineAnnotator(docService, pageService, parent, combinedOptions);
      default:
        throw new Error(`Invalid geometric annotator type: ${type}`);
    }
  }
}
