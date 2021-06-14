import { Vec2 } from "mathador";

import { Quadruple } from "../../../../common/types";
import { runEmptyTimeout } from "../../../../common/dom";
import { TextData, TextDataOptions, TextLineData } from "../../../../common/text-data";
import { bezierConstant, lineEndingMinimalSize, 
  lineEndingMultiplier } from "../../../../drawing/utils";

import { codes } from "../../../encoding/char-codes";
import { AnnotationType, markupAnnotationReplyTypes, MarkupAnnotationReplyType,
  LineEndingType, lineEndingTypes, valueTypes } from "../../../spec-constants";
import { CryptInfo } from "../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../data-parser";

import { DateString } from "../../strings/date-string";
import { LiteralString } from "../../strings/literal-string";
import { ObjectId } from "../../core/object-id";
import { TextStream } from "../../streams/text-stream";

import { AnnotationDict } from "../annotation-dict";
import { ExDataDict } from "../misc/ex-data-dict";

export abstract class MarkupAnnotation extends AnnotationDict {
  /**
   * (Optional; PDF 1.1+) The text label that shall be displayed in the title bar 
   * of the annotation’s pop-up window when open and active. 
   * This entry shall identify the user who added the annotation
   */
  T: LiteralString;
  /**
   * (Optional; PDF 1.3+) An indirect reference to a pop-up annotation 
   * for entering or editing the text associated with this annotation
   */
  Popup: ObjectId;
  /**
   * (Optional; PDF 1.5+) A rich text string that shall be displayed 
   * in the pop-up window when the annotation is opened
   */
  RC: LiteralString;
  /**
   * (Optional; PDF 1.4+) The constant opacity value
   */
  CA: number;
  /**
   * (Optional; PDF 1.5+) The date and time when the annotation was created
   */
  CreationDate: DateString;
  /**
   * (Optional; PDF 1.5+) Text representing a short description of the subject 
   * being addressed by the annotation
   */
  Subj: LiteralString;
  /**
   * (Required if an RT entry is present, otherwise optional; PDF 1.5+) 
   * A reference to the annotation that this annotation is “in reply to.” 
   * Both annotations shall be on the same page of the document. 
   * The relationship between the two annotations shall be specified by the RT entry
   */
  IRT: ObjectId;
  /**
   * (Optional; meaningful only if IRT is present; PDF 1.6+) 
   * A name specifying the relationship (the “reply type”) 
   * between this annotation and one specified by IRT
   */
  RT: MarkupAnnotationReplyType = markupAnnotationReplyTypes.REPLY;
  /**
   * (Optional; PDF 1.7+) An external data dictionary specifying data 
   * that shall be associated with the annotation
   */
  ExData: ExDataDict;  

  protected _textData: TextData;

  protected constructor(subType: AnnotationType) {
    super(subType);
  }
  
  override toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.T) {
      bytes.push(...encoder.encode("/T "), ...this.T.toArray(cryptInfo));
    }
    if (this.Popup) {
      bytes.push(...encoder.encode("/Popup "), codes.WHITESPACE, ...this.Popup.toArray(cryptInfo));
    }
    if (this.RC) {
      bytes.push(...encoder.encode("/RC "), ...this.RC.toArray(cryptInfo));
    }
    if (this.CA) {
      bytes.push(...encoder.encode("/CA "), ...encoder.encode(" " + this.CA));
    }
    if (this.CreationDate) {
      bytes.push(...encoder.encode("/CreationDate "), ...this.CreationDate.toArray(cryptInfo));
    }
    if (this.Subj) {
      bytes.push(...encoder.encode("/Subj "), ...this.Subj.toArray(cryptInfo));
    }
    if (this.IRT) {
      bytes.push(...encoder.encode("/IRT "), codes.WHITESPACE, ...this.IRT.toArray(cryptInfo));
    }
    if (this.RT) {
      bytes.push(...encoder.encode("/RT "), ...encoder.encode(this.RT));
    }

    const totalBytes: number[] = [
      ...superBytes.subarray(0, 2), // <<
      ...bytes, 
      ...superBytes.subarray(2, superBytes.length)];
    return new Uint8Array(totalBytes);
  }
  
  /**
   * fill public properties from data using info/parser if available
   */
  protected override parseProps(parseInfo: ParseInfo) {
    super.parseProps(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    let i = parser.skipToNextName(start, end - 1);
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/T":
          case "/Subj":
            i = this.parseLiteralProp(name, parser, i, parseInfo.cryptInfo);
            break;
          
          case "/Popup":
          case "/IRT":
            i = this.parseRefProp(name, parser, i);
            break;

          case "/RC":    
            // TODO: test it   
            const rcEntryType = parser.getValueTypeAt(i);
            if (rcEntryType === valueTypes.REF) {    
              // should be reference to text stream or literal string           
              const rsObjectId = ObjectId.parseRef(parser, i);
              if (rsObjectId && parseInfo.parseInfoGetter) {
                const rcParseInfo = parseInfo.parseInfoGetter(rsObjectId.value.id);
                if (rcParseInfo) {
                  const rcObjectType = rcParseInfo.type 
                    || rcParseInfo.parser.getValueTypeAt(rcParseInfo.bounds.contentStart);
                  if (rcObjectType === valueTypes.STRING_LITERAL) {
                    // reference is to the indirect literal string 
                    // or to the string in an object stream 
                    const popupTextFromIndirectLiteral = LiteralString
                      .parse(rcParseInfo.parser, rcParseInfo.bounds.contentStart);
                    if (popupTextFromIndirectLiteral) {
                      this.RC = popupTextFromIndirectLiteral.value;
                      i = rsObjectId.end + 1;
                      break;
                    }
                  } else if (rcObjectType === valueTypes.DICTIONARY) {
                    // should be a text stream. check it
                    const popupTextStream = TextStream.parse(rcParseInfo);
                    if (popupTextStream) {
                      const popupTextFromStream = popupTextStream.value.getText();
                      this.RC = LiteralString.fromString(popupTextFromStream);
                      i = rsObjectId.end + 1;
                      break;
                    }
                  } else {                     
                    throw new Error(`Unsupported /RC property value type: ${rcObjectType}`);
                  }
                }
              }              
              throw new Error("Can't parse /RC value reference");
            } else if (rcEntryType === valueTypes.STRING_LITERAL) { 
              const popupTextFromLiteral = LiteralString.parse(parser, i, parseInfo.cryptInfo);
              if (popupTextFromLiteral) {
                this.RC = popupTextFromLiteral.value;
                i = popupTextFromLiteral.end + 1;
                break;
              } else {              
              }
              throw new Error("Can't parse /RC property value"); 
            }
            throw new Error(`Unsupported /RC property value type: ${rcEntryType}`);
          
          case "/CA":
            i = this.parseNumberProp(name, parser, i, true);
            break;   
          
          case "/CreationDate":
            i = this.parseDateProp(name, parser, i, parseInfo.cryptInfo);
            break;

          case "/RT":
            const replyType = parser.parseNameAt(i, true);
            if (replyType && (<string[]>Object.values(markupAnnotationReplyTypes))
              .includes(replyType.value)) {
              this.RT = <MarkupAnnotationReplyType>replyType.value;
              i = replyType.end + 1;              
            } else {              
              throw new Error("Can't parse /RT property value");
            }
            break; 
          
          case "/ExData":
            // TODO: handle this case
            break;
          default:
            // skip to next name
            i = parser.skipToNextName(i, end - 1);
            break;
        }
      } else {
        break;
      }
    };
    
    if (!this.Subtype || !this.Rect) {
      throw new Error("Not all required properties parsed");
    }
  }

  protected getColorRect(): Quadruple {    
    let r = 0;
    let g = 0;
    let b = 0;
    let a = 1;
    if (this.C) {
      if (this.C.length === 1) {
        const gray = this.C[0];
        r = g = b = gray;
      } else if (this.C.length === 3) {
        [r, g, b] = this.C;
      } else if (this.C.length === 4) {      
        const [c, m, y, k] = this.C;
        r = (1 - c) * (1 - k);
        g = (1 - m) * (1 - k);
        b = (1 - y) * (1 - k);
      }
    }
    if (!isNaN(this.CA)) {
      a = this.CA;
    }
    const color: Quadruple = [r, g, b, a];
    return color;
  }
  
  protected async updateTextDataAsync(options: TextDataOptions): Promise<TextData> {
    const text = this.Contents?.literal;
    // const text = "Lorem-Ipsum is simply\ndummy, text of the печати, and typesetting industry.";
    
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
          pivotPoint = new Vec2(textWidth / 2, -this.strokeWidth);
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

      this._textData = textData;
    } else {
      this._textData = null;
    }

    return this._textData;
  }
  
  protected getLineEndingStreamPart(point: Vec2, type: LineEndingType, 
    strokeWidth: number, side: "left" | "right"): string {
    const size = Math.max(strokeWidth * lineEndingMultiplier, 
      lineEndingMinimalSize);

    let text = "";
    switch (type) {
      case lineEndingTypes.ARROW_OPEN:
        if (side === "left") {      
          text += `\n${point.x + size} ${point.y + size / 2} m`;
          text += `\n${point.x} ${point.y} l`;
          text += `\n${point.x + size} ${point.y - size / 2} l`;
        } else {
          text += `\n${point.x - size} ${point.y + size / 2} m`;
          text += `\n${point.x} ${point.y} l`;
          text += `\n${point.x - size} ${point.y - size / 2} l`;
        }
        text += "\nS";
        return text;
      case lineEndingTypes.ARROW_OPEN_R:
        if (side === "left") {      
          text += `\n${point.x} ${point.y + size / 2} m`;
          text += `\n${point.x + size} ${point.y} l`;
          text += `\n${point.x} ${point.y - size / 2} l`;
        } else {
          text += `\n${point.x} ${point.y + size / 2} m`;
          text += `\n${point.x - size} ${point.y} l`;
          text += `\n${point.x} ${point.y - size / 2} l`;
        }
        text += "\nS";
        return text;
      case lineEndingTypes.ARROW_CLOSED:
        if (side === "left") {      
          text += `\n${point.x + size} ${point.y + size / 2} m`;
          text += `\n${point.x} ${point.y} l`;
          text += `\n${point.x + size} ${point.y - size / 2} l`;
        } else {
          text += `\n${point.x - size} ${point.y + size / 2} m`;
          text += `\n${point.x} ${point.y} l`;
          text += `\n${point.x - size} ${point.y - size / 2} l`;
        }
        text += "\ns";
        return text;
      case lineEndingTypes.ARROW_CLOSED_R:
        if (side === "left") {  
          text += `\n${point.x + size} ${point.y} m`; 
          text += `\n${point.x} ${point.y + size / 2} l`;
          text += `\n${point.x} ${point.y - size / 2} l`;
        } else { 
          text += `\n${point.x - size} ${point.y} m`;
          text += `\n${point.x} ${point.y - size / 2} l`;
          text += `\n${point.x} ${point.y + size / 2} l`;
        }
        text += "\ns";
        return text;
      case lineEndingTypes.BUTT:     
        text += `\n${point.x} ${point.y + size / 2} m`;
        text += `\n${point.x} ${point.y - size / 2} l`;
        text += "\nS";
        return text;
      case lineEndingTypes.SLASH:     
        text += `\n${point.x + size / 2} ${point.y + size / 2} m`;
        text += `\n${point.x - size / 2} ${point.y - size / 2} l`;
        text += "\nS";
        return text;        
      case lineEndingTypes.DIAMOND:     
        text += `\n${point.x} ${point.y + size / 2} m`;
        text += `\n${point.x + size / 2} ${point.y} l`;
        text += `\n${point.x} ${point.y - size / 2} l`;
        text += `\n${point.x - size / 2} ${point.y} l`;
        text += "\ns";
        return text;       
      case lineEndingTypes.SQUARE:     
        text += `\n${point.x - size / 2} ${point.y + size / 2} m`;
        text += `\n${point.x + size / 2} ${point.y + size / 2} l`;
        text += `\n${point.x + size / 2} ${point.y - size / 2} l`;
        text += `\n${point.x - size / 2} ${point.y - size / 2} l`;
        text += "\ns";
        return text;       
      case lineEndingTypes.CIRCLE:
        const c = bezierConstant;
        const r = size / 2;       
        const cw = c * r;
        const xmin = point.x - r;
        const ymin = point.y - r;
        const xmax = point.x + r;
        const ymax = point.y + r;
        // drawing four cubic bezier curves starting at the top tangent
        text += `\n${point.x} ${ymax} m`;
        text += `\n${point.x + cw} ${ymax} ${xmax} ${point.y + cw} ${xmax} ${point.y} c`;
        text += `\n${xmax} ${point.y - cw} ${point.x + cw} ${ymin} ${point.x} ${ymin} c`;
        text += `\n${point.x - cw} ${ymin} ${xmin} ${point.y - cw} ${xmin} ${point.y} c`;
        text += `\n${xmin} ${point.y + cw} ${point.x - cw} ${ymax} ${point.x} ${ymax} c`;
        text += "\nS";
        return text;
      case lineEndingTypes.NONE:
      default:
        return "";
    }
  }
}
