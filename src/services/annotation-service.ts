import { Quadruple } from "../common/types";
import { Vec2 } from "../common/math";

import { geometricIcons, lineTypeIcons, textIcons } from "../assets/index.html";

import { DocumentService } from "./document-service";

import { Annotator } from "../annotator/annotator";
import { GeometricAnnotatorFactory, GeometricAnnotatorType, geometricAnnotatorTypes } 
  from "../annotator/geometric/geometric-annotator-factory";
import { PenAnnotator } from "../annotator/pen/pen-annotator";
import { StampAnnotator, supportedStampTypes } from "../annotator/stamp/stamp-annotator";

import { Viewer } from "../components/viewer";
import { ContextMenu } from "../components/context-menu";
import { PageService, pagesRenderedEvent, PagesRenderedEvent } from "./page-service";
import { TextAnnotatorFactory, TextAnnotatorType, textAnnotatorTypes } from "../annotator/text/text-annotator-factory";

export type AnnotationServiceMode = "select" | "stamp" | "pen" | "geometric" | "text";

export class AnnotationService {
  private readonly _annotationColors: readonly Quadruple[] = [
    [0, 0, 0, 0.5], // black
    [0.804, 0, 0, 0.5], // red
    [0, 0.804, 0, 0.5], // green
    [0, 0, 0.804, 0.5], // blue
    [1, 0.5, 0, 0.5], // orange
    [1, 0.2, 1, 0.5], // pink
  ];
  
  private readonly _docService: DocumentService;
  private readonly _viewer: Viewer;
  private readonly _pageService: PageService;
  
  private _contextMenu: ContextMenu;
  private _geometricFactory: GeometricAnnotatorFactory;
  private _textFactory: TextAnnotatorFactory;
  private _viewerResizeObserver: ResizeObserver;
  
  private _mode: AnnotationServiceMode;  
  get mode(): AnnotationServiceMode {
    return this._mode;
  }
  set mode(value: AnnotationServiceMode) {
    this.setMode(value);
  }

  private _strokeColor: Quadruple = this._annotationColors[0];
  private _strokeWidth = 3;

  private _stampType: string = supportedStampTypes[0].type;

  private _geometricCloudMode = false;
  private _geometricSubmode: GeometricAnnotatorType = geometricAnnotatorTypes[0];
  
  private _textSubmode: TextAnnotatorType = textAnnotatorTypes[0];

  private _annotator: Annotator;
  get annotator(): Annotator {
    return this._annotator;
  }

  constructor(docService: DocumentService, pageService: PageService, viewer: Viewer) {
    if (!docService) {
      throw new Error("Document service is not defined");
    }
    if (!pageService) {
      throw new Error("Page service is not defined");
    }
    if (!viewer) {
      throw new Error("Viewer is not defined");
    }

    this._docService = docService;
    this._pageService = pageService;
    this._viewer = viewer;

    this.init();
  }

  destroy() {
    this._docService.eventService.removeListener(pagesRenderedEvent, this.onPagesRendered);

    this._viewer.container.removeEventListener("contextmenu", this.onContextMenu);
    this._viewerResizeObserver?.disconnect();

    this._contextMenu?.destroy();
    this._annotator?.destroy();
  }  

  private init() {
    this._docService.eventService.addListener(pagesRenderedEvent, this.onPagesRendered);   

    this._viewer.container.addEventListener("contextmenu", this.onContextMenu);
    const viewerRObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      this._contextMenu?.hide();
    });
    viewerRObserver.observe(this._viewer.container);
    this._viewerResizeObserver = viewerRObserver;
    
    this._contextMenu = new ContextMenu();
    this._geometricFactory = new GeometricAnnotatorFactory();
    this._textFactory = new TextAnnotatorFactory();
  }

  private setMode(mode?: AnnotationServiceMode) {
    mode ||= this._mode;

    // disable previous mode
    this._contextMenu.content = [];
    this._annotator?.destroy();
    this._docService.setSelectedAnnotation(null);

    this._mode = mode;

    // add or remove the css class which signals if any text markup annotator is used
    // (used for disabling annotation layers pointer events to allow page text selection)
    if (this._mode === "text"
      && (this._textSubmode === "highlight"
      || this._textSubmode === "strikeout"
      || this._textSubmode === "underline")) {
      this._viewer.container.classList.add("mode-text-markup");
    } else {      
      this._viewer.container.classList.remove("mode-text-markup");
    }

    switch (mode) {
      case "select":
        this._contextMenu.enabled = false;
        return;
      case "stamp":
        this._annotator = new StampAnnotator(this._docService, this._pageService,
          this._viewer.container, this._stampType);
        break;
      case "pen":
        this._annotator = new PenAnnotator(this._docService, this._pageService,
          this._viewer.container, {            
            strokeWidth: this._strokeWidth,
            color: this._strokeColor,
          });
        break;
      case "geometric":
        this._annotator = this._geometricFactory.createAnnotator(this._docService, this._pageService,
          this._viewer.container, {
            strokeWidth: this._strokeWidth,
            color: this._strokeColor,
            cloudMode: this._geometricCloudMode,
          }, this._geometricSubmode);
        break;
      case "text":
        this._annotator = this._textFactory.createAnnotator(this._docService, this._pageService,
          this._viewer.container, {
            strokeWidth: this._strokeWidth,
            color: this._strokeColor,
          }, this._textSubmode);
        break;
      default:
        // Execution should not come here
        throw new Error(`Invalid annotation mode: ${mode}`);
    }
    const cmContent = this.buildContextMenuContent();
    this._contextMenu.content = cmContent;
    this._contextMenu.enabled = true;
  }
  
  private onContextMenu = (event: MouseEvent) => {
    if (this._contextMenu.enabled) {
      event.preventDefault();
      this._contextMenu.show(new Vec2(event.clientX, event.clientY), this._viewer.container);
    }
  };

  private onPagesRendered = (event: PagesRenderedEvent) => {
    this._contextMenu.hide();
  };

  private buildContextMenuContent(): HTMLElement[] {
    switch (this._mode) {
      case "select":
        return [];
      case "stamp":
        return [this.buildStampTypePicker()];
      case "pen":
        return [
          this.buildStrokeColorPicker(),
          this.buildStrokeWidthSlider(false),
        ];
      case "geometric":
        return [
          this.buildGeometricSubmodePicker(),
          this.buildStrokeColorPicker(),
          this.buildStrokeWidthSlider(true),
        ];
      case "text":
        return [
          this.buildTextSubmodePicker(),
          this.buildStrokeColorPicker(),
        ];
      default:
        // Execution should not come here
        throw new Error(`Invalid annotation mode: ${this._mode}`);
    }
  }  

  private buildStampTypePicker(): HTMLDivElement {
    const stampTypes = supportedStampTypes;

    // init a stamp type picker
    const pickerDiv = document.createElement("div");
    pickerDiv.classList.add("context-menu-content", "column");
    stampTypes.forEach(x => {          
      const item = document.createElement("div");
      item.classList.add("context-menu-stamp-select-button");
      if (x.type === this._stampType) {        
        item.classList.add("on");
      }
      item.addEventListener("click", () => {
        this._stampType = x.type;
        this.setMode();
      });
      const stampName = document.createElement("div");
      stampName.innerHTML = x.name;
      item.append(stampName);
      pickerDiv.append(item);
    });
    return pickerDiv;
  }
  
  private buildGeometricSubmodePicker(): HTMLDivElement {    
    const submodePicker = document.createElement("div");
    submodePicker.classList.add("context-menu-content", "row");
    geometricAnnotatorTypes.forEach(x => {   
      const item = document.createElement("div");
      item.classList.add("panel-button");
      if (x === this._geometricSubmode) {        
        item.classList.add("on");
      }
      item.addEventListener("click", () => {
        this._geometricSubmode = x;
        this.setMode();
      });
      const submodeIcon = document.createElement("div");
      submodeIcon.classList.add("context-menu-color-icon");
      submodeIcon.innerHTML = geometricIcons[x];
      item.append(submodeIcon);
      submodePicker.append(item);
    });
    return submodePicker;
  }
  
  private buildTextSubmodePicker(): HTMLDivElement {
    const submodePicker = document.createElement("div");
    submodePicker.classList.add("context-menu-content", "row");
    textAnnotatorTypes.forEach(x => {   
      const item = document.createElement("div");
      item.classList.add("panel-button");
      if (x === this._textSubmode) {        
        item.classList.add("on");
      }
      item.addEventListener("click", () => {
        this._textSubmode = x;
        this.setMode();
      });
      const submodeIcon = document.createElement("div");
      submodeIcon.classList.add("context-menu-color-icon");
      submodeIcon.innerHTML = textIcons[x];
      item.append(submodeIcon);
      submodePicker.append(item);
    });
    return submodePicker;
  }

  private buildStrokeColorPicker(): HTMLDivElement {    
    const colorPickerDiv = document.createElement("div");
    colorPickerDiv.classList.add("context-menu-content", "row");
    this._annotationColors.forEach(x => {          
      const item = document.createElement("div");
      item.classList.add("panel-button");
      if (x === this._strokeColor) {        
        item.classList.add("on");
      }
      item.addEventListener("click", () => {
        this._strokeColor = x;
        this.setMode();
      });
      const colorIcon = document.createElement("div");
      colorIcon.classList.add("context-menu-color-icon");
      colorIcon.style.backgroundColor = `rgb(${x[0]*255},${x[1]*255},${x[2]*255})`;
      item.append(colorIcon);
      colorPickerDiv.append(item);
    });
    return colorPickerDiv;
  }
  
  private buildStrokeWidthSlider(cloudButtons?: boolean): HTMLDivElement {
    const disableLineTypeButtons = !cloudButtons   
      || this._geometricSubmode === "polyline"
      || this._geometricSubmode === "line"
      || this._geometricSubmode === "arrow";
    
    const div = document.createElement("div");
    div.classList.add("context-menu-content", "row");
    
    const cloudyLineButton = document.createElement("div");
    cloudyLineButton.classList.add("panel-button");
    if (disableLineTypeButtons) {
      cloudyLineButton.classList.add("disabled");
    } else {
      if (this._geometricCloudMode) {
        cloudyLineButton.classList.add("on");
      }
      cloudyLineButton.addEventListener("click", () => {
        this._geometricCloudMode = true;
        this.setMode();
      });
    }
    const cloudyLineIcon = document.createElement("div");
    cloudyLineIcon.classList.add("context-menu-color-icon");
    cloudyLineIcon.innerHTML = lineTypeIcons.cloudy;
    cloudyLineButton.append(cloudyLineIcon);
    div.append(cloudyLineButton);
    
    const straightLineButton = document.createElement("div");
    straightLineButton.classList.add("panel-button");
    if (disableLineTypeButtons) {
      straightLineButton.classList.add("disabled");
    } else {
      if (!this._geometricCloudMode) {
        straightLineButton.classList.add("on");
      }
      straightLineButton.addEventListener("click", () => {
        this._geometricCloudMode = false;
        this.setMode();
      });
    }
    const straightLineIcon = document.createElement("div");
    straightLineIcon.classList.add("context-menu-color-icon");
    straightLineIcon.innerHTML = lineTypeIcons.straight;
    straightLineButton.append(straightLineIcon);
    div.append(straightLineButton);

    const slider = document.createElement("input");
    slider.setAttribute("type", "range");
    slider.setAttribute("min", "1");
    slider.setAttribute("max", "32");
    slider.setAttribute("step", "1");
    slider.setAttribute("value", this._strokeWidth + "");
    slider.classList.add("context-menu-slider");
    slider.addEventListener("change", () => {
      this._strokeWidth = slider.valueAsNumber;
      this.setMode();
    });
    div.append(slider);

    return div;
  }
  
  // TODO: add opacity slider
}
