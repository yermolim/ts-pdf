import { clamp } from "mathador";

import { ElementEventService } from "./element-event-service";
import { PageView } from "../components/pages/page-view";

//#region custom events
export const currentPageChangeRequestEvent = "tspdf-currentpagechangerequest" as const;
export interface CurrentPageChangeRequestEventDetail {
  pageIndex: number;
}
export class CurrentPageChangeRequestEvent extends CustomEvent<CurrentPageChangeRequestEventDetail> {
  constructor(detail: CurrentPageChangeRequestEventDetail) {
    super(currentPageChangeRequestEvent, {detail});
  }
}

export const currentPageChangeEvent = "tspdf-currentpagechange" as const;
export interface CurrentPageChangeEventDetail {
  oldIndex: number;
  newIndex: number;
}
export class CurrentPageChangeEvent extends CustomEvent<CurrentPageChangeEventDetail> {
  constructor(detail: CurrentPageChangeEventDetail) {
    super(currentPageChangeEvent, {detail});
  }
}

export const pagesLoadedEvent = "tspdf-pagesloaded" as const;
export interface PagesLoadedEventDetail {
  pages: PageView[];
}
export class PagesLoadedEvent extends CustomEvent<PagesLoadedEventDetail> {
  constructor(detail: PagesLoadedEventDetail) {
    super(pagesLoadedEvent, {detail});
  }
}

export const pagesRenderedEvent = "tspdf-pagesrendered" as const;
export interface PagesRenderedEventDetail {
  pages: PageView[];
}
export class PagesRenderedEvent extends CustomEvent<PagesRenderedEventDetail> {
  constructor(detail: PagesRenderedEventDetail) {
    super(pagesRenderedEvent, {detail});
  }
}

export const scaleChangedEvent = "tspdf-scalechanged" as const;
export interface ScaleChangedEventDetail {
  scale: number;
}
export class ScaleChangedEvent extends CustomEvent<ScaleChangedEventDetail> {
  constructor(detail: ScaleChangedEventDetail) {
    super(scaleChangedEvent, {detail});
  }
}

declare global {
  interface HTMLElementEventMap {
    [currentPageChangeEvent]: CurrentPageChangeEvent;
    [currentPageChangeRequestEvent]: CurrentPageChangeRequestEvent;
    [pagesLoadedEvent]: PagesLoadedEvent;
    [pagesRenderedEvent]: PagesRenderedEvent;
    [scaleChangedEvent]: ScaleChangedEvent;
  }
}
//#endregion

//#region utility interfaces
export interface VisiblePageIndices {
  /**indices of actually visible pages */
  actual: number[];
  /**min page index including ones that are subject to preload */
  minFinal: number;
  /**max page index including ones that are subject to preload */
  maxFinal: number;
}

export interface PageServiceOptions {
  /**number of pages that should be prerendered outside view */
  visibleAdjPages?: number;  
}

/**coordinates in the PDF page coordinate system */
export interface PageCoords {
  pageId: number;
  pageX: number;
  pageY: number;
  pageRotation: number;
}
//#endregion

export class PageService {
  private readonly _eventService: ElementEventService;
  get eventService(): ElementEventService {
    return this._eventService;
  }

  private readonly _visibleAdjPages: number;

  private _currentPageIndex: number;
  get currentPageIndex(): number {
    return this._currentPageIndex || 0;
  }

  private _pages: PageView[] = [];
  get pages(): PageView[] {
    return this._pages.slice();
  }
  set pages(value: PageView[]) {
    this._pages.forEach(x => x.destroy());
    this._pages = value.slice();
    this._eventService.dispatchEvent(new PagesLoadedEvent({pages: value.slice()}));
    this.setCurrentPageIndex(0);
  }

  private _renderedPages: PageView[] = [];
  get renderedPages(): PageView[] {
    return this._renderedPages.slice();
  }

  get length(): number {
    return this._pages.length || 0;
  }

  get scale(): number {
    return this._renderedPages[0]?.scale || 1;
  }
  set scale(value: number) {
    if (!value || isNaN(value)) {
      value = 1;
    }
    this._pages.forEach(x => x.scale = value);
    this._eventService.dispatchEvent(new ScaleChangedEvent({scale: value}));
  }

  constructor(eventService: ElementEventService, options?: PageServiceOptions) {   
    if (!eventService) {
      throw new Error("Event service is not defined");
    } 
    this._eventService = eventService;

    this._visibleAdjPages = options?.visibleAdjPages || 0;
  }

  destroy() {
    this._pages.forEach(x => x.destroy);
  }

  getPage(index: number): PageView {
    return this._pages[index];
  }
  
  getCurrentPage(): PageView {
    return this._pages[this._currentPageIndex];
  }

  /**
   * request setting the page with the specified index as the current one
   * (the request will be fulfilled if the index is inside the bounds and the viewer is scrollable)
   * @param index index of the page to be selected
   */
  requestSetCurrentPageIndex(index: number) {
    index = clamp(index || 0, 0, this._pages.length - 1);
    if (index !== this._currentPageIndex) {
      this._eventService.dispatchEvent(new CurrentPageChangeRequestEvent({pageIndex: index}));
    }
  }

  /**render the pages which are visible inside the specified container (viewer) */
  renderVisiblePages(container: HTMLDivElement) {
    const pages = this._pages;
    const {minFinal: minPageNumber, maxFinal: maxPageNumber} = this.getVisiblePageIndices(container);

    const renderedPages: PageView[] = [];
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (i >= minPageNumber && i <= maxPageNumber) {
        // render page view and dispatch corresponding event
        renderedPages.push(page);
        page.renderViewAsync();
      } else {
        page.clearView();
      }
    }

    this._renderedPages = renderedPages;
    this._eventService.dispatchEvent(new PagesRenderedEvent({pages: renderedPages.slice()}));

    this.updateCurrentPage(container);
  }  
  
  /**render the page previews which are visible inside the specified container (viewer) */
  renderVisiblePreviews(container: HTMLDivElement) {
    const pages = this._pages;
    const visible = this.getVisiblePageIndices(container, true);

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      if (i >= visible.minFinal && i <= visible.maxFinal) {
        page.renderPreviewAsync();
      }
    }
  }

  /**
   * render the pages which ids are in the set
   * @param pageIdSet 
   * @returns 
   */
  renderSpecifiedPages(pageIdSet: Set<number>) {
    if (!pageIdSet?.size) {
      return;
    }
    this._renderedPages.forEach(x => {
      if (pageIdSet.has(x.id)) {
        x.renderViewAsync(true);
      }
    });
  }   
   
  /**
   * convert client coordinates to the current page coordinate system
   * @param pointerX 
   * @param pointerY 
   * @returns 
   */
  getPageCoordsUnderPointer(pointerX: number, pointerY: number): PageCoords {
    for (const page of this._renderedPages) {
      const {left: pageRectMinX, top: pageRectMinY, width: pageRectWidth, height: pageRectHeight} = 
        page.viewContainer.getBoundingClientRect();
      const pageRectMaxX = pageRectMinX + pageRectWidth;
      const pageRectMaxY = pageRectMinY + pageRectHeight;

      if (pointerX < pageRectMinX || pointerX > pageRectMaxX) {
        continue;
      }
      if (pointerY < pageRectMinY || pointerY > pageRectMaxY) {
        continue;
      }

      // the point is inside the page
      let x: number;
      let y: number;
      const scale = this.scale;
      const rotation = page.rotation;
      switch (rotation) {
        case 0:
          // 0, 0 is bottom-left corner
          // pageX direction = clientX direction
          // pageY direction = -clientY direction
          x = (pointerX - pageRectMinX) / scale;
          y = (pageRectMaxY - pointerY) / scale;
          break;
        case 90:  
          // 0, 0 is top-left corner
          // pageX direction = clientY direction
          // pageY direction = clientX direction
          x = (pointerY - pageRectMinY) / scale;
          y = (pointerX - pageRectMinX) / scale;      
          break;
        case 180:
          // 0, 0 is top-right corner
          // pageX direction = -clientX direction
          // pageY direction = clientY direction
          x = (pageRectMaxX - pointerX) / scale;
          y = (pointerY - pageRectMinY) / scale;  
          break;
        case 270:
          // 0, 0 is bottom-right corner
          // pageX direction = -clientY direction
          // pageY direction = -clientX direction
          x = (pageRectMaxY - pointerY) / scale;
          y = (pageRectMaxX - pointerX) / scale;  
          break;
        default:
          throw new Error(`Invalid rotation degree: ${rotation}`);
      }

      return {
        pageId: page.id,
        pageX: x,
        pageY: y,
        pageRotation: rotation,
      };
    }

    // the point is outside of any page
    return null;
  } 

  private setCurrentPageIndex(index: number) {
    const newIndex = clamp(index || 0, 0, this._pages.length - 1);
    if (newIndex !== this._currentPageIndex) {
      const oldIndex = this._currentPageIndex;
      this._currentPageIndex = newIndex;
      this._pages[oldIndex]?.previewContainer.classList.remove("current");
      this._pages[newIndex]?.previewContainer.classList.add("current");
      this._eventService.dispatchEvent(new CurrentPageChangeEvent({oldIndex, newIndex}));
    }
  }

  /**
   * get page views/previews that are visible in the viewer viewport at the moment
   * @param container 
   * @param preview true: get the previews, false: get the views
   * @returns 
   */
  private getVisiblePageIndices(container: HTMLDivElement, preview = false): VisiblePageIndices {
    const pages = this._pages;
    if (!pages.length) {
      return {
        actual: [],
        minFinal: null,
        maxFinal: null,
      };
    }

    const indices = new Set<number>();

    const cRect = container.getBoundingClientRect();
    const cTop = cRect.top;
    const cBottom = cRect.top + cRect.height;

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pRect = preview
        ? page.previewContainer.getBoundingClientRect()
        : page.viewContainer.getBoundingClientRect();
      const pTop = pRect.top;
      const pBottom = pRect.top + pRect.height;

      if (pTop < cBottom && pBottom > cTop) {
        indices.add(i);
      } else if (indices.size) {
        break;
      }
    }

    const indicesArray = [...indices];
    return {
      actual: indicesArray,
      minFinal: Math.max(Math.min(...indicesArray) - this._visibleAdjPages, 0),
      maxFinal: Math.min(Math.max(...indicesArray) + this._visibleAdjPages, pages.length - 1),
    };
  }
  
  /**
   * get the current page
   * @param container 
   * @param visiblePageNumbers 
   * @returns the page that takes more than a half of the available viewer space or the topmost one if multiple pages take less space
   */
  private updateCurrentPage(container: HTMLDivElement) {
    const pages = this._pages;
    
    const visible = this.getVisiblePageIndices(container);
    const {actual: indices, minFinal: minIndex, maxFinal: maxIndex} = visible;

    if (!indices.length) {
      // no visible pages = no current page. default to zero
      this.setCurrentPageIndex(0);
      return;
    } else if (indices.length === 1) {
      // the only visible page = the current page
      this.setCurrentPageIndex(indices[0]);
      return;
    }

    const cRect = container.getBoundingClientRect();
    const cTop = cRect.top;
    const cMiddle = cRect.top + cRect.height / 2;

    for (const i of indices) {
      const pRect = pages[i].viewContainer.getBoundingClientRect();
      const pTop = pRect.top;

      if (pTop > cTop) {
        // the page top is below the container top
        if (pTop > cMiddle) {
          // the page top is below the container center - return the previous page 
          // (as it takes more than a half of the available viewer space)
          this.setCurrentPageIndex(i - 1);
          return;
        } else {
          // the page top is above the container center, 
          // so no page takes the most of viewer space.
          // return the topmost one (the current page)
          this.setCurrentPageIndex(i);
          return;
        }
      }
    };

    // function should not reach this point with correct arguments
    throw new Error("Incorrect argument");
  }
}
