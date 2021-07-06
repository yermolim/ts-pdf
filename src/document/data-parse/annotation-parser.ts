import { AnnotationDto } from "../../common/annotation";

import { annotationTypes } from "../spec-constants";
import { ParserResult } from "./data-parser";
import { ParserInfo } from "./parser-info";

import { FontDict } from "../entities/appearance/font-dict";
import { AnnotationDict } from "../entities/annotations/annotation-dict";
import { StampAnnotation, StampAnnotationDto } from "../entities/annotations/markup/stamp-annotation";
import { TextAnnotation, TextAnnotationDto } from "../entities/annotations/markup/text-annotation";
import { InkAnnotation, InkAnnotationDto } from "../entities/annotations/markup/ink-annotation";
import { SquareAnnotation, SquareAnnotationDto } from "../entities/annotations/markup/geometric/square-annotation";
import { CircleAnnotation, CircleAnnotationDto } from "../entities/annotations/markup/geometric/circle-annotation";
import { PolygonAnnotation, PolygonAnnotationDto } from "../entities/annotations/markup/geometric/polygon-annotation";
import { PolylineAnnotation, PolylineAnnotationDto } from "../entities/annotations/markup/geometric/polyline-annotation";
import { LineAnnotation, LineAnnotationDto } from "../entities/annotations/markup/geometric/line-annotation";
import { TextMarkupAnnotationDto } from "../entities/annotations/markup/text-markup/text-markup-annotation";
import { HighlightAnnotation } from "../entities/annotations/markup/text-markup/highlight-annotation";
import { UnderlineAnnotation } from "../entities/annotations/markup/text-markup/underline-annotation";
import { StrikeoutAnnotation } from "../entities/annotations/markup/text-markup/strikeout-annotation";
import { SquigglyAnnotation } from "../entities/annotations/markup/text-markup/squiggly-annotation";
import { FreeTextAnnotation } from "../entities/annotations/markup/free-text-annotation";

export class AnnotationParser {

  static async ParseAnnotationFromInfoAsync(info: ParserInfo, 
    fontMap: Map<string, FontDict>): Promise<AnnotationDict> {
    const annotationType = info.parser.parseDictSubtype(info.bounds);
    let annot: ParserResult<AnnotationDict>;
    switch (annotationType) {
      case annotationTypes.STAMP:
        annot = await StampAnnotation.parseAsync(info);
        break;     
      case annotationTypes.TEXT:
        annot = await TextAnnotation.parseAsync(info);
        break;
      case annotationTypes.INK:
        annot = await InkAnnotation.parseAsync(info);
        break;
      case annotationTypes.SQUARE:
        annot = await SquareAnnotation.parseAsync(info);
        break;
      case annotationTypes.CIRCLE:
        annot = await CircleAnnotation.parseAsync(info);
        break;
      case annotationTypes.POLYGON:
        annot = await PolygonAnnotation.parseAsync(info);
        break;
      case annotationTypes.POLYLINE:
        annot = await PolylineAnnotation.parseAsync(info);
        break;
      case annotationTypes.LINE:
        annot = await LineAnnotation.parseAsync(info, fontMap);
        break;
      case annotationTypes.HIGHLIGHT:
        annot = await HighlightAnnotation.parseAsync(info);
        break;
      case annotationTypes.SQUIGGLY:
        annot = await SquigglyAnnotation.parseAsync(info);
        break;
      case annotationTypes.STRIKEOUT:
        annot = await StrikeoutAnnotation.parseAsync(info);
        break;
      case annotationTypes.UNDERLINE:
        annot = await UnderlineAnnotation.parseAsync(info);
        break; 
      case annotationTypes.FREE_TEXT:
        annot = await FreeTextAnnotation.parseAsync(info, fontMap);
        break;
      default:
        break;
    }

    return annot?.value;;
  }

  static async ParseAnnotationFromDtoAsync(dto: AnnotationDto, 
    fontMap: Map<string, FontDict>): Promise<AnnotationDict> {
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
        annotation = await LineAnnotation.createFromDtoAsync(dto as LineAnnotationDto, fontMap);
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
