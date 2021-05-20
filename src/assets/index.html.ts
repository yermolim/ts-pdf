/// <reference path="./assets.d.ts" />

import icon_arrow from "./icons/arrow.png";
import icon_arrow_up from "./icons/arrow-up.png";
import icon_arrow_down from "./icons/arrow-down.png";
import icon_back from "./icons/back.png";
import icon_caret from "./icons/caret.png";
import icon_circle from "./icons/circle.png";
import icon_clockwise from "./icons/clockwise.png";
import icon_counter_clockwise from "./icons/counter-clockwise.png";
import icon_close from "./icons/close.png";
import icon_close2 from "./icons/close2.png";
import icon_cloudy from "./icons/line-cloudy.png";
import icon_delete from "./icons/delete.png";
import icon_download from "./icons/download.png";
import icon_fit_page from "./icons/fit-page.png";
import icon_fit_viewer from "./icons/fit-viewer.png";
import icon_geometric from "./icons/geometric.png";
import icon_hand from "./icons/hand.png";
import icon_line from "./icons/line.png";
import icon_load from "./icons/load.png";
import icon_minus from "./icons/minus.png";
import icon_ok from "./icons/ok.png";
import icon_pen from "./icons/pen.png";
import icon_plus from "./icons/plus.png";
import icon_pointer from "./icons/pointer.png";
import icon_polygon from "./icons/polygon.png";
import icon_polyline from "./icons/polyline.png";
import icon_popup from "./icons/popup.png";
import icon_popup2 from "./icons/popup2.png";
import icon_sidebar from "./icons/sidebar.png";
import icon_square from "./icons/square.png";
import icon_stamp from "./icons/stamp.png";
import icon_straight from "./icons/line-straight.png";
import icon_text from "./icons/text.png";
import icon_text2 from "./icons/text2.png";
import icon_text_free from "./icons/text-free.png";
import icon_text_callout from "./icons/text-callout.png";
import icon_text_highlight from "./icons/text-highlight.png";
import icon_text_squiggly from "./icons/text-squiggly.png";
import icon_text_strikeout from "./icons/text-strikeout.png";
import icon_text_underline from "./icons/text-underline.png";

//#region icons
export const geometricIcons = {
  square: `<img src="${icon_square}"/>`,
  circle: `<img src="${icon_circle}"/>`,
  line: `<img src="${icon_line}"/>`,
  arrow: `<img src="${icon_arrow}"/>`,
  polyline: `<img src="${icon_polyline}"/>`,
  polygon: `<img src="${icon_polygon}"/>`,
} as const;

export const textIcons = {
  note: `<img src="${icon_popup2}"/>`,
  freeText: `<img src="${icon_text_free}"/>`,
  freeTextCallout: `<img src="${icon_text_callout}"/>`,
  strikeout: `<img src="${icon_text_strikeout}"/>`,
  squiggly: `<img src="${icon_text_squiggly}"/>`,
  underline: `<img src="${icon_text_underline}"/>`,
  highlight: `<img src="${icon_text_highlight}"/>`,
} as const;

export const lineTypeIcons = {  
  straight: `<img src="${icon_straight}"/>`,
  cloudy: `<img src="${icon_cloudy}"/>`,
} as const;
//#endregion

export const mainHtml = /*html*/`
  <div id="main-container" class="hide-previewer disabled" 
    ondragstart="return false;" ondrop="return false;">
    <div id="viewer"></div>
    <div id="previewer"></div>
    <div id="top-panel"> 
      <div class="subpanel panel-item">
        <div id="toggle-previewer" class="panel-button panel-item">
          <img src="${icon_sidebar}"/>
        </div> 
      </div>
      <div id="modes" class="subpanel panel-item">
        <div id="button-mode-text" class="panel-button panel-item">
          <img src="${icon_caret}"/>
        </div> 
        <div id="button-mode-hand" class="panel-button panel-item">
          <img src="${icon_hand}"/>
        </div> 
        <div id="button-mode-annotation" class="panel-button panel-item">
          <img src="${icon_popup}"/>
        </div> 
        <div class="panel-v-separator margin-s-5 panel-item"></div>
        <div id="button-open-file" class="panel-button panel-item">
          <img src="${icon_load}"/>
        </div> 
        <div id="button-save-file" class="panel-button panel-item">
          <img src="${icon_download}"/>
        </div> 
        <div id="button-close-file" class="panel-button panel-item">
          <img src="${icon_close2}"/>
        </div> 
      </div>
    </div>
    <div id="bottom-panel">
      <div id="paginator" class="subpanel panel-item">
        <div id="paginator-prev" class="panel-button">
          <img src="${icon_arrow_up}"/>
        </div>
        <div id="paginator-next" class="panel-button">
          <img src="${icon_arrow_down}"/>
        </div>
        <input id="paginator-input" type="text">
        <span>&nbsp/&nbsp</span>
        <span id="paginator-total">0</span>
      </div>
      <div class="panel-v-separator panel-item"></div>
      <div id="rotator" class="subpanel panel-item">
        <div id="rotate-counter-clockwise" class="panel-button">
          <img src="${icon_counter_clockwise}"/>
        </div>
        <div id="rotate-clockwise" class="panel-button">
          <img src="${icon_clockwise}"/>
        </div>
      </div>
      <div class="panel-v-separator panel-item"></div>
      <div id="zoomer" class="subpanel panel-item">
        <div id="zoom-out" class="panel-button">
          <img src="${icon_minus}"/>
        </div>
        <div id="zoom-in" class="panel-button">
          <img src="${icon_plus}"/>
        </div>
        <div id="zoom-fit-viewer" class="panel-button">
          <img src="${icon_fit_viewer}"/>
        </div>
        <div id="zoom-fit-page" class="panel-button">
          <img src="${icon_fit_page}"/>
        </div>
      </div>
    </div>
    <div id="annotation-panel">
      <div class="annotation-panel-row">
        <div id="button-annotation-edit-text" 
          class="panel-button annotation-panel-subitem">
          <img src="${icon_text}"/>
        </div> 
        <div id="button-annotation-delete" 
          class="panel-button annotation-panel-subitem">
          <img src="${icon_close}"/>
        </div> 
        <div id="button-annotation-mode-select" 
          class="panel-button annotation-panel-item">
          <img src="${icon_pointer}"/>
        </div> 
      </div>
      <div class="annotation-panel-row">
        <div id="button-annotation-stamp-undo" 
          class="panel-button annotation-panel-subitem">
          <img src="${icon_back}"/>
        </div> 
        <div id="button-annotation-stamp-clear" 
          class="panel-button annotation-panel-subitem">
          <img src="${icon_close}"/>
        </div>
        <div id="button-annotation-stamp-save" 
          class="panel-button annotation-panel-subitem">
          <img src="${icon_ok}"/>
        </div> 
        <div id="button-annotation-mode-stamp" 
          class="panel-button annotation-panel-item">
          <img src="${icon_stamp}"/>
        </div> 
      </div>
      <div class="annotation-panel-row">
        <div id="button-annotation-pen-undo" 
          class="panel-button annotation-panel-subitem">
          <img src="${icon_back}"/>
        </div> 
        <div id="button-annotation-pen-clear" 
          class="panel-button annotation-panel-subitem">
          <img src="${icon_close}"/>
        </div> 
        <div id="button-annotation-pen-save" 
          class="panel-button annotation-panel-subitem">
          <img src="${icon_ok}"/>
        </div> 
        <div id="button-annotation-mode-pen" 
          class="panel-button annotation-panel-item">
          <img src="${icon_pen}"/>
        </div> 
      </div>
      <div class="annotation-panel-row">
        <div id="button-annotation-geometric-undo" 
          class="panel-button annotation-panel-subitem">
          <img src="${icon_back}"/>
        </div> 
        <div id="button-annotation-geometric-clear" 
          class="panel-button annotation-panel-subitem">
          <img src="${icon_close}"/>
        </div> 
        <div id="button-annotation-geometric-save" 
          class="panel-button annotation-panel-subitem">
          <img src="${icon_ok}"/>
        </div> 
        <div id="button-annotation-mode-geometric" 
          class="panel-button annotation-panel-item">
          <img src="${icon_geometric}"/>
        </div>
      </div>
      <div class="annotation-panel-row">
        <div id="button-annotation-text-undo" 
          class="panel-button annotation-panel-subitem">
          <img src="${icon_back}"/>
        </div> 
        <div id="button-annotation-text-clear" 
          class="panel-button annotation-panel-subitem">
          <img src="${icon_close}"/>
        </div> 
        <div id="button-annotation-text-save" 
          class="panel-button annotation-panel-subitem">
          <img src="${icon_ok}"/>
        </div> 
        <div id="button-annotation-mode-text" 
          class="panel-button annotation-panel-item">
          <img src="${icon_text2}"/>
        </div>
      </div>
    </div>

    <div id="focused-annotation-panel">
      <p id="focused-annotation-author" class="line-clamp"></p>
      <p id="focused-annotation-date" class="line-clamp"></p>
      <p id="focused-annotation-text" class="line-clamp"></p>
    </div>

    <input id="open-file-input" class="abs-hidden" type="file" accept="application/pdf">
  </div>
`;

//#region dialogs
export const passwordDialogHtml =  /*html*/`
  <div class="abs-full-size-overlay password-dialog">
    <div class="form">
      <input class="password-input" type="password" maxlength="127"/>
      <div class="buttons">
        <div class="panel-button password-ok">
          <img src="${icon_ok}"/>
        </div>
        <div class="panel-button password-cancel">
          <img src="${icon_close}"/>
        </div>
      </div>
    </div>
  </div>
`;

export const textDialogHtml =  /*html*/`
  <div class="abs-full-size-overlay text-dialog">
    <div class="form">
      <textarea class="text-input" maxlength="1024"></textarea>
      <div class="buttons">
        <div class="panel-button text-ok">
          <img src="${icon_ok}"/>
        </div>
        <div class="panel-button text-cancel">
          <img src="${icon_close}"/>
        </div>
      </div>
    </div>
  </div>
`;
//#endregion

//#region stamps
export const stampContextButtonsHtml = /*html*/`
  <div class="context-menu-content row">
    <div class="panel-button stamp-load-image">
      <img src="${icon_load}"/>
    </div>
    <div class="panel-button stamp-draw-image disabled">
      <img src="${icon_pen}"/>
    </div>
    <div class="panel-button stamp-delete disabled">
      <img src="${icon_delete}"/>
    </div>
  </div>
`;

export const stampImageLoaderHtml = /*html*/`
  <div class="abs-full-size-overlay stamp-dialog">
    <div class="form">
      <div class="form-canvas-wrapper">
        <canvas class="stamp-image-canvas"></canvas>
      </div>
      <div class="stamp-input-row">
        <p>Stamp name:</p>
        <input class="stamp-name-input" type="text" maxlength="128"/>
      </div>
      <div class="stamp-input-row">
        <p>Stamp description:</p>
        <input class="stamp-subject-input" type="text" maxlength="256"/>
      </div>
      <div class="stamp-input-row">
        <p>Width:</p>
        <input class="stamp-width-input" type="text" maxlength="4"/>
        <p>Height:</p>
        <input class="stamp-height-input" type="text" maxlength="4"/>
      </div>
      <div class="buttons">
        <div class="panel-button stamp-ok">
          <img src="${icon_ok}"/>
        </div>
        <div class="panel-button stamp-cancel">
          <img src="${icon_close}"/>
        </div>
      </div>
    </div>
  </div>
`;

export const stampImageEditorHtml = /*html*/`

`;
//#endregion

export const loaderHtml = /*html*/`
  <div class="abs-full-size-overlay">
    <div class="loader">
      <div></div>
      <div></div>
      <div></div>
    </div>
  </div>
`;
