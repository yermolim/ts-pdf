import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
class TsPdfViewer {
    constructor(containerSelector, workerSrc) {
        this._visibleAdjPages = 2;
        this.styles = `
<style>
  #viewer-container {
    box-sizing: border-box;
    position: relative;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    align-items: stretch;
    width: 100%;
    height: 100%;
    overflow-x: none;
    overflow-y: none;
    background: gray;
  }

  #panel-top {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    width: 100%;
    height: 40px;
    background: dimgray;
    box-shadow: 0 0 10px rgba(0,0,0,0.75);
    z-index: 1;
    transition: height 0.25s ease-out 0.1s;
  }
  .hide-panels #panel-top {
    height: 0;
    transition: height 0.25s ease-in 0.1s;
  }

  #panel-bottom {
    position: absolute;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    flex-grow: 0;
    flex-shrink: 0;
    left: calc(50% - 160px);
    bottom: 10px;
    width: 320px;
    height: 40px;  
    background: dimgray;
    box-shadow: 0 0 10px rgba(0,0,0,0.75);
    z-index: 1;
    transition: height 0.25s ease-out, bottom 0.1s linear 0.25s;
  }
  .hide-panels #panel-bottom {
    bottom: 0;
    height: 0;
    transition: bottom 0.1s linear, height 0.25s ease-in 0.1s;
  }

  #paginator {  
    user-select: none;
    font-family: sans-serif;
    font-size: 16px;
    color: white;
  }
  #paginator-input {
    text-align: center; 
    width: 30px;
    height: 20px;
    margin: 0;
    padding: 0;
    outline: none;
    border: none;
    color: white;
    background-color: #303030;
  }

  #pages-container {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    height: 100%;
    padding-top: 0px;
    overflow-x: auto;
    overflow-y: auto;
    transition: padding-top 0.25s ease-out 0.1s;
  }
  .hide-panels #page-container {
    padding-top: 40px;
    transition: padding-top 0.25s ease-in 0.1s;
  }

  .page-canvas {
    margin: 10px;
    box-shadow: 0 0 10px rgba(0,0,0,0.75);
  }
  
</style>
  `;
        this.html = `
<div id="viewer-container">
  <div id="panel-top"></div>
  <div id="pages-container"></div>
  <div id="panel-bottom">
    <div id="paginator">
      <input id="paginator-input" type="text">
      <span>/</span>
      <span id="paginator-total">5</span>
    </div>
  </div>
</div>
  `;
        this._pageCanvases = [];
        this._scale = 1;
        this.onPdfLoadingProgress = (progressData) => {
            console.log(`${progressData.loaded}/${progressData.total}`);
        };
        this.onPdfLoadedAsync = (doc) => __awaiter(this, void 0, void 0, function* () {
            this._pdfDocument = doc;
            yield this.refreshPageCanvasesAsync();
            yield this.renderVisiblePagesAsync();
        });
        this.onPdfClosedAsync = () => __awaiter(this, void 0, void 0, function* () {
            if (this._pdfDocument) {
                this._pdfDocument = null;
            }
            yield this.refreshPageCanvasesAsync();
        });
        this.onPagesContainerScroll = () => {
            this.renderVisiblePagesAsync();
        };
        this.onPaginatorInput = (event) => {
            if (event.target instanceof HTMLInputElement) {
                event.target.value = event.target.value.replace(/[^\d]+/g, "");
            }
        };
        this.onPaginatorChange = (event) => {
            if (event.target instanceof HTMLInputElement) {
                const pageNumber = Math.max(Math.min(+event.target.value, this._pdfDocument.numPages), 1);
                if (pageNumber + "" !== event.target.value) {
                    event.target.value = pageNumber + "";
                }
                this.scrollToPage(pageNumber - 1);
            }
        };
        const container = document.querySelector(containerSelector);
        if (!container) {
            throw new Error("Container not found");
        }
        else if (!(container instanceof HTMLDivElement)) {
            throw new Error("Container is not a DIV element");
        }
        else {
            this._container = container;
        }
        if (!workerSrc) {
            throw new Error("Worker source path not defined");
        }
        GlobalWorkerOptions.workerSrc = workerSrc;
        this.initViewerGUI();
    }
    destroy() {
    }
    openPdfAsync(path) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._pdfLoadingTask) {
                yield this.closePdfAsync();
                return this.openPdfAsync(path);
            }
            const loadingTask = getDocument(path);
            this._pdfLoadingTask = loadingTask;
            loadingTask.onProgress = this.onPdfLoadingProgress;
            const doc = yield loadingTask.promise;
            this._pdfLoadingTask = null;
            yield this.onPdfLoadedAsync(doc);
        });
    }
    closePdfAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._pdfLoadingTask) {
                if (!this._pdfLoadingTask.destroyed) {
                    yield this._pdfLoadingTask.destroy();
                }
                this._pdfLoadingTask = null;
            }
            yield this.onPdfClosedAsync();
        });
    }
    initViewerGUI() {
        this._shadowRoot = this._container.attachShadow({ mode: "open" });
        this._shadowRoot.innerHTML = this.styles + this.html;
        const paginatorInput = this._shadowRoot.getElementById("paginator-input");
        paginatorInput.addEventListener("input", this.onPaginatorInput);
        paginatorInput.addEventListener("change", this.onPaginatorChange);
        this._pagesContainer = this._shadowRoot.querySelector("div#pages-container");
    }
    refreshPageCanvasesAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            this._pageCanvases.forEach(x => {
                x.canvas.remove();
            });
            this._pageCanvases.length = 0;
            const docPagesNumber = this._pdfDocument.numPages;
            this._shadowRoot.getElementById("paginator-total").innerHTML = docPagesNumber + "";
            if (!docPagesNumber) {
                this._pagesContainer.removeEventListener("scroll", this.onPagesContainerScroll);
            }
            for (let i = 0; i < docPagesNumber; i++) {
                const canvas = document.createElement("canvas");
                canvas.classList.add("page-canvas");
                const page = yield this._pdfDocument.getPage(i + 1);
                const { width, height } = page.getViewport({ scale: 1 });
                this._pagesContainer.append(canvas);
                this._pageCanvases.push({
                    canvas,
                    ctx: canvas.getContext("2d"),
                    rendered: false,
                    renderTask: null,
                    size: { width, height },
                });
            }
            this.refreshPageCanvasesSize();
            this._pagesContainer.addEventListener("scroll", this.onPagesContainerScroll);
        });
    }
    refreshPageCanvasesSize() {
        this._pageCanvases.forEach(x => {
            const { canvas, size } = x;
            canvas.width = size.width * this._scale;
            canvas.height = size.height * this._scale;
        });
    }
    renderVisiblePagesAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = this._pdfDocument;
            const pageCanvases = this._pageCanvases;
            const scale = this._scale;
            const visiblePageNumbers = this.getVisiblePages(this._container, pageCanvases);
            const currentPageNumber = this.getCurrentPage(this._container, pageCanvases, visiblePageNumbers);
            this._shadowRoot.getElementById("paginator-input").value = currentPageNumber + 1 + "";
            const minPageNumber = Math.max(Math.min(...visiblePageNumbers) - this._visibleAdjPages, 0);
            const maxPageNumber = Math.min(Math.max(...visiblePageNumbers) + this._visibleAdjPages, pageCanvases.length - 1);
            for (let i = 0; i < pageCanvases.length; i++) {
                if (i >= minPageNumber && i <= maxPageNumber) {
                    if (!pageCanvases[i].rendered) {
                        yield this.renderPageAsync(doc, pageCanvases, i, scale);
                    }
                }
                else if (pageCanvases[i].rendered) {
                    this.clearRenderedPage(pageCanvases, i);
                }
            }
        });
    }
    scrollToPage(pageNumber) {
        const { top: cTop } = this._pagesContainer.getBoundingClientRect();
        const { top: pTop } = this._pageCanvases[pageNumber].canvas.getBoundingClientRect();
        const scroll = pTop - (cTop - this._pagesContainer.scrollTop);
        this._pagesContainer.scrollTo(0, scroll);
    }
    getVisiblePages(container, pageCanvases) {
        const cRect = container.getBoundingClientRect();
        const cTop = cRect.top;
        const cBottom = cRect.top + cRect.height;
        const pagesVisible = new Set();
        pageCanvases.forEach((x, i) => {
            const pRect = x.canvas.getBoundingClientRect();
            const pTop = pRect.top;
            const pBottom = pRect.top + pRect.height;
            if (pTop < cBottom && pBottom > cTop) {
                pagesVisible.add(i);
            }
        });
        return pagesVisible;
    }
    getCurrentPage(container, pageCanvases, visiblePageNumbers) {
        const visiblePageNumbersArray = [...visiblePageNumbers];
        if (!visiblePageNumbersArray.length) {
            return 0;
        }
        else if (visiblePageNumbersArray.length === 1) {
            return visiblePageNumbersArray[0];
        }
        const cRect = container.getBoundingClientRect();
        const cTop = cRect.top;
        const cMiddle = cRect.top + cRect.height / 2;
        for (const i of visiblePageNumbersArray) {
            const pRect = pageCanvases[i].canvas.getBoundingClientRect();
            const pTop = pRect.top;
            if (pTop > cTop) {
                if (pTop > cMiddle) {
                    return i - 1;
                }
                else {
                    return i;
                }
            }
        }
        throw new Error("Incorrect argument");
    }
    renderPageAsync(doc, pageCanvases, pageNumber, scale) {
        return __awaiter(this, void 0, void 0, function* () {
            const pageCanvas = pageCanvases[pageNumber];
            if (pageCanvas.renderTask) {
                return;
            }
            const page = yield doc.getPage(pageNumber + 1);
            const viewport = page.getViewport({ scale });
            if (!pageCanvas.renderTask) {
                const params = {
                    canvasContext: pageCanvas.ctx,
                    viewport,
                };
                const renderTask = page.render(params);
                pageCanvas.renderTask = renderTask;
                yield renderTask.promise;
                pageCanvas.renderTask = null;
                pageCanvas.rendered = true;
            }
        });
    }
    clearRenderedPage(pageCanvases, pageNumber) {
        const pageCanvas = pageCanvases[pageNumber];
        pageCanvas.ctx.clearRect(0, 0, pageCanvas.canvas.width, pageCanvas.canvas.height);
        pageCanvas.rendered = false;
    }
}

export { TsPdfViewer };
