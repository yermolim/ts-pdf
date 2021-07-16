
import { Vec2 } from "mathador";
import { runEmptyTimeout } from "./dom";
import { Quadruple } from "./types";

export interface TextLineData {
  text: string;
  rect: Quadruple;
  relativeRect: Quadruple;
}

export interface TextData {
  width: number;
  height: number;
  rect: Quadruple;
  relativeRect: Quadruple;
  lines: TextLineData[];
}

export interface TextDataOptions {
  maxWidth: number;
  fontSize: number;
  strokeWidth: number;
  textAlign: "left" | "center" | "right";
  pivotPoint: "top-left" | "center" | "bottom-margin";
}

export async function buildTextDataAsync(text: string, options: TextDataOptions): Promise<TextData> {
  // const text = "Lorem-Ipsum is simply\ndummy, text of the печати, and typesetting industry.";
  let result: TextData;

  if (text) {
    const pTemp = document.createElement("p");
    // apply default text styling
    // TODO: add support for custom styling using 'this._rtStyle' prop or smth else
    pTemp.style.color = "black";
    pTemp.style.fontSize = options.fontSize + "px";
    pTemp.style.fontFamily = "arial";
    pTemp.style.fontWeight = "normal";
    pTemp.style.fontStyle = "normal";
    pTemp.style.lineHeight = "normal";
    pTemp.style.overflowWrap = "normal";
    pTemp.style.textAlign = options.textAlign;
    pTemp.style.textDecoration = "none";
    pTemp.style.verticalAlign = "top";
    pTemp.style.whiteSpace = "pre-wrap";
    pTemp.style.wordBreak = "normal";

    // apply specific styling to the paragraph to hide it from the page;
    pTemp.style.position = "fixed";
    pTemp.style.left = "0";
    pTemp.style.top = "0";
    pTemp.style.margin = "0";
    pTemp.style.padding = "0";
    pTemp.style.maxWidth = options.maxWidth.toFixed() + "px";       
    pTemp.style.visibility = "hidden"; // DEBUG pTemp.style.zIndex = "100"; 
    pTemp.style.transform = "scale(0.1)";
    pTemp.style.transformOrigin = "top left";

    // add the paragraph to DOM
    document.body.append(pTemp);
    
    // detect wrapped lines
    // TODO: improve detecting logic
    const words = text.split(/([- \n\r])/u); //[-./\\()"',;<>~!@#$%^&*|+=[\]{}`~?: ] 
    const lines: string[] = [];
    let currentLineText = "";
    let previousHeight = 0;
    for (let i = 0; i < words.length; i++) {
      const word = words[i];
      pTemp.textContent += word;        
      await runEmptyTimeout(); // allow DOM to redraw to recalculate dimensions
      const currentHeight = pTemp.offsetHeight;
      previousHeight ||= currentHeight;
      if (currentHeight > previousHeight) {
        // line break triggered
        lines.push(currentLineText);
        currentLineText = word;
        previousHeight = currentHeight;
      } else {
        currentLineText += word;
      }
    }
    lines.push(currentLineText);

    // clear the paragraph
    pTemp.innerHTML = "";

    // create temp span for each line to get line positions
    const lineSpans: HTMLSpanElement[] = [];
    for (const line of lines) {
      const lineSpan = document.createElement("span");
      lineSpan.style.position = "relative";
      lineSpan.textContent = line;
      lineSpans.push(lineSpan);
      pTemp.append(lineSpan);
    }      
    await runEmptyTimeout(); // allow DOM to redraw to recalculate dimensions

    const textWidth = pTemp.offsetWidth;
    const textHeight = pTemp.offsetHeight;
    
    // calculate the text pivot point
    let pivotPoint: Vec2;
    switch (options.pivotPoint) {
      case "top-left":          
        pivotPoint = new Vec2(0, textHeight);
        break;
      case "bottom-margin":
        pivotPoint = new Vec2(textWidth / 2, options.strokeWidth);
        break;
      case "center":
      default:
        pivotPoint = new Vec2(textWidth / 2, textHeight / 2);
        break;
    }

    // calculate dimensions for each line
    const lineData: TextLineData[] = [];
    for (let i = 0; i < lines.length; i++) {
      const span = lineSpans[i];
      const x = span.offsetLeft;
      const y = span.offsetTop;
      const width = span.offsetWidth;
      const height = span.offsetHeight;
      // line dimensions in PDF CS 
      // (Y-axis is flipped, bottom-left corner is 0,0)
      const lineBottomLeftPdf = new Vec2(x, textHeight - (y + height));
      const lineTopRightPdf = new Vec2(x + width, textHeight - y);
      const lineRect: Quadruple = [
        lineBottomLeftPdf.x, lineBottomLeftPdf.y,
        lineTopRightPdf.x, lineTopRightPdf.y
      ];
      // line dimensions relative to annotation text pivot point 
      // (Y-axis is flipped, pivot point is 0,0)
      const lineBottomLeftPdfRel = Vec2.subtract(lineBottomLeftPdf, pivotPoint);
      const lineTopRightPdfRel = Vec2.subtract(lineTopRightPdf, pivotPoint);
      const lineRelativeRect: Quadruple = [
        lineBottomLeftPdfRel.x, lineBottomLeftPdfRel.y,
        lineTopRightPdfRel.x, lineTopRightPdfRel.y
      ];
      lineData.push({
        text: lines[i],
        rect: lineRect,
        relativeRect: lineRelativeRect,
      });
    }

    // calculate dimensions for the whole text
    // text dimensions in PDF CS 
    // (Y-axis is flipped, bottom-left corner is 0,0)
    const textRect: Quadruple = [0, 0, textWidth, textHeight];
    // text dimensions relative to annotation text pivot point 
    // (Y-axis is flipped, pivot point is 0,0)
    const textRelativeRect: Quadruple = [
      0 - pivotPoint.x, 0 - pivotPoint.y,
      textWidth - pivotPoint.x, textHeight - pivotPoint.y
    ];
    const textData: TextData = {
      width: textWidth,
      height: textHeight,
      rect: textRect,
      relativeRect: textRelativeRect,
      lines: lineData,
    };

    // remove the temp paragraph from DOM 
    pTemp.remove();

    result = textData;
  } else {
    result = null;
  }

  return result;
}
