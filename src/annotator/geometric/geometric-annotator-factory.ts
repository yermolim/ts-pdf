import { Quadruple } from "../../common";
import { DocumentData } from "../../document/document-data";

import { GeometricAnnotator, GeometricAnnotatorOptions } from "./geometric-annotator";
import { GeometricArrowAnnotator } from "./geometric-arrow";
import { GeometricCircleAnnotator } from "./geometric-circle-annotator";
import { GeometricLineAnnotator } from "./geometric-line-annotator";
import { GeometricPolygonAnnotator } from "./geometric-polygon-annotator";
import { GeometricPolylineAnnotator } from "./geometric-polyline-annotator";
import { GeometricSquareAnnotator } from "./geometric-square-annotator";

export const geometricAnnotatorTypes = ["square", "circle", "line", "arrow", "polyline", "polygon"] as const;
export type GeometricAnnotatorType =  typeof geometricAnnotatorTypes[number];

export class GeometricAnnotatorFactory {
  protected static lastType: GeometricAnnotatorType;

  static CreateAnnotator(docData: DocumentData, 
    parent: HTMLDivElement, options?: GeometricAnnotatorOptions, type?: GeometricAnnotatorType): GeometricAnnotator {
    
    type ||= GeometricAnnotatorFactory.lastType || "square";
    GeometricAnnotatorFactory.lastType = type;

    switch (type) {
      case "square":
        return new GeometricSquareAnnotator(docData, parent, options);
      case "circle":
        return new GeometricCircleAnnotator(docData, parent, options);
      case "line":
        return new GeometricLineAnnotator(docData, parent, options);
      case "arrow":
        return new GeometricArrowAnnotator(docData, parent, options);
      case "polyline":
        return new GeometricPolylineAnnotator(docData, parent, options);
      case "polygon":
        return new GeometricPolygonAnnotator(docData, parent, options);
      default:
        throw new Error(`Invalid geometric annotator type: ${type}`);
    }
  }
}
