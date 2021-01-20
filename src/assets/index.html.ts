/// <reference path="./assets.d.ts" />

import icon_arrow_up from "./icons/arrow-up.png";
import icon_arrow_down from "./icons/arrow-down.png";
import icon_minus from "./icons/minus.png";
import icon_plus from "./icons/plus.png";
import icon_fit_viewer from "./icons/fit-viewer.png";
import icon_fit_page from "./icons/fit-page.png";
import sidebar from "./icons/sidebar.png";

export const styles = /*html*/`
  <style>
    .disabled {
      pointer-events: none;
    }

    #main-container {
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: stretch;
      align-items: stretch;
      width: 100%;
      height: 100%;
      background: gray;
    }
  
    #panel-top {
      position: relative;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      width: 100%;
      height: 50px;
      background: #282828;
      box-shadow: 0 0 10px rgba(0,0,0,0.75);
      z-index: 1;
      transition: height 0.25s ease-out 0.1s;
    }
    .hide-panels #panel-top {
      height: 0;
      transition: height 0.25s ease-in 0.2s;
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
      height: 50px;  
      background: rgba(40,40,40,0.9);
      box-shadow: 0 0 10px rgba(0,0,0,0.75);
      z-index: 1;
      transition: height 0.25s ease-out, bottom 0.1s linear 0.25s;
    }
    .hide-panels #panel-bottom {
      bottom: 0;
      height: 0;
      transition: bottom 0.1s linear 0.1s, height 0.25s ease-in 0.2s;
    }

    .panel-v-separator {
      width: 1px;
      height: 30px;
      background-color: #BBBBBB;
    }
  
    .panel-button {
      cursor: pointer;
      user-select: none;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      width: 36px;
      height: 36px;
      border-radius: 50%;
    }
    .panel-button:hover,
    .panel-button.on {
      background-color: #606060;
    }
    .panel-button img {
      width: 20px;
      height: 20px;
      filter: invert();
    }  
  
    .subpanel {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      margin: 0 4px;
    }    
    
    .panel-item {
      transform: scale(1);
      transition: opacity 0.1s ease-out 0.35s, transform 0s linear 0.35s;
    }
    .hide-panels .panel-item {
      cursor: default;      
      opacity: 0;
      transform: scale(0);
      transition: opacity 0.1s ease-in, transform 0s linear 0.1s;
    }
  
    #paginator {  
      user-select: none;
      font-family: sans-serif;
      font-size: 16px;
      color: white;
    }
    #paginator-input {
      text-align: center; 
      font-size: 16px;
      width: 30px;
      height: 30px;
      margin: 2px;
      padding: 0;
      outline: none;
      border: none;
      color: white;
      background-color: #303030;
    }
    #paginator-total {
      margin: 4px;
    }

    #toggle-previewer {
      margin: 4px;
    }
    
    #viewer-container {
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      overflow: hidden;
    }
      
    #previewer {
      box-sizing: border-box;
      position: absolute;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      align-items: center;
      left: 0;
      top: 0;
      bottom: 0;
      width: 160px; 
      padding-top: 0px;
      background: rgba(60,60,60,1);
      box-shadow: 0 0 10px rgba(0,0,0,0.75);
      z-index: 1;
      transition: padding-top 0.25s ease-out 0.1s, width 0.25s ease-out;
    } 
    .hide-panels #previewer {
      padding-top: 50px;
      transition: padding-top 0.25s ease-in 0.2s;
    }   
    .mobile #previewer {
      background: rgba(60,60,60,0.9);
    } 
    .hide-previewer #previewer {
      width: 0;
      transition: width 0.25s ease-in 0.1s;
    }
    #previewer .page-preview {      
      transform: scale(1);
      transition: opacity 0.1s ease-out 0.35s, transform 0s linear 0.35s;
    }
    .hide-previewer #previewer .page-preview {
      opacity: 0;
      transform: scale(0);
      transition: opacity 0.1s ease-in, transform 0s linear 0.1s;
    }
  
    #viewer {
      box-sizing: border-box;
      position: absolute;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow: auto;
      left: 160px;
      right: 0;
      top: 0;
      bottom: 0;
      padding-top: 0px;
      transition: padding-top 0.25s ease-out 0.1s, left 0.25s ease-out;
    }
    .hide-panels #viewer {
      padding-top: 50px;
      transition: padding-top 0.25s ease-in 0.2s;
    }      
    .hide-panels.mobile #viewer,
    .hide-panels.hide-previewer #viewer {
      padding-top: 50px;
      left: 0;
      transition: padding-top 0.25s ease-in 0.2s, left 0.25s ease-in;
    }   
    .mobile #viewer,
    .hide-previewer #viewer {
      padding-top: 0px;
      left: 0;
      transition: padding-top 0.25s ease-out 0.1s, left 0.25s ease-in;
    } 
  
    .page {    
      position: relative;
      margin: 10px auto;
      box-shadow: 0 0 10px rgba(0,0,0,0.75);
    }
    .page-preview {   
      cursor: pointer; 
      position: relative;
      margin: 10px auto;
      box-shadow: 0 0 10px rgba(0,0,0,0.75);
    }
    .page-preview:hover,
    .page-preview.current {
      margin: 0 auto;
      padding: 10px;
      background-color: rgba(96,96,96,1);
    }

    .page-canvas {
      background-color: white;
    }  
    
    .page-text {
      position: absolute;
      left: 0;
      right: 0;
      top: 0;
      bottom: 0;
      margin: 0;
      padding: 0;
      overflow: hidden;
      line-height: 1;
      opacity: 0.3;
    }
    .page-text span {
      cursor: text;
      position: absolute;
      white-space: pre;
      color: transparent;
      transform-origin: 0% 0%;
    }
    .page-text ::selection {
      background: rgba(104,104,128,1);
    }
  </style>
`;

export const html = /*html*/`
  <div id="main-container" class="hide-previewer">
    <div id="panel-top"> 
      <div id="toggle-previewer" class="panel-button panel-item">
        <img src="${sidebar}"/>
      </div> 
      <div id="annotator" class="panel-item">
      </div>
    </div>
    <div id="viewer-container">
      <div id="previewer"></div>
      <div id="viewer"></div>
    </div>
    <div id="panel-bottom" class="disabled">
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
  </div>
`;
