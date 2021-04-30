import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";

import { TextAnnotator, TextAnnotatorOptions } from "./text-annotator";
import { TextHighlightAnnotator } from "./text-highlight-annotator";

export const textAnnotatorTypes = ["popupText", "freeText", "freeTextCallout", 
  "strikeout", "underline", "highlight"] as const;
export type TextAnnotatorType =  typeof textAnnotatorTypes[number];

export class TextAnnotatorFactory {
  protected static lastType: TextAnnotatorType;

  static CreateAnnotator(docService: DocumentService, pageService: PageService, parent: HTMLDivElement,
    options?: TextAnnotatorOptions, type?: TextAnnotatorType): TextAnnotator {
    
    type ||= TextAnnotatorFactory.lastType || "popupText";
    TextAnnotatorFactory.lastType = type;

    switch (type) {
      // TODO: implement all annotators
      case "popupText":
        return null;
        // return new TextPopupAnnotator(docService, parent, pages, options);
      case "freeText":
        return null;
        // return new TextFreeAnnotator(docService, parent, pages, options);
      case "freeTextCallout":
        return null;
        // return new TextFreeCalloutAnnotator(docService, parent, pages, options);
      case "strikeout":
        return null;
        // return new TextStrikeoutAnnotator(docService, parent, pages, options);
      case "underline":
        return null;
        // return new TextUnderlineAnnotator(docService, parent, pages, options);
      case "highlight":
        return new TextHighlightAnnotator(docService, pageService, parent, options);
      default:
        throw new Error(`Invalid geometric annotator type: ${type}`);
    }
  }
}
