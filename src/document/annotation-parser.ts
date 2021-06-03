import { annotationTypes } from "./const";
import { ParseInfo, ParseResult } from "./data-parser";

import { AnnotationDict, AnnotationDto } from "./entities/annotations/annotation-dict";
import { StampAnnotation, StampAnnotationDto } from "./entities/annotations/markup/stamp-annotation";
import { TextAnnotation, TextAnnotationDto } from "./entities/annotations/markup/text-annotation";
import { InkAnnotation, InkAnnotationDto } from "./entities/annotations/markup/ink-annotation";

import { SquareAnnotation, SquareAnnotationDto } from "./entities/annotations/markup/geometric/square-annotation";
import { CircleAnnotation, CircleAnnotationDto } from "./entities/annotations/markup/geometric/circle-annotation";
import { PolygonAnnotation, PolygonAnnotationDto } from "./entities/annotations/markup/geometric/polygon-annotation";
import { PolylineAnnotation, PolylineAnnotationDto } from "./entities/annotations/markup/geometric/polyline-annotation";
import { LineAnnotation, LineAnnotationDto } from "./entities/annotations/markup/geometric/line-annotation";

import { TextMarkupAnnotationDto } from "./entities/annotations/markup/text-markup/text-markup-annotation";
import { HighlightAnnotation } from "./entities/annotations/markup/text-markup/highlight-annotation";
import { UnderlineAnnotation } from "./entities/annotations/markup/text-markup/underline-annotation";
import { StrikeoutAnnotation } from "./entities/annotations/markup/text-markup/strikeout-annotation";
import { SquigglyAnnotation } from "./entities/annotations/markup/text-markup/squiggly-annotation";
import { FreeTextAnnotation } from "./entities/annotations/markup/free-text-annotation";

export class AnnotationParseFactory {
  static ParseAnnotationFromInfo(info: ParseInfo): AnnotationDict {
    const annotationType = info.parser.parseDictSubtype(info.bounds);
    let annot: ParseResult<AnnotationDict>;
    switch (annotationType) {
      case annotationTypes.STAMP:
        annot = StampAnnotation.parse(info);
        break;     
      case annotationTypes.TEXT:
        annot = TextAnnotation.parse(info);
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
      case annotationTypes.POLYGON:
        annot = PolygonAnnotation.parse(info);
        break;
      case annotationTypes.POLYLINE:
        annot = PolylineAnnotation.parse(info);
        break;
      case annotationTypes.LINE:
        annot = LineAnnotation.parse(info);
        // DEBUG
        // console.log(info.parser.sliceChars(info.bounds.start, info.bounds.end));        
        console.log(annot);
        break;
      case annotationTypes.HIGHLIGHT:
        annot = HighlightAnnotation.parse(info);
        break;
      case annotationTypes.SQUIGGLY:
        annot = SquigglyAnnotation.parse(info);
        break;
      case annotationTypes.STRIKEOUT:
        annot = StrikeoutAnnotation.parse(info);
        break;
      case annotationTypes.UNDERLINE:
        annot = UnderlineAnnotation.parse(info);
        break; 
      case annotationTypes.FREE_TEXT:
        annot = FreeTextAnnotation.parse(info);
        // DEBUG
        // console.log(info.parser.sliceChars(info.bounds.start, info.bounds.end));        
        console.log(annot);
        break;
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
      case "/Text":
        annotation = TextAnnotation.createFromDto(dto as TextAnnotationDto);
        break;
      case "/Ink":
        annotation = InkAnnotation.createFromDto(dto as InkAnnotationDto);
        break;
      case "/Square":        
        annotation = SquareAnnotation.createFromDto(dto as SquareAnnotationDto);
        break;
      case "/Circle":        
        annotation = CircleAnnotation.createFromDto(dto as CircleAnnotationDto);
        break;
      case "/Polygon":        
        annotation = PolygonAnnotation.createFromDto(dto as PolygonAnnotationDto);
        break;
      case "/Polyline":        
        annotation = PolylineAnnotation.createFromDto(dto as PolylineAnnotationDto);
        break;
      case "/Line":        
        annotation = LineAnnotation.createFromDto(dto as LineAnnotationDto);
        break;
      case "/Highlight":        
        annotation = HighlightAnnotation.createFromDto(dto as TextMarkupAnnotationDto);
        break;
      case "/Squiggly":        
        annotation = SquigglyAnnotation.createFromDto(dto as TextMarkupAnnotationDto);
        break;
      case "/Strikeout":        
        annotation = StrikeoutAnnotation.createFromDto(dto as TextMarkupAnnotationDto);
        break;
      case "/Underline":        
        annotation = UnderlineAnnotation.createFromDto(dto as TextMarkupAnnotationDto);
        break;
      default:
        throw new Error(`Unsupported annotation type: ${dto.annotationType}`);
    }
    return annotation;
  }
}
