export function getRandomUuid(): string {
  return crypto.getRandomValues(new Uint32Array(4)).join("-");
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(v, max));
}

export function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

export function getCenter(x1: number, y1: number, x2: number, y2: number): Position {
  return {
    x: (x2 + x1) / 2,
    y: (y2 + y1) / 2,
  };
}

export function parseIntFromBytes(bytes: Uint8Array): number {
  if (!bytes?.length) {
    return 0;
  }
  if (bytes.length === 1) {
    return bytes[0];
  }
  const hex = Array.from(bytes, (byte) => 
    // eslint-disable-next-line no-bitwise
    ("0" + (byte & 0xFF).toString(16)).slice(-2)).join("");
  return parseInt(hex, 16);
}

export function int8ToBytes(int: number): Uint8Array {
  const buffer = new ArrayBuffer(1);
  const view = new DataView(buffer);
  view.setInt8(0, int);
  return new Uint8Array(buffer);
}

export function int16ToBytes(int: number): Uint8Array {
  const buffer = new ArrayBuffer(2);
  const view = new DataView(buffer);
  view.setInt16(0, int, false);
  return new Uint8Array(buffer);
}

export function int32ToBytes(int: number): Uint8Array {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setInt32(0, int, false);
  return new Uint8Array(buffer);
}

export interface Position {
  x: number;
  y: number;
}
