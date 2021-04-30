import { DocumentData } from "../../document/document-data";

import { PageView } from "../../components/pages/page-view";
import { TextAnnotator, TextAnnotatorOptions } from "./text-annotator";
import { TextHighlightAnnotator } from "./text-highlight-annotator";

export const textAnnotatorTypes = ["popupText", "freeText", "freeTextCallout", 
  "strikeout", "underline", "highlight"] as const;
export type TextAnnotatorType =  typeof textAnnotatorTypes[number];

export class TextAnnotatorFactory {
  protected static lastType: TextAnnotatorType;

  static CreateAnnotator(docData: DocumentData, parent: HTMLDivElement, pages?: PageView[],
    options?: TextAnnotatorOptions, type?: TextAnnotatorType): TextAnnotator {
    
    type ||= TextAnnotatorFactory.lastType || "popupText";
    TextAnnotatorFactory.lastType = type;

    switch (type) {
      // TODO: implement all annotators
      case "popupText":
        return null;
        // return new TextPopupAnnotator(docData, parent, pages, options);
      case "freeText":
        return null;
        // return new TextFreeAnnotator(docData, parent, pages, options);
      case "freeTextCallout":
        return null;
        // return new TextFreeCalloutAnnotator(docData, parent, pages, options);
      case "strikeout":
        return null;
        // return new TextStrikeoutAnnotator(docData, parent, pages, options);
      case "underline":
        return null;
        // return new TextUnderlineAnnotator(docData, parent, pages, options);
      case "highlight":
        return new TextHighlightAnnotator(docData, parent, pages, options);
      default:
        throw new Error(`Invalid geometric annotator type: ${type}`);
    }
  }
}
