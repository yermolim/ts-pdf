export interface Reference {  
  id: number;
  generation: number;
}

export interface Encodable {  
  toArray(): Uint8Array;
}
