import { mat3From4Vec2, Vec2 } from "../../common/math";
import { getRandomUuid } from "../../common/uuid";

import { DocumentData } from "../../document/document-data";
import { LineAnnotation, LineAnnotationDto, 
  lineIntents } from "../../document/entities/annotations/markup/geometric/line-annotation";
import { lineEndingTypes } from "../../document/const";

import { PageView } from "../../components/pages/page-view";
import { GeometricAnnotatorOptions } from "./geometric-annotator";
import { GeometricLineAnnotator } from "./geometric-line-annotator";

export class GeometricArrowAnnotator extends GeometricLineAnnotator {  
  constructor(docData: DocumentData, parent: HTMLDivElement, 
    pages: PageView[], options?: GeometricAnnotatorOptions) {
    super(docData, parent, pages, options || {});
  }
   
  protected redrawLine(min: Vec2, max: Vec2) {
    this._svgGroup.innerHTML = "";

    const [r, g, b, a] = this._color || [0, 0, 0, 1];
    this._vertices = [min.x, min.y, max.x, max.y];

    const start = new Vec2(min.x, min.y);
    const end = new Vec2(max.x, max.y);
    const xAlignedStart = new Vec2();
    const xAlignedEnd = new Vec2(Vec2.substract(end, start).getMagnitude(), 0);
    const mat = mat3From4Vec2(xAlignedStart, xAlignedEnd, start, end);

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", `rgba(${r * 255},${g * 255},${b * 255},${a})`);
    path.setAttribute("stroke-width", this._strokeWidth + "");
    path.setAttribute("stroke-linecap", "square"); 

    // draw a line
    let pathString = `M ${xAlignedStart.x},${xAlignedStart.y} L ${xAlignedEnd.x},${xAlignedEnd.y}`;
    // draw an arrow
    const arrowSize = Math.max(this._strokeWidth * LineAnnotation.lineEndingMultiplier, 
      LineAnnotation.lineEndingMinimalSize);
    pathString += ` M ${xAlignedEnd.x - arrowSize},${xAlignedEnd.y + arrowSize / 2}`;
    pathString += ` L ${xAlignedEnd.x},${xAlignedEnd.y}`;
    pathString += ` L ${xAlignedEnd.x - arrowSize},${xAlignedEnd.y - arrowSize / 2}`;
    path.setAttribute("d", pathString);
    // transform the line to it's target position
    path.setAttribute("transform", `matrix(${mat.toFloatShortArray().join(" ")})`);

    this._svgGroup.append(path);
  }
  
  protected buildAnnotationDto(): LineAnnotationDto {
    const nowString = new Date().toISOString();
    const dto: LineAnnotationDto = {
      uuid: getRandomUuid(),
      annotationType: "/Line",
      pageId: null,

      dateCreated: nowString,
      dateModified: nowString,
      author: this._docData.userName || "unknown",

      rect: null,
      vertices: this._vertices,
      intent: lineIntents.ARROW,
      endingType: [lineEndingTypes.NONE, lineEndingTypes.ARROW_OPEN],

      color: this._color,
      strokeWidth: this._strokeWidth,
      strokeDashGap: null,
    };

    return dto;
  }
}

