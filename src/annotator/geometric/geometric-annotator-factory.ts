import { Quadruple } from "../../common/types";

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
  protected _lastType: GeometricAnnotatorType;
  protected _lastColor: Quadruple;
  protected _lastStrokeWidth: number;
  protected _lastCloudMode: boolean;

  createAnnotator(docService: DocumentService, pageService: PageService, parent: HTMLDivElement,
    options?: GeometricAnnotatorOptions, type?: GeometricAnnotatorType): GeometricAnnotator {
    
    type ||= this._lastType || "square";
    this._lastType = type;   
    
    const color = options?.color || this._lastColor || [0, 0, 0, 0.9];
    this._lastColor = color;

    const strokeWidth = options?.strokeWidth || this._lastStrokeWidth || 3;
    this._lastStrokeWidth = strokeWidth;
    
    const cloudMode = options?.cloudMode ?? this._lastCloudMode ?? false;
    this._lastCloudMode = cloudMode; 

    const combinedOptions: GeometricAnnotatorOptions = {
      color,
      strokeWidth,
      cloudMode,
    };

    switch (type) {
      case "square":
        return new GeometricSquareAnnotator(docService, pageService, parent, combinedOptions);
      case "circle":
        return new GeometricCircleAnnotator(docService, pageService, parent, combinedOptions);
      case "line":
        return new GeometricLineAnnotator(docService, pageService, parent, combinedOptions);
      case "arrow":
        return new GeometricArrowAnnotator(docService, pageService, parent, combinedOptions);
      case "polyline":
        return new GeometricPolylineAnnotator(docService, pageService, parent, combinedOptions);
      case "polygon":
        return new GeometricPolygonAnnotator(docService, pageService, parent, combinedOptions);
      default:
        throw new Error(`Invalid geometric annotator type: ${type}`);
    }
  }
}
