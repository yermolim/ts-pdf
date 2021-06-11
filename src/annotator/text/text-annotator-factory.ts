import { Quadruple } from "../../common/types";

import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";

import { Viewer } from "../../components/viewer";

import { TextAnnotator, TextAnnotatorOptions } from "./text-annotator";
import { TextHighlightAnnotator } from "./text-highlight-annotator";
import { TextSquigglyAnnotator } from "./text-squiggly-annotator";
import { TextStrikeoutAnnotator } from "./text-strikeout-annotator";
import { TextUnderlineAnnotator } from "./text-underline-annotator";
import { TextNoteAnnotator } from "./text-note-annotator";
import { FreeTextAnnotator } from "./free-text-annotator";
import { FreeTextCalloutAnnotator } from "./free-text-callout-annotator";

export const textAnnotatorTypes = ["highlight", "strikeout", "squiggly", "underline", 
  "note", "freeText", "freeTextCallout"] as const;
export type TextAnnotatorType =  typeof textAnnotatorTypes[number];

export class TextAnnotatorFactory {
  protected _lastType: TextAnnotatorType;
  protected _lastColor: Quadruple;
  protected _lastStrokeWidth: number;

  createAnnotator(docService: DocumentService, pageService: PageService, viewer: Viewer,
    options?: TextAnnotatorOptions, type?: TextAnnotatorType): TextAnnotator {

    if (!docService) {
      throw new Error("Document service is not defined");
    }
    if (!pageService) {
      throw new Error("Page service is not defined");
    }
    if (!viewer) {
      throw new Error("Viewer is not defined");
    }
    
    type ||= this._lastType || "highlight";
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
      case "note":
        return new TextNoteAnnotator(docService, pageService, viewer, combinedOptions);
      case "freeText":
        return new FreeTextAnnotator(docService, pageService, viewer, combinedOptions);
      case "freeTextCallout":
        return new FreeTextCalloutAnnotator(docService, pageService, viewer, combinedOptions);
      case "highlight":
        return new TextHighlightAnnotator(docService, pageService, viewer.container, combinedOptions);
      case "squiggly":
        return new TextSquigglyAnnotator(docService, pageService, viewer.container, combinedOptions);
      case "strikeout":
        return new TextStrikeoutAnnotator(docService, pageService, viewer.container, combinedOptions);
      case "underline":
        return new TextUnderlineAnnotator(docService, pageService, viewer.container, combinedOptions);
      default:
        throw new Error(`Invalid geometric annotator type: ${type}`);
    }
  }
}
