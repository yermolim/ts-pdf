import { Mat3, Vec2 } from "../../math";
import { TextState } from "./text-state";

export interface GraphicsStateParams {  
  matrix?: Mat3;
  textState?: TextState;
  clipPath?: SVGClipPathElement;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
  strokeMiterLimit?: number;
  strokeLineCap?: "butt" | "round" | "square";
  strokeLineJoint?: "bevel" | "miter" | "round";
  strokeDashArray?: string;
  mixBlendMode?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" 
  | "color-dodge" |" color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion";
}

export class GraphicsState {
  static readonly defaultParams: GraphicsStateParams = {
    matrix: new Mat3(),
    stroke: "black",
    fill: "black",
    textState: new TextState(),
    strokeWidth: 1,
    strokeMiterLimit: 10,
    strokeLineCap: "square",
    strokeLineJoint: "miter",
  };
  
  matrix: Mat3;

  textState: TextState;

  clipPath: SVGClipPathElement;
  stroke: string;
  fill: string;

  strokeWidth: number;
  strokeMiterLimit: number;
  strokeLineCap: "butt" | "round" | "square";
  strokeLineJoint: "bevel" | "miter" | "round";
  strokeDashArray: string;

  mixBlendMode: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" 
  | "color-dodge" |" color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion";

  constructor(params?: GraphicsStateParams) {
    params = params
      ? Object.assign({}, GraphicsState.defaultParams, params)
      : GraphicsState.defaultParams;

    this.matrix = params.matrix;
    this.textState = params.textState;
    this.clipPath = params.clipPath;
    this.stroke = params.stroke;
    this.fill = params.fill;
  }
}
