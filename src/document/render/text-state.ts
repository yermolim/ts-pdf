import { TextRenderMode, textRenderModes } from "../const";

export interface TextStateParams {  
  fontFamily?: string;
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
  textHorScale?: number; // svg attr. transform="scale(n, 1)" | combine with matrix?
  textRenderMode?: TextRenderMode;
  /**
   * 1 PDF unit = 0.1em
   */
  textVertAlign?: string;
  textKnockOut?: boolean;
}

export class TextState {
  static readonly defaultParams: TextStateParams = {
    fontFamily: "helvetica, sans-serif",
    fontSize: "12px",
    lineHeight: "1",
    letterSpacing: "normal",
    wordSpacing: "normal",
    textHorScale: 1,
    textRenderMode: textRenderModes.FILL,
    textVertAlign: "0",
    textKnockOut: true,
  };

  fontFamily: string;
  fontSize: string;
  lineHeight: string;
  letterSpacing: string;
  wordSpacing: string;
  textHorScale: number;
  textRenderMode: TextRenderMode;
  textVertAlign: string;
  textKnockOut: boolean;

  constructor(params?: TextStateParams) {
    params = params
      ? Object.assign({}, TextState.defaultParams, params)
      : TextState.defaultParams;

    this.fontFamily = params.fontFamily;
    this.fontSize = params.fontSize;
    this.lineHeight = params.lineHeight;
    this.letterSpacing = params.letterSpacing;
    this.wordSpacing = params.wordSpacing;
    this.textHorScale = params.textHorScale;
    this.textRenderMode = params.textRenderMode;
    this.textVertAlign = params.textVertAlign;
    this.textKnockOut = params.textKnockOut;
  }
}
