import { Mat3 } from "../../common/math";
import { TextRenderMode, textRenderModes } from "../const";

export interface TextStateParams {   
  matrix?: Mat3;  
  lineMatrix?: Mat3;  
  /**
   * Name of a custom PDF font to be used
   */
  customFontName?: string;
  leading?: number;
  renderMode?: TextRenderMode;

  fontFamily?: string;
  /**
   * 1 PDF point = 1px?
   */
  fontSize?: string;
  /**
   * 1 PDF unit = 1px?
   */
  lineHeight?: string;
  /**
   * 1 PDF unit = 1px?
   */
  letterSpacing?: string; // svg attr
  /**
   * 1 PDF unit = 1px?
   */
  wordSpacing?: string; // svg attr
  /**
   * 100 PDF units = 1
   */
  horizontalScale?: number; // svg attr. transform="scale(n, 1)" | combine with matrix?
  /**
   * 1 PDF unit = 0.1em
   */
  verticalAlign?: string;
  knockOut?: boolean;
}

/**text state used in appearance streams */
export class TextState {
  static readonly defaultParams: TextStateParams = {
    matrix: new Mat3(),
    lineMatrix: new Mat3(),
    leading: 12 * -1.2,
    renderMode: textRenderModes.FILL,
    fontFamily: "helvetica, arial, sans-serif",
    fontSize: "12px",
    lineHeight: "1",
    letterSpacing: "normal",
    wordSpacing: "normal",
    horizontalScale: 1,
    verticalAlign: "0",
    knockOut: true,
  };

  matrix: Mat3;
  lineMatrix: Mat3;
  /**
   * Name of a custom PDF font to be used
   */
  customFontName: string;
  leading: number;
  renderMode: TextRenderMode;

  fontFamily: string;  
  /**
   * 1 PDF point = 1px?
   */
  fontSize: string;
  /**
   * 1 PDF unit = 1px?
   */
  lineHeight: string;
  /**
   * 1 PDF unit = 1px?
   */
  letterSpacing: string;
  /**
   * 1 PDF unit = 1px?
   */
  wordSpacing: string;
  /**
   * 100 PDF units = 1
   */
  horizontalScale: number;
  /**
   * 1 PDF unit = 0.1em
   */
  verticalAlign: string;
  knockOut: boolean;

  constructor(params?: TextStateParams) {
    Object.assign(this, TextState.defaultParams, params);
  }

  clone(params?: TextStateParams): TextState {
    const copy = new TextState(this);
    if (params) {
      return Object.assign(copy, params);
    }
    return copy;
  }

  setWordSpacing(value: number) {
    this.wordSpacing = !value
      ? "normal"
      : value + "px";
  }
  setLetterSpacing(value: number) {
    this.letterSpacing = !value
      ? "normal"
      : value + "px";
  }
  setScale(value: number) {    
    this.horizontalScale = !value
      ? 1
      : value / 100;
  }
  setLeading(value: number) {    
    if (value) {
      this.leading = value;
      this.lineHeight = Math.abs(this.leading) + "px";
    } else {
      this.leading = parseInt(this.fontSize, 10) * -1.2;
      this.lineHeight = "1";
    }
  }
  setFontSize(value: number) {    
    this.fontSize = (value || 12) + "px";
  }
  setVerticalAlign(value: number) {    
    this.verticalAlign = !value
      ? "0"
      : value / 10 + "em"; 
  }
  
  moveAlongPx(value: number) {
    // TODO: add support for vertical text         
    // TODO: implement the full formula. now the simplified one is used
    const tx = value;
    const transformationMatrix = new Mat3().set(1, 0, 0, 0, 1, 0, tx, 0, 1);
    this.matrix = transformationMatrix.multiply(this.matrix);
  }

  moveAlongPdfUnits(value: number) {
    // TODO: add support for vertical text         
    // TODO: implement the full formula. now the simplified one is used
    const tx = (-value / 1000) * parseInt(this.fontSize, 10);
    const transformationMatrix = new Mat3().set(1, 0, 0, 0, 1, 0, tx, 0, 1);
    this.matrix = transformationMatrix.multiply(this.matrix);
  }
  
  nextLine(tx?: number, ty?: number) {
    tx ??= 0;
    ty ??= this.leading || parseInt(this.fontSize, 10) * -1.2;

    const translationMatrix = new Mat3().set(1, 0, 0, 0, 1, 0, tx, ty, 1);
    this.lineMatrix = translationMatrix.multiply(this.lineMatrix);
    this.matrix = this.lineMatrix.clone();
  }
}
