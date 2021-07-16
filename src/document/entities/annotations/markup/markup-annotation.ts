import { Vec2 } from "mathador";

import { Quadruple } from "../../../../common/types";
import { buildTextDataAsync, TextData, TextDataOptions, TextLineData } from "../../../../common/text-data";
import { BEZIER_CONSTANT, LINE_END_MIN_SIZE, 
  LINE_END_MULTIPLIER } from "../../../../drawing/utils";

import { AnnotationType, markupAnnotationReplyTypes, MarkupAnnotationReplyType,
  LineEndingType, lineEndingTypes, valueTypes } from "../../../spec-constants";
import { CryptInfo } from "../../../encryption/interfaces";
import { ParserResult } from "../../../data-parse/data-parser";
import { ParserInfo } from "../../../data-parse/parser-info";

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
      bytes.push(...encoder.encode("/Popup "), ...this.Popup.toArray(cryptInfo));
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
      bytes.push(...encoder.encode("/IRT "), ...this.IRT.toArray(cryptInfo));
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
  protected override async parsePropsAsync(parseInfo: ParserInfo) {
    await super.parsePropsAsync(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 
    
    let i = await parser.skipToNextNameAsync(start, end - 1);
    let name: string;
    let parseResult: ParserResult<string>;
    while (true) {
      parseResult = await parser.parseNameAtAsync(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/T":
          case "/Subj":
            i = await this.parseLiteralPropAsync(name, parser, i, parseInfo.cryptInfo);
            break;
          
          case "/Popup":
          case "/IRT":
            i = await this.parseRefPropAsync(name, parser, i);
            break;

          case "/RC":    
            // TODO: test it   
            const rcEntryType = await parser.getValueTypeAtAsync(i);
            if (rcEntryType === valueTypes.REF) {    
              // should be reference to text stream or literal string           
              const rsObjectId = await ObjectId.parseRefAsync(parser, i);
              if (rsObjectId && parseInfo.parseInfoGetterAsync) {
                const rcParseInfo = await parseInfo.parseInfoGetterAsync(rsObjectId.value.id);
                if (rcParseInfo) {
                  const rcObjectType = rcParseInfo.type 
                    || rcParseInfo.parser.getValueTypeAtAsync(rcParseInfo.bounds.contentStart);
                  if (rcObjectType === valueTypes.STRING_LITERAL) {
                    // reference is to the indirect literal string 
                    // or to the string in an object stream 
                    const popupTextFromIndirectLiteral = 
                      await LiteralString.parseAsync(
                        rcParseInfo.parser, rcParseInfo.bounds.contentStart);
                    if (popupTextFromIndirectLiteral) {
                      this.RC = popupTextFromIndirectLiteral.value;
                      i = rsObjectId.end + 1;
                      break;
                    }
                  } else if (rcObjectType === valueTypes.DICTIONARY) {
                    // should be a text stream. check it
                    const popupTextStream = await TextStream.parseAsync(rcParseInfo);
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
              const popupTextFromLiteral = await LiteralString.parseAsync(parser, i, parseInfo.cryptInfo);
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
            i = await this.parseNumberPropAsync(name, parser, i, true);
            break;   
          
          case "/CreationDate":
            i = await this.parseDatePropAsync(name, parser, i, parseInfo.cryptInfo);
            break;

          case "/RT":
            const replyType = await parser.parseNameAtAsync(i, true);
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
            i = await parser.skipToNextNameAsync(i, end - 1);
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
    const textData = await buildTextDataAsync(text, options);
    this._textData = textData;
    return this._textData;
  }
  
  protected getLineEndingStreamPart(point: Vec2, type: LineEndingType, 
    strokeWidth: number, side: "left" | "right"): string {
    const size = Math.max(strokeWidth * LINE_END_MULTIPLIER, 
      LINE_END_MIN_SIZE);

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
        const c = BEZIER_CONSTANT;
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
