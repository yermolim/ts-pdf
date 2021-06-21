import { Quadruple } from "../../common/types";
import { CryptInfo } from "../encryption/interfaces";
import { ObjectType } from "../spec-constants";
import { DataParser, Bounds } from "./data-parser";

/**information used for parsing PDF object */
export interface ParseInfo {
  /** parser instance used to parse the object */
  parser: DataParser;
  /** object indices in the parser data array */
  bounds: Bounds;
  /** encryption info (only for encrypted PDF files) */
  cryptInfo?: CryptInfo;
  /** parent object stream id */
  streamId?: number;
  /** PDF object type */
  type?: ObjectType;
  /** parsed value (only for primitive objects which are parsed in place) */
  value?: any;
  /** max object rendering bounds */
  rect?: Quadruple;
  /** a function used to get ParseInfo for indirect objects */
  parseInfoGetter?: (id: number) => ParseInfo;
}
