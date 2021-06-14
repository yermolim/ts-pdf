export interface Reference {  
  id: number;
  generation: number;
}

export interface UsedReference extends Reference {
  byteOffset: number;
  compressed?: boolean;
  streamId?: number;
  streamIndex?: number;
}

export interface FreeReference extends Reference {
  nextFreeId: number;
}
