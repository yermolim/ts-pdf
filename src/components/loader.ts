import { loaderHtml } from "../assets/index.html";

export class Loader {
  protected readonly _container: HTMLElement;

  protected _isShown: boolean;

  constructor() {    
    const dialogContainer = document.createElement("div");
    dialogContainer.id = "text-dialog";
    dialogContainer.classList.add("full-size-overlay");
    dialogContainer.innerHTML = loaderHtml;    
    this._container = dialogContainer;
  }

  show(parent: HTMLElement, zIndex = 8) {
    if (this._isShown || !parent) {
      return;
    }

    this._container.style.zIndex = zIndex + "";
    this._container.style.top = parent.scrollTop + "px";
    this._container.style.left = parent.scrollLeft + "px";
    parent.append(this._container);
    this._isShown = true;
  }

  hide() {
    this._container.remove();
    this._isShown = false;
  }
}
