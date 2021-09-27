/// <reference path="./assets.d.ts" />

import { getCommonStyles } from "ts-viewers-core";

const appName = "tspdf";

export const styles = /*html*/`
<style>
  ${getCommonStyles(appName)}
  
  #bottom-panel {
    left: calc(50% - 200px);
    width: 400px;
  }
  .compact #bottom-panel {  
    left: calc(50% - 160px);  
    width: 320px;
  }

  #viewer {
    justify-content: flex-start;
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
    color: var(--${appName}-color-fg-primary-final);
    background-color: var(--${appName}-color-primary-final);
  }
  #paginator-total {
    margin: 4px;
  }

  .page-container {
    margin: 10px auto;
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
  }
  .page-text span {
    cursor: text;
    position: absolute;
    white-space: pre;
    color: transparent;
    transform-origin: 0% 0%;
  }
  .page-text ::selection {
    background: var(--${appName}-color-text-selection-final);
  }
  .mode-hand .page-text span {
    cursor: grab;
  }
  .dummy-corner {    
    position: absolute;
    width: 0;
    height: 0;
  }
  .dummy-corner.bl {
    bottom: 0;
    left: 0;
  }
  .dummy-corner.br {
    bottom: 0;
    right: 0;
  }
  .dummy-corner.tr {
    top: 0;
    right: 0;
  }
  .dummy-corner.tl {
    top: 0;
    left: 0;
  }

  .password-dialog {
    z-index: 10;
    pointer-events: all !important;
  }
  .password-dialog .form {
    position: absolute;
    display: flex;
    flex-direction: row;
    justify-content: stretch;
    align-items: stretch;
    flex-grow: 0;
    flex-shrink: 0;
    left: calc(50% - 160px);
    top: calc(50% - 25px);
    width: 320px;
    height: 50px;
    background: var(--${appName}-color-primary-tr-final);
    box-shadow: 0 0 10px var(--${appName}-color-shadow-final);
  }
  .password-dialog input {
    width: 220px;
    margin: 10px 0 10px 10px;
    padding: 5px;
    font-size: 16px;
    outline: none;
    border: none;
    color: var(--${appName}-color-fg-primary-final);
    background-color: var(--${appName}-color-primary-final);
  }
  .password-dialog input::placeholder {
    font-size: 14px;
    font-style: italic;
    color: var(--${appName}-color-fg-primary-final);
  }
  .password-dialog .buttons {
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    flex-shrink: 1;
    width: 100px;
  }
  .mode-comparison .page-annotations,
  .mode-comparison .page-text {
    visibility: hidden;
  }
</style>
`;
