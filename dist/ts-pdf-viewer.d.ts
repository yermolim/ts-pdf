// Generated by dts-bundle-generator v5.9.0

export declare type Quadruple = readonly [
	x1: number,
	y1: number,
	x2: number,
	y2: number
];
export declare type Hextuple = readonly [
	a: number,
	b: number,
	d: number,
	e: number,
	g: number,
	h: number
];
export interface StampCreationInfo {
	subject: string;
	bBox: Quadruple;
	rect: Quadruple;
}
export interface CustomStampCreationInfo extends StampCreationInfo {
	imageData: number[];
	type: string;
	name: string;
}
export interface AnnotationDto {
	annotationType: string;
	uuid: string;
	pageId: number;
	dateCreated: string;
	dateModified: string;
	author: string;
	textContent: string;
	rect: Quadruple;
	bbox?: Quadruple;
	matrix?: Hextuple;
}
export interface AnnotEventDetail {
	type: "focus" | "select" | "add" | "edit" | "delete" | "render";
	annotations: AnnotationDto[];
}
export declare class AnnotEvent extends CustomEvent<AnnotEventDetail> {
	constructor(detail: AnnotEventDetail);
}
export interface CustomStampEventDetail {
	type: "add" | "delete";
	stamp: CustomStampCreationInfo;
}
export declare class CustomStampEvent extends CustomEvent<CustomStampEventDetail> {
	constructor(detail: CustomStampEventDetail);
}
export declare type FileButtons = "open" | "save" | "close";
export interface TsPdfViewerOptions {
	containerSelector: string;
	workerSource: string;
	userName?: string;
	fileButtons?: FileButtons[];
	fileOpenAction?: () => void;
	fileSaveAction?: () => void;
	fileCloseAction?: () => void;
	annotChangeCallback?: (detail: AnnotEventDetail) => void;
	customStamps?: CustomStampCreationInfo[];
	customStampChangeCallback?: (detail: CustomStampEventDetail) => void;
	visibleAdjPages?: number;
	previewWidth?: number;
	minScale?: number;
	maxScale?: number;
}
export declare class TsPdfViewer {
	private readonly _userName;
	private readonly _outerContainer;
	private readonly _shadowRoot;
	private readonly _mainContainer;
	private readonly _eventService;
	private readonly _pageService;
	private readonly _customStampsService;
	private readonly _loader;
	private readonly _viewer;
	private readonly _previewer;
	private _docService;
	private _annotationService;
	private _fileOpenAction;
	private _fileSaveAction;
	private _fileCloseAction;
	private _annotChangeCallback;
	private _customStampChangeCallback;
	private _mainContainerRObserver;
	private _panelsHidden;
	private _fileInput;
	private _pdfLoadingTask;
	private _pdfDocument;
	private _timers;
	constructor(options: TsPdfViewerOptions);
	private static downloadFile;
	destroy(): void;
	openPdfAsync(src: string | Blob | Uint8Array): Promise<void>;
	closePdfAsync(): Promise<void>;
	importAnnotations(dtos: AnnotationDto[]): void;
	exportAnnotations(): AnnotationDto[];
	importAnnotationsFromJson(json: string): void;
	exportAnnotationsToJson(): string;
	getCurrentPdf(): Blob;
	protected onTextSelectionChange: () => void;
	private initMainContainerEventHandlers;
	private initViewControls;
	private initFileButtons;
	private onFileInput;
	private onOpenFileButtonClick;
	private onSaveFileButtonClick;
	private onCloseFileButtonClick;
	private initModeSwitchButtons;
	private initAnnotationButtons;
	private setViewerMode;
	private onTextModeButtonClick;
	private onHandModeButtonClick;
	private onAnnotationModeButtonClick;
	private onZoomOutClick;
	private onZoomInClick;
	private onZoomFitViewerClick;
	private onZoomFitPageClick;
	private onRotateCounterClockwiseClick;
	private onRotateClockwiseClick;
	private onPaginatorInput;
	private onPaginatorChange;
	private onPaginatorPrevClick;
	private onPaginatorNextClick;
	private onCurrentPagesChanged;
	private annotatorUndo;
	private annotatorClear;
	private annotatorSave;
	private onCustomStampChanged;
	private onAnnotationChange;
	private onAnnotatorDataChanged;
	private setAnnotationMode;
	private onAnnotationEditTextButtonClick;
	private onAnnotationDeleteButtonClick;
	private onAnnotationSelectModeButtonClick;
	private onAnnotationStampModeButtonClick;
	private onAnnotationPenModeButtonClick;
	private onAnnotationGeometricModeButtonClick;
	private onAnnotationTextModeButtonClick;
	private onPdfLoadingProgress;
	private refreshPagesAsync;
	private onPreviewerToggleClick;
	private onMainContainerPointerMove;
	private showPasswordDialogAsync;
}

export {};
