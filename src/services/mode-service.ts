
export const viewerModes = ["text", "hand", "annotation", "comparison"] as const;
export type ViewerMode =  typeof viewerModes[number];

export interface ModeServiceOptions {
  disabledModes?: ViewerMode[];
}

export class ModeService {  
  public readonly enabledModes: readonly ViewerMode[];

  private _mode: ViewerMode;  
  get mode(): ViewerMode {
    return this._mode;
  }
  set mode(value: ViewerMode) {
    // close an opened dialog if present
    if (this._onModeChangeStarted?.size) {
      this._onModeChangeStarted.forEach(x => x());
    }
    if (!value || value === this._mode) {
      return;
    }
    this._mode = value;
  }

  private _onModeChangeStarted = new Set<() => void>();

  constructor(options?: ModeServiceOptions) {
    const modes: ViewerMode[] = [];
    viewerModes.forEach(x => {
      if (!options?.disabledModes?.length
        || !options.disabledModes.includes(x)) {
        modes.push(x);
      }
    });
    if (!modes.length) {
      throw new Error("All viewer modes are disabled");
    }
    this.enabledModes = modes;
  }

  addOnModeChangeStarted(action: () => void) {
    this._onModeChangeStarted.add(action);
  }  

  removeOnModeChangeStarted(action: () => void) {
    this._onModeChangeStarted.delete(action);
  }
}
