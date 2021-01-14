/// <reference path="./globals.d.ts" />

import icon_arrow_up from "./icons/arrow-up.png";
import icon_arrow_down from "./icons/arrow-down.png";
import icon_minus from "./icons/minus.png";
import icon_plus from "./icons/plus.png";
import icon_fit_viewer from "./icons/fit-viewer.png";
import icon_fit_page from "./icons/fit-page.png";

export const styles = /*html*/`
  <style>
    #viewer-container {
      box-sizing: border-box;
      position: relative;
      display: flex;
      flex-direction: column;
      justify-content: stretch;
      align-items: stretch;
      width: 100%;
      height: 100%;
      overflow-x: none;
      overflow-y: none;
      background: gray;
    }
  
    #panel-top {
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      flex-shrink: 0;
      width: 100%;
      height: 50px;
      background: #404040;
      box-shadow: 0 0 10px rgba(0,0,0,0.75);
      z-index: 1;
      transition: height 0.25s ease-out 0.1s;
    }
    .hide-panels #panel-top {
      height: 0;
      transition: height 0.25s ease-in 0.1s;
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
      background: #404040;
      box-shadow: 0 0 10px rgba(0,0,0,0.75);
      z-index: 1;
      transition: height 0.25s ease-out, bottom 0.1s linear 0.25s;
    }
    .hide-panels #panel-bottom {
      bottom: 0;
      height: 0;
      transition: bottom 0.1s linear, height 0.25s ease-in 0.1s;
    }
  
    .panel-separator {
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
    .panel-button:hover {
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
  
    #pages-container {
      box-sizing: border-box;
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      overflow: auto;
      padding-top: 0px;
      transition: padding-top 0.25s ease-out 0.1s;
    }
    .hide-panels #page-container {
      padding-top: 40px;
      transition: padding-top 0.25s ease-in 0.1s;
    }
  
    .page {    
      margin: 10px auto;
      box-shadow: 0 0 10px rgba(0,0,0,0.75);
    }
    .page-canvas {
      background-color: white;
    }  
  </style>
`;

export const html = /*html*/`
  <div id="viewer-container">
    <div id="panel-top"></div>
    <div id="pages-container"></div>
    <div id="panel-bottom">
      <div id="paginator" class="subpanel">
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
      <div class="panel-separator"></div>
      <div id="zoomer" class="subpanel">
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
