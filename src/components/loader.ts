import { loaderHtml } from "../assets/index.html";
import { htmlToElements } from "../common/dom";

export class Loader {
  protected readonly _loaderElement: HTMLElement;

  protected _isShown: boolean;

  constructor() {    
    this._loaderElement = htmlToElements(loaderHtml)[0];
  }

  show(parent: HTMLElement, zIndex = 8) {
    if (this._isShown || !parent) {
      return;
    }

    this._loaderElement.style.zIndex = zIndex + "";
    this._loaderElement.style.top = parent.scrollTop + "px";
    this._loaderElement.style.left = parent.scrollLeft + "px";
    parent.append(this._loaderElement);
    this._isShown = true;
  }

  hide() {
    this._loaderElement.remove();
    this._isShown = false;
  }
}
