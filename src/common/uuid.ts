import { v4 as uuidV4 } from "uuid";

/* eslint-disable no-bitwise */
export function getRandomUuid(): string {
  // return crypto.getRandomValues(new Uint32Array(4)).join("-");
  return uuidV4();
}
