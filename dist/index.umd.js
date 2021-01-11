(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.TsPdfViewer = {}));
}(this, (function (exports) { 'use strict';

    class PdfViewer {
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
        }
    }

    exports.PdfViewer = PdfViewer;

    Object.defineProperty(exports, '__esModule', { value: true });

})));
