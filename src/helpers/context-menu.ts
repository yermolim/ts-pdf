import { Vec2 } from "../math";

export class ContextMenu {
  private _container: HTMLDivElement;
  private _shown: boolean;

  private _content: HTMLElement[];
  set content(value: HTMLElement[]) {
    this._content?.forEach(x => x.remove());
    if (value?.length) {
      value.forEach(x => this._container.append(x));
      this._content = value;
    } else {
      this._content = null;
    }
  }
  
  constructor() {
    this._container = document.createElement("div");
    this._container.id = "context-menu";
    this.hide();
    document.addEventListener("pointerdown", this.onPointerDownOutside);
  }

  /**free the resources that can prevent garbage to be collected */
  destroy() {
    this.clear();
    document.removeEventListener("pointerdown", this.onPointerDownOutside);
  }

  /**
   * append the context menu to the specified parent element and move it to the specified position 
   * @param pointerPosition position relative to the viewport (clientX, clientY)
   * @param parent HTMLElement to attach the menu to
   */
  show(pointerPosition: Vec2, parent: HTMLElement) {
    parent.append(this._container);
    this._shown = true;
    setTimeout(() => {
      this.setContextMenuPosition(pointerPosition, parent);      
      this._container.style.opacity = "1";
    }, 0);
  }

  /**remove the menu from DOM */
  hide() {
    this._container.style.opacity = "0";
    this._container.remove();
    this._shown = false;
  }

  /**clear the menu content and remove the menu from DOM */
  clear() {    
    this.hide();
    this.content = null;
  }

  private onPointerDownOutside = (e: PointerEvent) => {
    if (!this._shown) {
      return;
    }
    const target = e.composedPath()[0] as HTMLElement;
    if (!target.closest("#context-menu")) {
      // the pointer is outside of the menu elementm, hide the menu
      this.hide();
    }
  };

  private setContextMenuPosition(pointerPosition: Vec2, parent: HTMLElement) {
    const menuDimension = new Vec2(this._container.offsetWidth, this._container.offsetHeight);
    const menuPosition = new Vec2();

    const parentRect = parent.getBoundingClientRect();
    const relPointerPosition = new Vec2(pointerPosition.x - parentRect.x, 
      pointerPosition.y - parentRect.y);

    // move the menu to avoid it from being outside the container
    if (relPointerPosition.x + menuDimension.x > parentRect.width + parentRect.x) {
      menuPosition.x = relPointerPosition.x - menuDimension.x;
    } else {
      menuPosition.x = relPointerPosition.x;
    }
    if (relPointerPosition.y + menuDimension.y > parentRect.height + parentRect.y) {
      menuPosition.y = relPointerPosition.y - menuDimension.y;
    } else {
      menuPosition.y = relPointerPosition.y;
    }

    this._container.style.left = menuPosition.x + "px";
    this._container.style.top = menuPosition.y + "px";
  }
}
