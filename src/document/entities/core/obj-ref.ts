export class ObjRef {
  /** A positive integer object number */
  readonly id: number;
  /** A non-negative integer generation number. 
   * In a newly created file, all indirect objects 
   * shall have generation numbers of 0. 
   * Nonzero generation numbers may be introduced 
   * when the file is later updated */
  readonly generation: number;

  readonly reused: boolean;

  constructor(id: number, generation: number, reused: boolean) {
    this.id = id ?? 0;
    this.generation = generation ?? 0;
    this.reused = reused;
  }

  toArray(): Uint8Array {
    return new TextEncoder().encode(`${this.id} ${this.generation} R`);
  }
}
