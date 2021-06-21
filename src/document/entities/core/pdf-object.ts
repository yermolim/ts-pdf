import { CryptInfo, IEncodable } from "../../encryption/interfaces";
import { Reference } from "../../references/reference";
import { DataParser, ParserResult } from "../../data-parse/data-parser";
import { DateString } from "../strings/date-string";
import { HexString } from "../strings/hex-string";
import { LiteralString } from "../strings/literal-string";
import { ObjectId } from "./object-id";
import { codes } from "../../encoding/char-codes";

export abstract class PdfObject implements IEncodable {
  /**action to execute on change of any of the public properties of the current object using proxy */
  $onChangeAction: () => void;
  /**action to execute on user edit of the current object */
  $onEditAction: (undo?: () => Promise<void>) => void;

  protected _sourceBytes: Uint8Array;
  /**
   * copy of the PDF object source bytes 
   */
  get sourceBytes(): Uint8Array {
    return this._sourceBytes?.slice();
  }
  get sourceChars(): string {    
    return this._sourceBytes
      ? String.fromCharCode(...this._sourceBytes.slice(0, this._sourceBytes.length))
      : "";
  }

  //#region reference
  protected _ref: Reference;
  get ref(): Reference {
    return this._ref;
  }
  set ref(ref: Reference) {
    this._ref = ref;
  }
  /**PDF object id */
  get id(): number {
    return this._ref?.id;
  }
  /**PDF object generation */
  get generation(): number {
    return this._ref?.generation;
  } 
  //#endregion 
  
  //#region detecting changes
  /**proxy object used for detecting changes to public properties */
  protected _proxy: PdfObject; 
  
  protected _added = false;
  get added(): boolean {
    return this._added;
  }   

  protected _edited = false;
  /**
   * 'true' value means that at least one of the public properties of the current object 
   * was changed after the object had been parsed 
   */
  get edited(): boolean {
    return this._edited;
  }   

  protected _deleted = false;
  /**
   * 'true' value means the object marked as deleted
   */
  get deleted(): boolean {
    return this._deleted;
  }

  /**
   * proxy change handler
   */
  protected onChange: ProxyHandler<PdfObject> = {
    set: (target: PdfObject, prop: string, value: any) => {  
      // DEBUG
      // console.log(this._edited);
      
      if (prop[0] !== "_" && prop[0] !== "$") {
        // if any public property except those starting with '$' changed, 
        // then set the 'edited' flag to 'true'        
        this._edited ||= true;

        // DEBUG
        // console.log(`EDITED prop ${prop}`);
        // console.log(this);
  
        if (this.$onChangeAction) {     
          this.$onChangeAction();
        }
      }
      // proceed assignment as usual
      target[prop] = value;
      return true;
    },
  };
  //#endregion

  protected constructor() {
    
  }
  
  markAsDeleted(value = true) {
    this._deleted = value;
  }

  protected initProxy(): PdfObject {    
    const proxy = new Proxy<PdfObject>(this, this.onChange);
    this._proxy = proxy;
    return proxy;
  }

  protected getProxy(): PdfObject {
    return this._proxy || this;
  }  

  protected encodePrimitiveArray(array: (number | string)[] | readonly (number | string)[], 
    encoder?: TextEncoder): number[] {       
    encoder ||= new TextEncoder();  
    const bytes: number[] = [codes.L_BRACKET];
    array.forEach(x => bytes.push(...encoder.encode(" " + x))); 
    bytes.push(codes.R_BRACKET);
    return bytes;
  }
  
  protected encodeNestedPrimitiveArray(array: (number | string)[][] | readonly (number | string)[][], 
    encoder?: TextEncoder): number[] {       
    encoder ||= new TextEncoder();  
    const bytes: number[] = [codes.L_BRACKET];    
    array.forEach(x => {        
      bytes.push(codes.L_BRACKET);
      x.forEach(y => bytes.push(...encoder.encode(" " + y)));         
      bytes.push(codes.R_BRACKET);
    });
    bytes.push(codes.R_BRACKET);
    return bytes;
  }
  
  protected encodeSerializableArray(array: IEncodable[], cryptInfo?: CryptInfo): number[] {
    const bytes: number[] = [codes.L_BRACKET];
    array.forEach(x => bytes.push(codes.WHITESPACE, ...x.toArray(cryptInfo)));
    bytes.push(codes.R_BRACKET);
    return bytes;
  }

  //#region parse simple properties 
  protected parseRefProp(propName: string, parser: DataParser, index: number): number {
    const parsed = ObjectId.parseRef(parser, index);
    return this.setParsedProp(propName, parsed);
  }

  protected parseRefArrayProp(propName: string, parser: DataParser, index: number): number {
    const parsed = ObjectId.parseRefArray(parser, index);
    return this.setParsedProp(propName, parsed);
  }
  
  protected parseBoolProp(propName: string, parser: DataParser, index: number): number {
    const parsed = parser.parseBoolAt(index);
    return this.setParsedProp(propName, parsed);
  }
  
  protected parseNameProp(propName: string, parser: DataParser, index: number, includeSlash = true): number {
    const parsed = parser.parseNameAt(index, includeSlash);
    return this.setParsedProp(propName, parsed);
  }
  
  protected parseNameArrayProp(propName: string, parser: DataParser, index: number, includeSlash = true): number {
    const parsed = parser.parseNameArrayAt(index, includeSlash);
    return this.setParsedProp(propName, parsed);
  }

  protected parseNumberProp(propName: string, parser: DataParser, index: number, float = true): number {
    const parsed = parser.parseNumberAt(index, float);
    return this.setParsedProp(propName, parsed);
  }
    
  protected parseNumberArrayProp(propName: string, parser: DataParser, index: number, float = true): number {
    const parsed = parser.parseNumberArrayAt(index, float);
    return this.setParsedProp(propName, parsed);
  }
  
  protected parseDateProp(propName: string, parser: DataParser, index: number, cryptInfo?: CryptInfo): number {
    const parsed = DateString.parse(parser, index, cryptInfo);
    return this.setParsedProp(propName, parsed);
  }

  protected parseLiteralProp(propName: string, parser: DataParser, index: number, cryptInfo?: CryptInfo): number {
    const parsed = LiteralString.parse(parser, index, cryptInfo);
    return this.setParsedProp(propName, parsed);
  }
  
  protected parseHexProp(propName: string, parser: DataParser, index: number, cryptInfo?: CryptInfo): number {
    const parsed = HexString.parse(parser, index, cryptInfo);
    return this.setParsedProp(propName, parsed);
  }

  private setParsedProp(propName: string, parsed: ParserResult<any>): number {
    if (!parsed) {
      throw new Error(`Can't parse ${propName} property value`);
    }
    this[propName.slice(1)] = parsed.value;
    return parsed.end + 1;
  }
  //#endregion

  /**
   * serialize the object to the byte array compliant to the PDF specification
   * @param cryptInfo 
   * @returns 
   */
  abstract toArray(cryptInfo?: CryptInfo): Uint8Array;
}
