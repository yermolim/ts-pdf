import { getDocument } from 'pdfjs-dist';

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
    constructor(containerSelector) {
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
        this.initViewerGUI();
    }
    openPdfAsync(path) {
        return __awaiter(this, void 0, void 0, function* () {
            const doc = yield getDocument(path).promise;
        });
    }
    initViewerGUI() {
        const canvas = document.createElement("canvas");
        this._viewCanvas = canvas;
    }
    onContainerResize(size) {
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
    }
}

export { TsPdfViewer };
