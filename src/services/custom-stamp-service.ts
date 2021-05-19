import { CustomStampCreationInfo } from "../common/drawing";

import { ElementEventService } from "./element-event-service";

//#region custom events
export const customStampEvent = "tspdf-customstampchange" as const;

export interface CustomStampEventDetail {
  type: "add" | "delete";
  stamp: CustomStampCreationInfo;
}

export class CustomStampEvent extends CustomEvent<CustomStampEventDetail> {
  constructor(detail: CustomStampEventDetail) {
    super(customStampEvent, {detail});
  }
}

declare global {
  interface HTMLElementEventMap {
    [customStampEvent]: CustomStampEvent;
  }
}
//#endregion


export class CustomStampService {
  private readonly _container: HTMLElement;
  private readonly _eventService: ElementEventService;

  private readonly _customStampsByType = new Map<string, CustomStampCreationInfo>();
  private readonly _fileInput: HTMLInputElement;

  constructor(container: HTMLElement, eventService: ElementEventService) {
    if (!container) {
      throw new Error("Container is not defined");
    }
    if (!eventService) {
      throw new Error("Event service is not defined");
    }

    this._container = container;
    this._eventService = eventService;

    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "image/*";
    fileInput.classList.add("abs-hidden");

    this._fileInput = fileInput;
    this._fileInput.addEventListener("change", this.onFileInput);
    this._container.append(this._fileInput);
  }  

  destroy() {
    this._fileInput.remove();
  }

  addCustomStamps(stamps: CustomStampCreationInfo[]) {
    if (stamps?.length) {
      stamps.forEach(x => {
        this._customStampsByType.set(x.type, x);
      });
    }
  }
  
  getCustomStamps(): CustomStampCreationInfo[] {
    return [...this._customStampsByType.values()];
  }
  
  addCustomStamp(stamp: CustomStampCreationInfo) {
    this._customStampsByType.set(stamp.type, stamp);
    this._eventService.dispatchEvent(new CustomStampEvent({
      type: "add",
      stamp: stamp,
    }));
  }
  
  removeCustomStamp(type: string) {
    const stamp = this._customStampsByType.get(type);
    if (!stamp) {
      return;
    }
    this._customStampsByType.delete(type);
    this._eventService.dispatchEvent(new CustomStampEvent({
      type: "delete",
      stamp: stamp,
    }));
  }

  startLoadingImage() {
    this._fileInput.click();
  }
  
  startDrawing() {
    
  }

  private onFileInput() {
    const files = this._fileInput.files;    
    if (files.length === 0) {
      return;
    }

    this.openCreationFromImageOverlay(files[0]);
    this._fileInput.value = null;
  }

  private openCreationFromImageOverlay(file: File) {

  }
}
