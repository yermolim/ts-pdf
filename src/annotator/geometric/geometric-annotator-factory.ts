import { PageService } from "../../services/page-service";
import { DocumentService } from "../../services/document-service";

import { GeometricAnnotator, GeometricAnnotatorOptions } from "./geometric-annotator";
import { GeometricArrowAnnotator } from "./geometric-arrow-annotator";
import { GeometricCircleAnnotator } from "./geometric-circle-annotator";
import { GeometricLineAnnotator } from "./geometric-line-annotator";
import { GeometricPolygonAnnotator } from "./geometric-polygon-annotator";
import { GeometricPolylineAnnotator } from "./geometric-polyline-annotator";
import { GeometricSquareAnnotator } from "./geometric-square-annotator";

export const geometricAnnotatorTypes = ["square", "circle", "line", "arrow", "polyline", "polygon"] as const;
export type GeometricAnnotatorType =  typeof geometricAnnotatorTypes[number];

export class GeometricAnnotatorFactory {
  protected static lastType: GeometricAnnotatorType;

  static CreateAnnotator(docService: DocumentService, pageService: PageService, parent: HTMLDivElement,
    options?: GeometricAnnotatorOptions, type?: GeometricAnnotatorType): GeometricAnnotator {
    
    type ||= GeometricAnnotatorFactory.lastType || "square";
    GeometricAnnotatorFactory.lastType = type;

    switch (type) {
      case "square":
        return new GeometricSquareAnnotator(docService, pageService, parent, options);
      case "circle":
        return new GeometricCircleAnnotator(docService, pageService, parent, options);
      case "line":
        return new GeometricLineAnnotator(docService, pageService, parent, options);
      case "arrow":
        return new GeometricArrowAnnotator(docService, pageService, parent, options);
      case "polyline":
        return new GeometricPolylineAnnotator(docService, pageService, parent, options);
      case "polygon":
        return new GeometricPolygonAnnotator(docService, pageService, parent, options);
      default:
        throw new Error(`Invalid geometric annotator type: ${type}`);
    }
  }
}
