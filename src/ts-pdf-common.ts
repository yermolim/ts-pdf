export function getRandomUuid(): string {
  return crypto.getRandomValues(new Uint32Array(4)).join("-");
}
