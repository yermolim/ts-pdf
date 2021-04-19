import { annotationTypes } from "./const";
import { ParseInfo, ParseResult } from "./data-parser";

import { AnnotationDict, AnnotationDto } from "./entities/annotations/annotation-dict";
import { StampAnnotation, StampAnnotationDto } from "./entities/annotations/markup/stamp-annotation";
import { InkAnnotation, InkAnnotationDto } from "./entities/annotations/markup/ink-annotation";
import { SquareAnnotation } from "./entities/annotations/markup/geometric/square-annotation";
import { CircleAnnotation } from "./entities/annotations/markup/geometric/circle-annotation";

export class AnnotationParseFactory {
  static ParseAnnotationFromInfo(info: ParseInfo): AnnotationDict {
    const annotationType = info.parser.parseDictSubtype(info.bounds);
    let annot: ParseResult<AnnotationDict>;
    switch (annotationType) {
      case annotationTypes.STAMP:
        annot = StampAnnotation.parse(info);
        break;
      case annotationTypes.INK:
        annot = InkAnnotation.parse(info);
        break;
      case annotationTypes.SQUARE:
        annot = SquareAnnotation.parse(info);
        break;
      case annotationTypes.CIRCLE:
        annot = CircleAnnotation.parse(info);
        break;
        // case annotationTypes.LINE:
        //   annot = LineAnnotation.parse(info);
        //   break;
        // case annotationTypes.POLYGON:
        //   annot = PolygonAnnotation.parse(info);
        //   break;
        // case annotationTypes.POLYLINE:
        //   annot = PolylineAnnotation.parse(info);
        //   break;
        // case annotationTypes.FREE_TEXT:
        //   annot = FreeTextAnnotation.parse(info);
        //   break;
        // case annotationTypes.TEXT:
        //   annot = TextAnnotation.parse(info);
        //   break;
      default:
        break;
    }

    return annot?.value;;
  }

  static ParseAnnotationFromDto(dto: AnnotationDto): AnnotationDict {
    let annotation: AnnotationDict;
    switch (dto.annotationType) {
      case "/Stamp":
        annotation = StampAnnotation.createFromDto(dto as StampAnnotationDto);
        break;
      case "/Ink":
        annotation = InkAnnotation.createFromDto(dto as InkAnnotationDto);
        break;
      default:
        throw new Error(`Unsupported annotation type: ${dto.annotationType}`);
    }
    return annotation;
  }
}
