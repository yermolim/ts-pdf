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

export { PdfViewer };
