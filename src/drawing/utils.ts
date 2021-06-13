import { Vec2, Mat3 } from "mathador";
import { Hextuple, Quadruple } from "../common/types";
  
export type CssMixBlendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" 
| "color-dodge" |"color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion";

/**width (in PDF page units) of the transparent lines rendered to simplify annotation selection */
export const selectionStrokeWidth = 20;

/**constant used to imitate circle using four cubic bezier curves */
export const bezierConstant = 0.551915;

export function buildSquigglyLine(start: Vec2, end: Vec2, maxWaveSize: number): Vec2[] {
  if (!start || !end) {
    // endpoints are not defined
    return null;
  }
  if (isNaN(maxWaveSize) || maxWaveSize <= 0) {
    throw new Error(`Invalid maximal squiggle size ${maxWaveSize}`);
  }
  
  const lineLength = Vec2.subtract(start, end).getMagnitude();
  if (!lineLength) {
    // the line has a zero length
    return null;
  }
  
  const resultPoints: Vec2[] = [start.clone()];

  const zeroVec = new Vec2();
  const lengthVec = new Vec2(lineLength, 0);
  // get the matrix to transform the 'cloudy' line to the same position the source line has
  const matrix = Mat3.from4Vec2(zeroVec, lengthVec, start, end);    
  
  const waveCount = Math.ceil(lineLength / maxWaveSize);
  const waveSize = lineLength / waveCount;
  const halfWaveSize = waveSize / 2;
  for (let i = 0; i < waveCount; i++) {
    resultPoints.push(
      new Vec2(i * waveSize + halfWaveSize, -halfWaveSize).applyMat3(matrix).truncate(2), // top point
      new Vec2((i + 1) * waveSize, 0).applyMat3(matrix).truncate(2), // bottom point
    );
  }

  return resultPoints;
}

/**
 * calculate the transformation matrix between the stream bounding box and the specified AABB
 * @param bBox source AABB in the page coordinate system
 * @param rect target AABB coordinates in the page coordinate system
 * @param matrix optional transformation from the source AABB to properly oriented BB
 * @returns transformation matrices (matAA is the final matrix)
 */
export function calcPdfBBoxToRectMatrices(bBox: Quadruple, rect: Quadruple, matrix?: Hextuple): 
{matAP: Mat3; matA: Mat3; matAA: Mat3} {          
  const matAP = new Mat3();
  if (matrix) {
    const [m0, m1, m3, m4, m6, m7] = matrix;
    matAP.set(m0, m1, 0, m3, m4, 0, m6, m7, 1);
  } 
  const bBoxLL = new Vec2(bBox[0], bBox[1]);
  const bBoxLR = new Vec2(bBox[2], bBox[1]);
  const bBoxUR = new Vec2(bBox[2], bBox[3]);
  const bBoxUL = new Vec2(bBox[0], bBox[3]);
  /*
    The appearance’s bounding box (specified by its BBox entry) is transformed, 
    using Matrix, to produce a quadrilateral with arbitrary orientation. 
    The transformed appearance box is the smallest upright rectangle 
    that encompasses this quadrilateral.
    */
  const {min: appBoxMin, max: appBoxMax} = Vec2.minMax(
    Vec2.applyMat3(bBoxLL, matAP),
    Vec2.applyMat3(bBoxLR, matAP), 
    Vec2.applyMat3(bBoxUR, matAP),
    Vec2.applyMat3(bBoxUL, matAP), 
  );
    /*
    A matrix A is computed that scales and translates the transformed appearance box 
    to align with the edges of the annotation’s rectangle (specified by the Rect entry). 
    A maps the lower-left corner (the corner with the smallest x and y coordinates) 
    and the upper-right corner (the corner with the greatest x and y coordinates) 
    of the transformed appearance box to the corresponding corners of the annotation’s rectangle
    */   
  const rectMin = new Vec2(rect[0], rect[1]);
  const rectMax = new Vec2(rect[2], rect[3]);
  const matA = Mat3.from4Vec2(appBoxMin, appBoxMax, rectMin, rectMax);
  /*
    Matrix is concatenated with A to form a matrix AA that maps from 
    the appearance’s coordinate system to the annotation’s rectangle in default user space
    */
  const matAA = Mat3.fromMat3(matAP).multiply(matA);

  // DEBUG
  // console.log(matAP.toFloatShortArray());
  // console.log(matA.toFloatShortArray());
  // console.log(matAA.toFloatShortArray());    

  return {matAP, matA, matAA};
}

export interface BBox {
  ll: Vec2; 
  lr: Vec2; 
  ur: Vec2; 
  ul: Vec2;
}

export type VecMinMax = readonly [min: Vec2, max: Vec2];
