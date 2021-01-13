import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist';

class TsPdfConst {
}
TsPdfConst.V_CONTAINER_CLASS = "ts-pdf-viewer-container";
TsPdfConst.V_CONTAINER_HIDE_PANELS_CLASS = "panels-hidden";
TsPdfConst.V_PANEL_TOP_CLASS = "ts-pdf-viewer-panel-top";
TsPdfConst.V_PANEL_BOTTOM_CLASS = "ts-pdf-viewer-panel-bottom";
TsPdfConst.P_CONTAINER_CLASS = "ts-pdf-page-container";
TsPdfConst.P_CANVAS_CLASS = "ts-pdf-page-canvas";

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
        this._pageCanvases = [];
        this._pagesVisible = new Set();
        this.onPdfLoadingProgress = (progressData) => {
            console.log(`${progressData.loaded}/${progressData.total}`);
        };
        this.onPdfLoaded = (doc) => {
            this._pdfDocument = doc;
            this.refreshPageCanvases();
            this.refreshPageView();
        };
        this.refreshPageView = () => {
            this._pagesVisible = this.getVisiblePages(this._container, this._pageCanvases);
            this._pageCurrent = this.getCurrentPage(this._container, this._pageCanvases, this._pagesVisible);
            this.renderVisiblePagesAsync();
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
            this.onPdfLoaded(doc);
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
            if (this._pdfDocument) {
                this._pdfDocument = null;
            }
            this.refreshPageCanvases();
        });
    }
    initViewerGUI() {
        const viewerContainer = document.createElement("div");
        viewerContainer.classList.add(TsPdfConst.V_CONTAINER_CLASS);
        const pagesContainer = document.createElement("div");
        pagesContainer.classList.add(TsPdfConst.P_CONTAINER_CLASS);
        const topPanel = document.createElement("div");
        topPanel.classList.add(TsPdfConst.V_PANEL_TOP_CLASS);
        const bottomPanel = document.createElement("div");
        bottomPanel.classList.add(TsPdfConst.V_PANEL_BOTTOM_CLASS);
        viewerContainer.append(topPanel);
        viewerContainer.append(pagesContainer);
        viewerContainer.append(bottomPanel);
        this._container.append(viewerContainer);
        this._viewerContainer = viewerContainer;
        this._pagesContainer = pagesContainer;
    }
    refreshPageCanvases() {
        var _a;
        this._pageCanvases.forEach(x => {
            x.canvas.remove();
        });
        this._pageCanvases.length = 0;
        const docPagesNumber = (_a = this._pdfDocument) === null || _a === void 0 ? void 0 : _a.numPages;
        if (!docPagesNumber) {
            this._pagesContainer.removeEventListener("scroll", this.refreshPageView);
        }
        for (let i = 0; i < docPagesNumber; i++) {
            const canvas = document.createElement("canvas");
            canvas.classList.add(TsPdfConst.P_CANVAS_CLASS);
            canvas.height = 500;
            this._pagesContainer.append(canvas);
            this._pageCanvases.push({
                canvas,
                ctx: canvas.getContext("2d"),
                rendered: false,
                renderTask: null,
            });
        }
        this._pagesContainer.addEventListener("scroll", this.refreshPageView);
    }
    renderVisiblePagesAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            const visibleAdjPages = 2;
            const doc = this._pdfDocument;
            const pageCanvases = this._pageCanvases;
            const visiblePages = this._pagesVisible;
            const minPageNumber = Math.max(Math.min(...visiblePages) - visibleAdjPages, 0);
            const maxPageNumber = Math.min(Math.max(...visiblePages) + visibleAdjPages, pageCanvases.length - 1);
            for (let i = 0; i < pageCanvases.length; i++) {
                if (i >= minPageNumber && i <= maxPageNumber) {
                    if (!pageCanvases[i].rendered) {
                        yield this.renderPageAsync(doc, pageCanvases, i);
                    }
                }
                else if (pageCanvases[i].rendered) {
                    this.clearRenderedPage(pageCanvases, i);
                }
            }
        });
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
    renderPageAsync(doc, pageCanvases, pageNumber, scale = 1) {
        return __awaiter(this, void 0, void 0, function* () {
            const pageCanvas = pageCanvases[pageNumber];
            if (pageCanvas.renderTask) {
                return;
            }
            const page = yield doc.getPage(pageNumber + 1);
            const viewport = page.getViewport({ scale });
            pageCanvas.canvas.width = viewport.width;
            pageCanvas.canvas.height = viewport.height;
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
