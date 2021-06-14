
import { Quadruple } from "./types";

export interface TextLineData {
  text: string;
  rect: Quadruple;
  relativeRect: Quadruple;
}

export interface TextData {
  width: number;
  height: number;
  rect: Quadruple;
  relativeRect: Quadruple;
  lines: TextLineData[];
}

export interface TextDataOptions {
  maxWidth: number;
  fontSize: number;
  textAlign: "left" | "center" | "right";
  pivotPoint: "top-left" | "center" | "bottom-margin";
}
