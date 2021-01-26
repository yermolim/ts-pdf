export function getRandomUuid(): string {
  return crypto.getRandomValues(new Uint32Array(4)).join("-");
}

export function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(v, max));
}

export interface Position {
  x: number;
  y: number;
}
