import { DocumentData } from "../../document/document-data";

import { PageView } from "../../components/pages/page-view";
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

  static CreateAnnotator(docData: DocumentData, parent: HTMLDivElement, pages?: PageView[],
    options?: GeometricAnnotatorOptions, type?: GeometricAnnotatorType): GeometricAnnotator {
    
    type ||= GeometricAnnotatorFactory.lastType || "square";
    GeometricAnnotatorFactory.lastType = type;

    switch (type) {
      case "square":
        return new GeometricSquareAnnotator(docData, parent, pages, options);
      case "circle":
        return new GeometricCircleAnnotator(docData, parent, pages, options);
      case "line":
        return new GeometricLineAnnotator(docData, parent, pages, options);
      case "arrow":
        return new GeometricArrowAnnotator(docData, parent, pages, options);
      case "polyline":
        return new GeometricPolylineAnnotator(docData, parent, pages, options);
      case "polygon":
        return new GeometricPolygonAnnotator(docData, parent, pages, options);
      default:
        throw new Error(`Invalid geometric annotator type: ${type}`);
    }
  }
}
