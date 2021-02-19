import { Mat3 } from "../../math";
import { TextRenderMode, textRenderModes } from "../const";

export class GraphicsState {
  matrix: Mat3;

  stroke = "black";
  fill = "black";
  clipPath: SVGClipPathElement;

  fontFamily: string;
  fontSize: string;
  /**
   * 1 PDF unit = 1px?
   */
  lineHeight: string;
  /**
   * 1 PDF unit = 1px?
   */
  letterSpacing: string; // svg attr
  /**
   * 1 PDF unit = 1px?
   */
  wordSpacing: string; // svg attr
  /**
   * 100 PDF units = 1
   */
  textHorScale: number; // svg attr. transform="scale(n, 1)" | combine with matrix?
  textRenderMode: TextRenderMode = textRenderModes.FILL;
  /**
   * 1 PDF unit = 0.1em
   */
  textVertAlign: string;
  textKnockOut = true;
}
