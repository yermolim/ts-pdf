export class ObjRef {
  /** A positive integer object number */
  id: number;
  /** A non-negative integer generation number. 
   * In a newly created file, all indirect objects 
   * shall have generation numbers of 0. 
   * Nonzero generation numbers may be introduced 
   * when the file is later updated */
  generation: number;

  constructor() {
  }
}
