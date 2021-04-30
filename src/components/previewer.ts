import { PageService, currentPageChangeEvent, CurrentPageChangeEvent, 
  pagesLoadedEvent, PagesLoadedEvent } from "../services/page-service";

export interface PreviewerOptions {
  canvasWidth?: number;
}

export class Previewer {
  private readonly _pageService: PageService;
  private readonly _container: HTMLDivElement;

  private readonly _canvasWidth: number;
  get canvasWidth(): number {
    return this._canvasWidth;
  }

  private _hidden = true;
  get hidden(): boolean {
    return this._hidden;
  }
 
  constructor(pageService: PageService, container: HTMLDivElement, options?: PreviewerOptions) {        
    if (!pageService) {
      throw new Error("Page service is not defined");
    }
    if (!container) {
      throw new Error("Container is not defined");
    }
    this._pageService = pageService;
    this._container = container;

    this._canvasWidth = options?.canvasWidth || 100;

    this.init();
  }
  
  destroy() {   
    this._pageService.eventService.removeListener(pagesLoadedEvent, this.onPagesLoaded); 
    this._pageService.eventService.removeListener(currentPageChangeEvent, this.onCurrentPageChanged);
  }

  show() {
    this._hidden = false;
    // timeout to give the time to update DOM
    setTimeout(() => this.renderVisible(), 1000);
  }

  hide() {
    this._hidden = true;
  }
  
  private renderVisible() {
    if (this._hidden) {
      return;
    }

    this._pageService.renderVisiblePreviews(this._container);
  }

  private init() {
    this._container.addEventListener("scroll", this.onPreviewerScroll);
    this._pageService.eventService.addListener(pagesLoadedEvent, this.onPagesLoaded); 
    this._pageService.eventService.addListener(currentPageChangeEvent, this.onCurrentPageChanged);
  }
  
  private scrollToPreview(pageIndex: number) { 
    if (!this._pageService.pages.length) {
      // no pages
      return;
    }

    const {top: cTop, height: cHeight} = this._container.getBoundingClientRect();
    const {top: pTop, height: pHeight} = this._pageService.getPage(pageIndex).previewContainer.getBoundingClientRect();

    const cCenter = cTop + cHeight / 2;
    const pCenter = pTop + pHeight / 2;

    const scroll = pCenter - cCenter + this._container.scrollTop;
    this._container.scrollTo(0, scroll);
  }
  
  private onPagesLoaded = (event: PagesLoadedEvent) => {
    event.detail.pages?.forEach(x => {
      x.previewContainer.addEventListener("click", this.onPreviewerPageClick);
      this._container.append(x.previewContainer);
    });
    this.renderVisible();
  };

  private onCurrentPageChanged = (event: CurrentPageChangeEvent) => {
    this.scrollToPreview(event.detail.newIndex);
  };

  private onPreviewerPageClick = (e: Event) => {
    let target = <HTMLElement>e.target;
    let pageNumber: number;
    while (target && !pageNumber) {
      const data = target.dataset["pageNumber"];
      if (data) {
        pageNumber = +data;
      } else {
        target = target.parentElement;
      }
    }
    if (pageNumber) {
      this._pageService.requestSetCurrentPageIndex(pageNumber - 1);
    }
  };
  
  private onPreviewerScroll = (e: Event) => {
    this.renderVisible();
  };
}
