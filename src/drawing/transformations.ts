import { Mat3 } from "mathador";

export function applyFlipYToElement(element: HTMLElement | SVGElement) {  
  setTransformationToElement(element, getVerticalMirrorCssTransformation());
}

export function applyMatrixToElement(element: HTMLElement | SVGElement, matrix: Mat3) {  
  const matrixString = `matrix(${matrix.toFloatShortArray().join(", ")})`;
  setTransformationToElement(element, matrixString);
}

export function applyTranslateRotateToElement(element: HTMLElement | SVGElement, x: number, y: number, r: number) {
  // NOTE: kept this one as an attribute for now. Conssider swithing to using style if any issues with iOS/Safari arise
  element.setAttribute("transform", `translate(${x} ${y}) rotate(${-r})`);
}

function setTransformationToElement(element: HTMLElement | SVGElement, transformation: string) {  
  element.style["transform"] = transformation;
  element.style["-webkit-transform"] = transformation;
}

function getVerticalMirrorCssTransformation(): string {
  return "matrix(1, 0, 0, -1, 0, 0)"; // scale(1, -1) can be used as well if any issues with iOS/Safari arise
}
