export type ListenerLike = (this: HTMLElement, e: any) => any;

export class ElementEventController {
  private _element: HTMLElement;
  get element(): HTMLElement {
    return this._element;
  }

  private readonly _eventMap = new Map<keyof HTMLElementEventMap, Set<ListenerLike>>();

  constructor(container: HTMLElement) {
    if (!container) {
      throw new Error("Container is not defined");
    }

    // create a hidden zero-sized element for receiving events
    const element = document.createElement("div");
    element.style.position = "absolute";
    element.style.width = "0";
    element.style.height = "0";
    element.style.zIndex = "-1000";

    container.append(element);
    this._element = element;
  }

  destroy() {
    this.removeAllListeners();
    this._element.remove();
    this._element = null;
  }

  addListener<K extends keyof HTMLElementEventMap>(key: K, 
    listener: (this: HTMLElement, e: HTMLElementEventMap[K]) => any, 
    options?: boolean | AddEventListenerOptions) {
    if (!this._element) {
      return;
    }

    this._element.addEventListener(key, listener, options);

    if (this._eventMap.has(key)) {
      this._eventMap.get(key).add(listener);
    } else {
      this._eventMap.set(key, new Set<(this: HTMLElement, e: any) => any>().add(listener));
    }
  }

  removeListener(key: keyof HTMLElementEventMap, listener: ListenerLike) {
    if (!this._element) {
      return;
    }

    this._element.removeEventListener(key, listener);

    if (this._eventMap.has(key)) {
      this._eventMap.get(key).delete(listener);
    }
  }
  
  removeAllListenersForKey(key: keyof HTMLElementEventMap) {
    if (!this._element) {
      return;
    }

    if (this._eventMap.has(key)) {
      const listeners = this._eventMap.get(key);
      listeners.forEach(x => this._element.removeEventListener(key, x));
      this._eventMap.delete(key);
    }
  }
    
  removeAllListeners() {
    if (!this._element) {
      return;
    }

    this._eventMap.forEach((v, k) => {
      v.forEach(x => this._element.removeEventListener(k, x));
    });
    this._eventMap.clear();
  }

  getListenersByKey(key: keyof HTMLElementEventMap): ListenerLike[] {
    const listenerSet = this._eventMap.get(key);
    return listenerSet
      ? [...listenerSet]
      : [];
  }
  
  hasListenersForKey(key: keyof HTMLElementEventMap): boolean {
    const listenerSet = this._eventMap.get(key);
    return !!listenerSet.size;
  }

  dispatchEvent<K extends keyof HTMLElementEventMap>(e: HTMLElementEventMap[K]) {
    if (!this._element) {
      return;
    }

    if (!this.hasListenersForKey) {
      // dispatch event only if the corresponding listeners are present
      return;
    }

    this._element.dispatchEvent(e);
  }
}
