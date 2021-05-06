import { Mat3, Vec3 } from "../../common/math";
import { TextState } from "./text-state";

export interface GraphicsStateParams {  
  matrix?: Mat3;
  textState?: TextState;
  clipPath?: SVGClipPathElement;

  strokeColorSpace?: "grayscale" | "rgb" | "cmyk"; 
  strokeAlpha?: number; 
  strokeColor?: Vec3;
  fillColorSpace?: "grayscale" | "rgb" | "cmyk";
  fillAlpha?: number; 
  fillColor?: Vec3;

  strokeWidth?: number;
  strokeMiterLimit?: number;
  strokeLineCap?: "butt" | "round" | "square";
  strokeLineJoin?: "bevel" | "miter" | "round";
  strokeDashArray?: string;
  strokeDashOffset?: number;

  mixBlendMode?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" 
  | "color-dodge" |"color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion";
}

/**graphics state used in appearance streams */
export class GraphicsState {
  static readonly defaultParams: GraphicsStateParams = {
    matrix: new Mat3(),
    textState: new TextState(),
    
    strokeColorSpace: "rgb",
    strokeAlpha: 1,
    strokeColor: new Vec3(),
    fillColorSpace: "rgb", 
    fillAlpha: 1,
    fillColor: new Vec3(),
    
    strokeWidth: 1,
    strokeMiterLimit: 10,
    strokeLineCap: "square",
    strokeLineJoin: "miter",    
  };
  
  matrix: Mat3;
  textState: TextState;
  clipPath: SVGClipPathElement;

  strokeColorSpace: "grayscale" | "rgb" | "cmyk";
  strokeAlpha: number;  
  strokeColor: Vec3; 
  /**stroke color string */
  get stroke(): string {
    const {x: r, y: g, z: b} = this.strokeColor;
    const a = this.strokeAlpha;
    return `rgba(${r},${g},${b},${a})`;
  }
  fillColorSpace: "grayscale" | "rgb" | "cmyk"; 
  fillAlpha: number; 
  fillColor: Vec3; 
  /**fill color string */
  get fill(): string {
    const {x: r, y: g, z: b} = this.fillColor;
    const a = this.fillAlpha;
    return `rgba(${r},${g},${b},${a})`;
  }

  strokeWidth: number;
  strokeMiterLimit: number;
  strokeLineCap: "butt" | "round" | "square";
  strokeLineJoin: "bevel" | "miter" | "round";
  strokeDashArray: string;
  strokeDashOffset: number;

  mixBlendMode: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" 
  | "color-dodge" |"color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion";

  constructor(params?: GraphicsStateParams) {
    Object.assign(this, GraphicsState.defaultParams, params);

    this.matrix = this.matrix?.clone();
    this.textState = this.textState?.clone();
    this.strokeColor = this.strokeColor?.clone();
    this.fillColor = this.fillColor?.clone();
  }

  clone(params?: GraphicsStateParams): GraphicsState { 
    const copy = new GraphicsState(this);
    if (params) {
      return Object.assign(copy, params);
    }
    return copy;
  }

  setColor(type: "stroke" | "fill", ...params: number[]) {
    let r: number, g: number, b: number;
    switch (params.length) {
      case 1: // grayscale
        r = g = b = params[0] * 255;
        break;
      case 3: // rgb
        r = params[0] * 255;
        g = params[1] * 255;
        b = params[2] * 255;
        break;
      case 4: // cmyk
        // TODO: implement conversion using some ICC profile?
        const [c, m, y, k] = params; 
        r = 255 * (1 - c) * (1 - k);
        g = 255 * (1 - m) * (1 - k);
        b = 255 * (1 - y) * (1 - k);
        break;
    }       
    if (type === "stroke") {
      this.strokeColor.set(r, g, b);
    } else {      
      this.fillColor.set(r, g, b);
    }
  }
}
