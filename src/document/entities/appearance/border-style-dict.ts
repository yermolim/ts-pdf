import { dictTypes } from "../../common/const";
import { Dict } from "../core/dict";

/**
 * Flags  specifying  various  characteristics of the annotation
 */
export const borderStyles = {
  SOLID: "/S",
  DASHED: "/D",
  BEVELED: "/B",
  INSET: "/I",
  UNDERLINE: "/U",
};

export class BorderStyleDict extends Dict {
  /**(Optional) The border width in points. 
   * If this value is 0, no border shall drawn */
  W = 1;
  /**(Optional) The border style */
  S = borderStyles.SOLID;
  /**(Optional) A dash array defining a pattern of dashes and gaps 
   * that shall beused in drawing a dashed border. [dash gap] */
  D = [3];
  
  constructor() {
    super(dictTypes.BORDER_STYLE);
  }
}
