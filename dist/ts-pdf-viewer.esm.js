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
        this.onContainerResize = (size) => {
            if (!size) {
                const containerRect = this._container.getBoundingClientRect();
                size = {
                    width: containerRect.width,
                    height: containerRect.height,
                };
            }
            const dpr = window.devicePixelRatio;
            this._viewCanvas.width = size.width * dpr;
            this._viewCanvas.height = size.height * dpr;
        };
        this.onPdfLoadingProgress = (progressData) => {
            console.log(`${progressData.loaded}/${progressData.total}`);
        };
        this.onPdfLoaded = (doc) => {
            this._pdfDocument = doc;
            console.log(doc);
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
    openPdfAsync(path) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._pdfLoadingTask) {
                yield this.closePdfAsync();
                return this.openPdfAsync(path);
            }
            const loadingTask = getDocument(path);
            this._pdfLoadingTask = loadingTask;
            loadingTask.onProgress = this.onPdfLoadingProgress;
            this.onPdfLoaded(yield loadingTask.promise);
        });
    }
    closePdfAsync() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this._pdfLoadingTask) {
                yield this._pdfLoadingTask.destroy();
                this._pdfLoadingTask = null;
            }
            if (this._pdfDocument) {
                this._pdfDocument = null;
            }
        });
    }
    initViewerGUI() {
        const canvas = document.createElement("canvas");
        this._viewCanvas = canvas;
    }
}

export { TsPdfViewer };
