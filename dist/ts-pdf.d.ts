// Generated by dts-bundle-generator v5.9.0

import { CustomStampCreationInfo, CustomStampEventDetail, Hextuple, Quadruple } from 'ts-viewers-core';

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
	private _fileName;
	private _docService;
	private _annotatorService;
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
	destroy(): void;
	openPdfAsync(src: string | Blob | Uint8Array, fileName?: string): Promise<void>;
	closePdfAsync(): Promise<void>;
	importAnnotationsAsync(dtos: AnnotationDto[]): Promise<void>;
	importAnnotationsFromJsonAsync(json: string): Promise<void>;
	exportAnnotationsAsync(): Promise<AnnotationDto[]>;
	exportAnnotationsToJsonAsync(): Promise<string>;
	importCustomStamps(customStamps: CustomStampCreationInfo[]): void;
	importCustomStampsFromJson(json: string): void;
	exportCustomStamps(): CustomStampCreationInfo[];
	exportCustomStampsToJson(): string;
	getCurrentPdfAsync(): Promise<Blob>;
	protected onTextSelectionChange: () => void;
	private initMainContainerEventHandlers;
	private initViewControls;
	private initFileButtons;
	private onFileInput;
	private onOpenFileButtonClick;
	private onSaveFileButtonClickAsync;
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
	private docServiceUndo;
	private onDocServiceStateChange;
	private refreshPagesAsync;
	private onPreviewerToggleClick;
	private onMainContainerPointerMove;
	private showPasswordDialogAsync;
}

export {};
