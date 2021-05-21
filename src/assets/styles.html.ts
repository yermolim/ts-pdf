/// <reference path="./assets.d.ts" />

export const styles = /*html*/`
<style>
  :host {
    --tspdf-color-primary-final: var(--tspdf-color-primary, rgba(40,40,40,1));
    --tspdf-color-primary-tr-final: var(--tspdf-color-primary-tr, rgba(40,40,40,0.9));
    --tspdf-color-secondary-final: var(--tspdf-color-secondary, rgba(60,60,60,1));
    --tspdf-color-secondary-tr-final: var(--tspdf-color-secondary-tr, rgba(60,60,60,0.9));
    --tspdf-color-accent-final: var(--tspdf-color-accent, rgba(96,96,96,1));
    --tspdf-color-shadow-final: var(--tspdf-color-shadow, rgba(0,0,0,0.75));
    --tspdf-color-bg-final: var(--tspdf-color-bg, rgba(128,128,128,1));
    --tspdf-color-fg-primary-final: var(--tspdf-color-fg-primary, rgba(255,255,255,1));
    --tspdf-color-fg-secondary-final: var(--tspdf-color-fg-secondary, rgba(187,187,187,1));
    --tspdf-color-fg-accent-final: var(--tspdf-color-fg-accent, rgba(255,204,0,1));
    --tspdf-color-text-selection-final: var(--tspdf-color-text-selection, rgba(104,104,128,0.3));
  }

  .disabled {
    pointer-events: none;
  }

  .relative {
    position: relative;
  }
  .absolute {
    position: absolute;
  }
  .abs-hidden {
    position: absolute;
    opacity: 0;
    z-index: -10;
  }
  .abs-stretch {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }
  .abs-topleft {
    position: absolute;
    left: 0;
    top: 0;
  }
  .stretch {
    width: 100%;
    height: 100%;
  }
  
  .no-margin {
    margin: 0;
  }
  .no-padding {
    padding: 0;
  }
  .margin-s-5 {
    margin: 0 5px;
  }

  .line-clamp {
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical; 
    overflow: hidden; 
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
    background: var(--tspdf-color-bg-final);
  }

  #top-panel {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    flex-shrink: 0;
    width: 100%;
    height: 50px;
    background: var(--tspdf-color-primary-final);
    box-shadow: 0 0 10px var(--tspdf-color-shadow-final);
    z-index: 4;
    transition: height 0.25s ease-out 0.1s;
  }
  .hide-panels #top-panel {
    height: 0;
    transition: height 0.25s ease-in 0.2s;
  }

  #bottom-panel {
    position: absolute;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    flex-grow: 0;
    flex-shrink: 0;
    left: calc(50% - 200px);
    bottom: 20px;
    width: 400px;
    height: 50px;  
    background: var(--tspdf-color-primary-tr-final);
    box-shadow: 0 0 10px var(--tspdf-color-shadow-final);
    z-index: 4;
    transition: height 0.25s ease-out, bottom 0.1s linear 0.25s;
  }
  .hide-panels #bottom-panel {
    bottom: 0;
    height: 0;
    transition: bottom 0.1s linear 0.1s, height 0.25s ease-in 0.2s;
  }
  .compact #bottom-panel {  
    left: calc(50% - 160px);  
    width: 320px;
  }
  .compact #zoom-fit-viewer,
  .compact #zoom-fit-page {  
    width: 0;  
    transform: scale(0);
  }

  #focused-annotation-panel {
    box-sizing: border-box;
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: stretch;
    flex-grow: 0;
    flex-shrink: 0;
    left: calc(50% - 120px);
    top: 80px;
    width: 240px;
    height: 84px; 
    padding: 18px;
    border-radius: 18px;
    background: var(--tspdf-color-secondary-tr-final);
    box-shadow: 0 0 10px var(--tspdf-color-shadow-final);
    opacity: 0;
    transform: scale(0);
    transition: opacity 0.1s ease-in, transform 0s linear 0.1s;
    z-index: 4;
  }
  .mobile #focused-annotation-panel {
    left: 20px;
    width: 150px;
  }
  .annotation-focused #focused-annotation-panel {
    opacity: 100;
    transform: scale(1);    
    transition: opacity 0.1s ease-out 0.35s, transform 0s linear 0.35s;
  }
  #focused-annotation-panel p {
    margin: 0;
    padding: 0;
    line-height: 16px;
    font-size: 12px;
    font-family: sans-serif;
    color: var(--tspdf-color-fg-primary-final);
  }
  
  #annotation-panel {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-end;
    flex-grow: 1;
    flex-shrink: 1;
    top: 80px;
    right: 20px;
    z-index: -5;
    transition: z-index 0s linear 0.25s;
    pointer-events: none;
  }
  .mode-annotation #annotation-panel {
    z-index: 5;
  }
  
  .annotation-panel-row {      
      display: flex;
      flex-direction: row;
      justify-content: flex-end;
      align-items: center;
      flex-grow: 1;
      flex-shrink: 1;
    }

  .annotation-panel-item {
    margin: 3px;
    cursor: default;      
    opacity: 0;
    background: var(--tspdf-color-primary-tr-final);
    box-shadow: 0 0 10px var(--tspdf-color-shadow-final);
    transform: scale(0);
    transition: opacity 0.1s ease-in, transform 0s linear 0.1s;
    pointer-events: all;
  }    
  .mode-annotation .annotation-panel-item { 
    cursor: pointer;
    opacity: 100;
    transform: scale(1);    
    transition: opacity 0.1s ease-out 0.35s, transform 0s linear 0.35s;
  }

  .annotation-panel-subitem {
    margin: 3px;    
    background: var(--tspdf-color-secondary-tr-final);
    box-shadow: 0 0 10px var(--tspdf-color-shadow-final);
    pointer-events: all;
  }  
  :not(.annotation-selected) #button-annotation-edit-text,
  :not(.annotation-selected) #button-annotation-delete,
  :not(.stamp-annotator-data-undoable) #button-annotation-stamp-undo,
  :not(.stamp-annotator-data-clearable) #button-annotation-stamp-clear,
  :not(.stamp-annotator-data-saveable) #button-annotation-stamp-save,
  :not(.pen-annotator-data-undoable) #button-annotation-pen-undo,
  :not(.pen-annotator-data-clearable) #button-annotation-pen-clear,
  :not(.pen-annotator-data-saveable) #button-annotation-pen-save,
  :not(.text-annotator-data-undoable) #button-annotation-text-undo,
  :not(.text-annotator-data-clearable) #button-annotation-text-clear,
  :not(.text-annotator-data-saveable) #button-annotation-text-save,
  :not(.geom-annotator-data-undoable) #button-annotation-geometric-undo,
  :not(.geom-annotator-data-clearable) #button-annotation-geometric-clear,
  :not(.geom-annotator-data-saveable) #button-annotation-geometric-save {
    cursor: default;      
    opacity: 0;
    transform: scale(0);
    transition: opacity 0.1s ease-in, transform 0s linear 0.1s;
  }
  .annotation-selected #button-annotation-edit-text,
  .annotation-selected #button-annotation-delete,
  .stamp-annotator-data-undoable #button-annotation-stamp-undo,
  .stamp-annotator-data-clearable #button-annotation-stamp-clear,
  .stamp-annotator-data-saveable #button-annotation-stamp-save,
  .pen-annotator-data-undoable #button-annotation-pen-undo,
  .pen-annotator-data-clearable #button-annotation-pen-clear,
  .pen-annotator-data-saveable #button-annotation-pen-save,
  .text-annotator-data-undoable #button-annotation-text-undo,
  .text-annotator-data-clearable #button-annotation-text-clear,
  .text-annotator-data-saveable #button-annotation-text-save,
  .geom-annotator-data-undoable #button-annotation-geometric-undo,
  .geom-annotator-data-clearable #button-annotation-geometric-clear,
  .geom-annotator-data-saveable #button-annotation-geometric-save { 
    cursor: pointer;
    opacity: 100;
    transform: scale(1);    
    transition: opacity 0.1s ease-out 0.35s, transform 0s linear 0.35s;
  }

  .panel-v-separator {
    width: 1px;
    height: 30px;
    background-color: var(--tspdf-color-fg-secondary-final);
  }

  .panel-button {
    cursor: pointer;
    user-select: none;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    flex-grow: 0;
    justify-content: center;
    align-items: center;
    width: 36px;
    height: 36px;
    border-radius: 50%;
  }
  .panel-button:hover,
  .panel-button.on {
    background-color: var(--tspdf-color-accent-final);
  }
  .panel-button img {
    width: 20px;
    height: 20px;
    filter: invert() opacity(0.5) drop-shadow(0 0 0 var(--tspdf-color-fg-primary-final)) saturate(1000%);
  }  
  .panel-button:hover img,
  .panel-button.on img {
    filter: invert() opacity(0.5) drop-shadow(0 0 0 var(--tspdf-color-fg-accent-final)) saturate(1000%);
  }  
  .disabled .panel-button img,
  .panel-button.disabled img {
    filter: invert() opacity(0.2) drop-shadow(0 0 0 var(--tspdf-color-fg-primary-final)) saturate(1000%);
  }  
  .context-menu-content .panel-button {
    margin: 1px;
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
    color: var(--tspdf-color-fg-primary-final);
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
    color: var(--tspdf-color-fg-primary-final);
    background-color: var(--tspdf-color-primary-final);
  }
  #paginator-total {
    margin: 4px;
  }

  #toggle-previewer {
    margin: 4px;
  }
    
  #previewer {
    box-sizing: border-box;
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    overflow-y: auto;
    left: 0;
    top: 50px;
    bottom: 0;
    width: 160px; 
    padding-top: 0px;
    background: var(--tspdf-color-secondary-final);
    box-shadow: 0 0 10px var(--tspdf-color-shadow-final);
    z-index: 3;
    transition: padding-top 0.25s ease-out 0.1s, top 0.25s ease-out 0.1s, width 0.25s ease-out;
  } 
  .hide-panels #previewer {
    top: 0;
    padding-top: 50px;
    transition: padding-top 0.25s ease-in 0.2s, top 0.25s ease-in 0.2s;
  }   
  .mobile #previewer {
    background: var(--tspdf-color-secondary-tr-final);
  } 
  .hide-previewer #previewer {
    width: 0;
    transition: width 0.25s ease-in 0.1s;
  }
  #previewer .page-preview {      
    transform: scaleX(1);
    transition: opacity 0.1s ease-out 0.35s, transform 0s linear 0.35s;
  }
  .hide-previewer #previewer .page-preview {
    opacity: 0;
    transform: scaleX(0);
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
    top: 50px;
    bottom: 0;
    padding-top: 0;
    transition: padding-top 0.25s ease-out 0.1s, top 0.25s ease-out 0.1s, left 0.25s ease-out;
  }
  #viewer.dialog-shown {
    overflow: hidden;
  }
  .mode-hand #viewer {
    cursor: grab !important;
    user-select: none !important;
  }
  .hide-panels #viewer {
    top: 0;
    padding-top: 50px;
    transition: padding-top 0.25s ease-in 0.2s, top 0.25s ease-in 0.2s;
  }      
  .hide-panels.mobile #viewer,
  .hide-panels.hide-previewer #viewer {
    top: 0;
    padding-top: 50px;
    left: 0;
    transition: padding-top 0.25s ease-in 0.2s, top 0.25s ease-in 0.2s, left 0.25s ease-in;
  }   
  .mobile #viewer,
  .hide-previewer #viewer {
    top: 50px;
    padding-top: 0px;
    left: 0;
    transition: padding-top 0.25s ease-out 0.1s, top 0.25s ease-out 0.1s, left 0.25s ease-in;
  }
  
  #annotation-overlay-container {
    position: absolute;
    top: 0; 
    right: 0;
    bottom: 0;
    left: 0; 
    margin-top: 0;
    transition: margin-top 0.25s ease-out 0.1s;
    z-index: 3;
  }
  .hide-panels #annotation-overlay-container {
    margin-top: 50px;
    transition: margin-top 0.25s ease-in 0.2s;
  }
  .mode-text-markup #annotation-overlay-container {
    pointer-events: none;
  }
  
  #annotation-overlay {
    position: absolute;
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    touch-action: none;
  }

  .page-container {    
    position: relative;
    display: flex;
    flex-grow: 0;
    flex-shrink: 0;
    margin: 10px auto;
    background-color: white;
    box-shadow: 0 0 10px var(--tspdf-color-shadow-final);
  }
  .page {    
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;    
    transform-origin: left top;
  }
  .page-preview {   
    cursor: pointer; 
    position: relative;
    display: flex;
    flex-grow: 0;
    flex-shrink: 0;
    margin: 0 auto;
    background-color: white;
    background-clip: content-box;
    border-style: solid;
    border-width: 10px 10px 20px 10px;
    border-color: transparent;
  }
  .page-preview:hover,
  .page-preview.current {
    border-color: var(--tspdf-color-accent-final);
  }
  .page-preview::after {
    display: inline-block;
    position: absolute;
    top: calc(100% + 3px);
    width: 100%;
    text-align: center;
    font-family: sans-serif;
    font-size: 14px;
    line-height: 1;
    color: var(--tspdf-color-fg-primary-final);
    content: attr(data-page-number) " ";
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
  }
  .page-text span {
    cursor: text;
    position: absolute;
    white-space: pre;
    color: transparent;
    transform-origin: 0% 0%;
  }
  .page-text ::selection {
    background: var(--tspdf-color-text-selection-final);
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
  
  .page-annotations {
    width: 0;
    height: 0;
  }
  .mode-text-markup .page-annotations,
  .mode-text .page-annotations,
  .mode-hand .page-annotations {
    pointer-events: none;
  }
  .page-annotations-controls,
  .annotation-content,
  .annotation-content-element {    
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
  }
  .page-annotations-controls {
    z-index: 2;
  }
  .annotation-content {
    pointer-events: none;
  }

  .abs-full-size-overlay {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: var(--tspdf-color-secondary-tr-final);
    touch-action: none;
  }
  
  .fixed-full-size-overlay {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background: var(--tspdf-color-secondary-tr-final);
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
    background: var(--tspdf-color-primary-tr-final);
    box-shadow: 0 0 10px var(--tspdf-color-shadow-final);
  }
  .password-dialog input {
    width: 220px;
    margin: 10px 0 10px 10px;
    padding: 5px;
    font-size: 16px;
    outline: none;
    border: none;
    color: var(--tspdf-color-fg-primary-final);
    background-color: var(--tspdf-color-primary-final);
  }
  .password-dialog input::placeholder {
    font-size: 14px;
    font-style: italic;
    color: var(--tspdf-color-fg-primary-final);
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
  
  .text-dialog {
    z-index: 9;
  }
  .text-dialog .form {
    box-sizing: border-box;
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    align-items: stretch;
    flex-grow: 0;
    flex-shrink: 0;
    left: calc(50% - 160px);
    top: calc(50% - 120px);
    width: 320px;
    height: 240px;
    padding: 5px;
    background: var(--tspdf-color-primary-tr-final);
    box-shadow: 0 0 10px var(--tspdf-color-shadow-final);
  }
  .text-dialog textarea {
    height: 100%;
    margin: 0 0 5px 0;
    padding: 5px;
    font-size: 14px;
    resize: none;
    outline: none;
    border: none;
    color: var(--tspdf-color-fg-primary-final);
    background-color: var(--tspdf-color-primary-final);
  }
  .text-dialog textarea::placeholder {
    font-size: 14px;
    font-style: italic;
    color: var(--tspdf-color-fg-primary-final);
  }
  .text-dialog .buttons {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    flex-grow: 1;
    flex-shrink: 1;
  } 
  
  .stamp-dialog {
    z-index: 9;
  }
  .stamp-dialog .form {
    position: absolute;
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    align-items: stretch;
    flex-grow: 0;
    flex-shrink: 0;
    left: 50%;
    top: 50%;
    width: 100%;
    height: 100%;
    max-width: 720px;
    max-height: 720px;
    background: var(--tspdf-color-primary-tr-final);
    box-shadow: 0 0 10px var(--tspdf-color-shadow-final);
    transform-origin: center;
    transform: translate(-50%, -50%)
  }
  .stamp-dialog .buttons {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    align-items: center;
    height: 40px;
  } 
  .stamp-dialog .form-canvas-wrapper {
    position: relative;
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    margin: 20px;
    flex-grow: 1;
    flex-shrink: 1;
  } 
  .stamp-dialog input {
    width: 100%;
    margin: 10px;
    padding: 5px;
    font-size: 16px;
    outline: none;
    border: none;
    color: var(--tspdf-color-fg-primary-final);
    background-color: var(--tspdf-color-primary-final);
  }
  .stamp-dialog input::placeholder {
    font-size: 14px;
    font-style: italic;
    color: var(--tspdf-color-fg-primary-final);
  }
  .stamp-input-row {    
    display: flex;
    flex-direction: row;
    justify-content: stretch;
    align-items: center;
    height: 30px;
    margin: 10px;
  }
  .stamp-input-row p {
    user-select: none;
    margin: 0;   
    padding: 0 10px;
    font-family: sans-serif; 
    font-size: 16px;
    white-space: nowrap;
    color: var(--tspdf-color-fg-secondary-final);
  }
  
  .abs-ratio-canvas {
    outline: 0;
    position: absolute;
    width: 100%;
    height: auto;
    max-height: 100%;
    border: 2px solid var(--tspdf-color-fg-secondary-final);
  }

  .annotation-controls {
    cursor: pointer;
  }     
  .annotation-out-of-page {
    cursor: not-allowed;
  }
  .annotation-rect,
  .annotation-bbox {
    fill: none;
  }
  .mode-annotation .annotation-controls.selected {
    cursor: grab;
  } 
  .mode-annotation .annotation-controls.selected .annotation-rect,
  .mode-annotation .annotation-controls.selected .annotation-bbox {
    stroke: var(--tspdf-color-secondary-tr-final);
    stroke-dasharray: 3 3;
  }   
  .mode-annotation .annotation-controls.focused .annotation-bbox {
    stroke: var(--tspdf-color-fg-accent-final);
    stroke-dasharray: 3 0;
  } 
  .mode-annotation .annotation-controls.selected .annotation-handle-scale,
  .mode-annotation .annotation-controls.selected .annotation-handle-rotation {
    r: 8;
    fill: var(--tspdf-color-primary-final);
    cursor: pointer;
  }
  .mode-annotation .annotation-controls.selected .annotation-rotator {
    fill: none;
    cursor: pointer;
  }
  .mode-annotation .annotation-controls.selected .annotation-rotator .circle {
    r: 25;
  }
  .mode-annotation .annotation-controls.selected .annotation-rotator .dashed {
    stroke: var(--tspdf-color-secondary-tr-final);
    stroke-dasharray: 3 3;
  }

  #context-menu {
    box-sizing: border-box;
    position: absolute;
    z-index: 5;
    min-width: 50px;
    min-height: 50px;
    max-height: 300px;
    padding: 5px;
    background: var(--tspdf-color-secondary-tr-final);
    box-shadow: 0 0 10px var(--tspdf-color-shadow-final);
    display: flex;
    flex-direction: column;
    justify-content: stretch;
    align-items: stretch;
    overflow-y: auto;
  }
  .context-menu-content {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-grow: 1;
    flex-shrink: 0;
  }
  .context-menu-content.row {
    flex-direction: row;
  }
  .context-menu-content.column {
    flex-direction: column;
  }
  .context-menu-color-icon {
    width: 20px;
    height: 20px;
    border-radius: 12px;
    border-width: 2px;
    border-style: solid;
    border-color: var(--tspdf-color-fg-secondary-final);
  }
  .context-menu-stamp-select-button {
    box-sizing: border-box;
    cursor: pointer;
    user-select: none;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: flex-start;
    width: 100%;
    height: 36px;
    padding: 0 5px;
    border-radius: 5px;
    font-family: sans-serif;
    font-size: 16px;
    color: var(--tspdf-color-fg-primary-final); 
  }
  .context-menu-stamp-select-button:hover,
  .context-menu-stamp-select-button.on {
    background-color: var(--tspdf-color-accent-final);
  }
  .context-menu-slider {
    -webkit-appearance: none;
    appearance: none;
    outline: none;
    margin: 10px;
    height: 5px;
    border-radius: 5px;
    cursor: pointer;
    background-color: var(--tspdf-color-fg-secondary-final);
  }
  .context-menu-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    outline: none;
    width: 20px;
    height: 20px;
    border-radius: 10px;
    cursor: pointer;
    background-color: var(--tspdf-color-accent-final);
  }
  .context-menu-slider::-moz-range-thumb {
    outline: none; 
    width: 20px;
    height: 20px;
    border-radius: 10px;
    cursor: pointer;
    background-color: var(--tspdf-color-accent-final);
  }

  #button-open-file {
    pointer-events: auto !important;
  }
  .disabled #button-open-file img {
    filter: invert() opacity(0.5) drop-shadow(0 0 0 var(--tspdf-color-fg-primary-final)) saturate(1000%);
  }

  .loader {
    position: absolute;
    left: calc(50% - 30px);
    top: calc(50% - 30px);
    width: 60px;
    height: 60px;
  }
  .loader div {   
    position: absolute; 
    width: 20px;
    height: 20px;
    margin: 5px;
    border-radius: 5px;
    animation-duration: 3s;
    animation-timing-function: linear;
    animation-iteration-count: infinite;
  }
  .loader div:nth-child(1) {
    animation-name: loaderone;
    background-color: var(--tspdf-color-accent-final);
  }
  .loader div:nth-child(2) {
    animation-name: loadertwo;
    background-color: var(--tspdf-color-fg-primary-final);  
  }
  .loader div:nth-child(3) {  
    animation-name: loaderthree;
    background-color: var(--tspdf-color-fg-secondary-final);  
  }

  @keyframes loaderone {
    from {
      left: 0;
      top: 0;
    }
    8.3% {
      left: 0;
      top: 0;
    }
    16.7% {
      left: 0;
      top: 0;
    }
    25% { 
      left: 30px;
      top: 0px; 
    }
    33.3% {
      left: 30px;
      top: 0px;        
    }
    41.7% {
      left: 30px;
      top: 0px;        
    }
    50% {
      left: 30px;
      top: 30px;         
    }
    58.3% {
      left: 30px;
      top: 30px;       
    }
    66.7% {      
      left: 30px;
      top: 30px;   
    }
    75% {
      left: 0;
      top: 30px;
    }
    83.3% {
      left: 0;
      top: 30px;
    }
    91.7% {
      left: 0;
      top: 30px;
    }
    to {   
      left: 0;
      top: 0;   
    }
  }
  @keyframes loadertwo {
    from {
      left: 30px;
      top: 0px;
    }
    8.3% {
      left: 30px;
      top: 0px;
    }
    16.7% {
      left: 30px;
      top: 30px;
    }
    25% { 
      left: 30px;
      top: 30px;
    }
    33.3% {
      left: 30px;
      top: 30px;
    }
    41.7% {
      left: 0;
      top: 30px;
    }
    50% {
      left: 0;
      top: 30px;
    }
    58.3% {
      left: 0;
      top: 30px;
    }
    66.7% {
      left: 0;
      top: 0;
    }
    75% {
      left: 0;
      top: 0;
    }
    83.3% {
      left: 0;
      top: 0;
    }
    91.7% {
      left: 30px;
      top: 0px;
    }
    to {
      left: 30px;
      top: 0px;
    }
  }
  @keyframes loaderthree {
    from {
      left: 30px;
      top: 30px;
    }
    8.3% {
      left: 0;
      top: 30px;
    }
    16.7% {
      left: 0;
      top: 30px;
    }
    25% { 
      left: 0;
      top: 30px;
    }
    33.3% {
      left: 0;
      top: 0;
    }
    41.7% {
      left: 0;
      top: 0;
    }
    50% {
      left: 0;
      top: 0;
    }
    58.3% {
      left: 30px;
      top: 0; 
    }
    66.7% {
      left: 30px;
      top: 0;
    }
    75% {
      left: 30px;
      top: 0;
    }
    83.3% {
      left: 30px;
      top: 30px;
    }
    91.7% {
      left: 30px;
      top: 30px;
    }
    to {
      left: 30px;
      top: 30px; 
    }
  }
</style>
`;
