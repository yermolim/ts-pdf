import { Quadruple, Hextuple, BBox, Double, customStampEvent, CustomStampEvent, CustomStampCreationInfo, CustomStampEventDetail } from 'ts-viewers-core';
export { CustomStampCreationInfo, CustomStampEventDetail } from 'ts-viewers-core';
import { Mat3, Vec3, Vec2 } from 'mathador';

interface PageInfo {
    readonly index: number;
    readonly number: number;
    readonly id: number;
    readonly generation: number;
    get width(): number;
    get height(): number;
    get rotation(): number;
    get scale(): number;
}

interface AnnotationRenderResult {
    controls: SVGGraphicsElement;
    content: HTMLDivElement;
}
interface AnnotationDto {
    annotationType: string;
    uuid: string;
    pageId: number;
    dateCreated: string;
    dateModified: string;
    author: string;
    textContent: string;
    rect: Quadruple;
    bbox?: Quadruple;
    matrix?: Hextuple;
}
interface RenderableAnnotation {
    $onPointerDownAction: (e: PointerEvent) => void;
    $onPointerEnterAction: (e: PointerEvent) => void;
    $onPointerLeaveAction: (e: PointerEvent) => void;
    get lastRenderResult(): AnnotationRenderResult;
    renderAsync(pageInfo: PageInfo): Promise<AnnotationRenderResult>;
    toDto(): AnnotationDto;
}

declare const objectTypes: {
    readonly UNKNOWN: 0;
    readonly NULL: 1;
    readonly BOOLEAN: 2;
    readonly NUMBER: 3;
    readonly STRING_LITERAL: 4;
    readonly STRING_HEX: 5;
    readonly NAME: 6;
    readonly ARRAY: 7;
    readonly DICTIONARY: 8;
    readonly STREAM: 9;
};
declare type ObjectType = typeof objectTypes[keyof typeof objectTypes];
declare const valueTypes: {
    readonly UNKNOWN: 0;
    readonly NULL: 1;
    readonly BOOLEAN: 2;
    readonly NUMBER: 3;
    readonly STRING_LITERAL: 4;
    readonly STRING_HEX: 5;
    readonly NAME: 6;
    readonly ARRAY: 7;
    readonly DICTIONARY: 8;
    readonly STREAM: 9;
    readonly REF: 10;
    readonly COMMENT: 11;
};
declare type ValueType = typeof valueTypes[keyof typeof valueTypes];
declare const dictTypes: {
    readonly XREF: "/XRef";
    readonly XOBJECT: "/XObject";
    readonly CATALOG: "/Catalog";
    readonly PAGE_TREE: "/Pages";
    readonly PAGE: "/Page";
    readonly ANNOTATION: "/Annot";
    readonly BORDER_STYLE: "/Border";
    readonly OPTIONAL_CONTENT_GROUP: "/OCG";
    readonly OPTIONAL_CONTENT_MD: "/OCMD";
    readonly EXTERNAL_DATA: "/ExDATA";
    readonly ACTION: "/Action";
    readonly MEASURE: "/Measure";
    readonly DEV_EXTENSIONS: "/DeveloperExtensions";
    readonly GRAPHICS_STATE: "/ExtGState";
    readonly CRYPT_FILTER: "/CryptFilter";
    readonly SOFT_MASK: "/Mask";
    readonly GROUP: "/Group";
    readonly FONT: "/Font";
    readonly FONT_DESCRIPTOR: "/FontDescriptor";
    readonly ENCODING: "/Encoding";
    readonly EMPTY: "";
};
declare type DictType = typeof dictTypes[keyof typeof dictTypes] | UserTypes;
declare const userTypes: {
    readonly INDIVIDUAL: "/Ind";
    readonly TITLE: "/Title";
    readonly ORGANIZATION: "/Org";
};
declare type UserTypes = typeof userTypes[keyof typeof userTypes];
declare const streamFilters: {
    readonly ASCII85: "/ASCII85Decode";
    readonly ASCIIHEX: "/ASCIIHexDecode";
    readonly CCF: "/CCITTFaxDecode";
    readonly CRYPT: "/Crypt";
    readonly DCT: "/DCTDecode";
    readonly FLATE: "/FlateDecode";
    readonly JBIG2: "/JBIG2Decode";
    readonly JPX: "/JPXDecode";
    readonly LZW: "/LZWDecode";
    readonly RLX: "/RunLengthDecode";
};
declare type StreamFilter = typeof streamFilters[keyof typeof streamFilters];
declare const streamTypes: {
    readonly XREF: "/XRef";
    readonly OBJECT_STREAM: "/ObjStm";
    readonly FORM_XOBJECT: "/XObject";
    readonly METADATA_STREAM: "/Metadata";
};
declare type StreamType = typeof streamTypes[keyof typeof streamTypes];
declare const annotationTypes: {
    readonly TEXT: "/Text";
    readonly LINK: "/Link";
    readonly FREE_TEXT: "/FreeText";
    readonly LINE: "/Line";
    readonly SQUARE: "/Square";
    readonly CIRCLE: "/Circle";
    readonly POLYGON: "/Polygon";
    readonly POLYLINE: "/PolyLine";
    readonly HIGHLIGHT: "/Highlight";
    readonly UNDERLINE: "/Underline";
    readonly SQUIGGLY: "/Squiggly";
    readonly STRIKEOUT: "/StrikeOut";
    readonly STAMP: "/Stamp";
    readonly CARET: "/Caret";
    readonly INK: "/Ink";
    readonly POPUP: "/Popup";
    readonly FILE_ATTACHMENT: "/FileAttachment";
    readonly SOUND: "/Sound";
    readonly MOVIE: "/Movie";
    readonly WIDGET: "/Widget";
    readonly SCREEN: "/Screen";
    readonly PRINTER_MARK: "/PrinterMark";
    readonly TRAPNET: "/TrapNet";
    readonly WATERMARK: "/Watermark";
    readonly THREED: "/3D";
    readonly REDACT: "/Redact";
    readonly PROJECTION: "/Projection";
    readonly RICH_MEDIA: "/RichMedia";
};
declare type AnnotationType = typeof annotationTypes[keyof typeof annotationTypes];
declare const lineCapStyles: {
    readonly BUTT: 0;
    readonly ROUND: 1;
    readonly SQUARE: 2;
};
declare type LineCapStyle = typeof lineCapStyles[keyof typeof lineCapStyles];
declare const lineJoinStyles: {
    readonly MITER: 0;
    readonly ROUND: 1;
    readonly BEVEL: 2;
};
declare type LineJoinStyle = typeof lineJoinStyles[keyof typeof lineJoinStyles];
declare const renderingIntents: {
    readonly ABSOLUTE: "/AbsoluteColorimetric";
    readonly RELATIVE: "/RelativeColorimetric";
    readonly SATURATION: "/Saturation";
    readonly PERCEPTUAL: "/Perceptual";
};
declare type RenderingIntent = typeof renderingIntents[keyof typeof renderingIntents];
declare const blendModes: {
    readonly NORMAL: "/Normal";
    readonly COMPATIBLE: "/Compatible";
    readonly MULTIPLY: "/Multiply";
    readonly SCREEN: "/Screen";
    readonly OVERLAY: "/Overlay";
    readonly DARKEN: "/Darken";
    readonly LIGHTEN: "/Lighten";
    readonly COLOR_DODGE: "/ColorDodge";
    readonly COLOR_BURN: "/ColorBurn";
    readonly HARD_LIGHT: "/HardLight";
    readonly SOFT_LIGHT: "/SoftLight";
    readonly DIFFERENCE: "/Difference";
    readonly EXCLUSION: "/Exclusion";
};
declare type BlendMode = typeof blendModes[keyof typeof blendModes];
declare const textRenderModes: {
    readonly FILL: 0;
    readonly STROKE: 1;
    readonly FILL_STROKE: 2;
    readonly INVISIBLE: 3;
    readonly FILL_USE_AS_CLIP: 4;
    readonly STROKE_USE_AS_CLIP: 5;
    readonly FILL_STROKE_USE_AS_CLIP: 6;
    readonly USE_AS_CLIP: 7;
};
declare type TextRenderMode = typeof textRenderModes[keyof typeof textRenderModes];
declare const softMaskTypes: {
    readonly ALPHA: "/Alpha";
    readonly LUMINOSITY: "/Luminosity";
};
declare type SoftMaskType = typeof softMaskTypes[keyof typeof softMaskTypes];
declare const borderEffects: {
    NONE: string;
    CLOUDY: string;
};
declare type BorderEffect = typeof borderEffects[keyof typeof borderEffects];
declare const borderStyles: {
    readonly SOLID: "/S";
    readonly DASHED: "/D";
    readonly BEVELED: "/B";
    readonly INSET: "/I";
    readonly UNDERLINE: "/U";
    readonly NONE: "/N";
};
declare type BorderStyle = typeof borderStyles[keyof typeof borderStyles];
declare const groupDictTypes: {
    readonly TRANSPARENCY: "/Transparency";
};
declare type GroupDictType = typeof groupDictTypes[keyof typeof groupDictTypes];

interface Reference {
    id: number;
    generation: number;
}

interface IDataCryptor {
    encrypt(data: Uint8Array, ref: Reference): Uint8Array;
    decrypt(data: Uint8Array, ref: Reference): Uint8Array;
}
interface CryptInfo {
    ref?: Reference;
    stringCryptor?: IDataCryptor;
    streamCryptor?: IDataCryptor;
}
interface IEncodable {
    toArray(cryptInfo?: CryptInfo): Uint8Array;
}

interface ParserOptions {
    direction?: boolean;
    minIndex?: number;
    maxIndex?: number;
    closedOnly?: boolean;
}
interface ParserBounds {
    start: number;
    end: number;
    contentStart?: number;
    contentEnd?: number;
}
interface ParserResult<T> extends ParserBounds {
    value: T;
}
interface DataParser {
    get maxIndex(): number;
    destroy(): void;
    isOutside(index: number): boolean;
    isCodeAtAsync(index: number, code: number): Promise<boolean>;
    getSubParserAsync(start: number, end?: number): Promise<DataParser>;
    getValueTypeAtAsync(start: number, skipEmpty?: boolean): Promise<ValueType>;
    findSubarrayIndexAsync(sub: number[] | readonly number[], options?: ParserOptions): Promise<ParserBounds>;
    findCharIndexAsync(charCode: number, direction?: boolean, start?: number): Promise<number>;
    findNewLineIndexAsync(direction?: boolean, start?: number): Promise<number>;
    findSpaceIndexAsync(direction?: boolean, start?: number): Promise<number>;
    findNonSpaceIndexAsync(direction?: boolean, start?: number): Promise<number>;
    findDelimiterIndexAsync(direction?: boolean, start?: number): Promise<number>;
    findNonDelimiterIndexAsync(direction?: boolean, start?: number): Promise<number>;
    findRegularIndexAsync(direction?: boolean, start?: number): Promise<number>;
    findIrregularIndexAsync(direction?: boolean, start?: number): Promise<number>;
    getIndirectObjectBoundsAtAsync(start: number, skipEmpty?: boolean): Promise<ParserBounds>;
    getXrefTableBoundsAtAsync(start: number, skipEmpty?: boolean): Promise<ParserBounds>;
    getDictBoundsAtAsync(start: number, skipEmpty?: boolean): Promise<ParserBounds>;
    getArrayBoundsAtAsync(start: number, skipEmpty?: boolean): Promise<ParserBounds>;
    getHexBoundsAtAsync(start: number, skipEmpty?: boolean): Promise<ParserBounds>;
    getLiteralBoundsAtAsync(start: number, skipEmpty?: boolean): Promise<ParserBounds>;
    parseNumberAtAsync(start: number, float?: boolean, skipEmpty?: boolean): Promise<ParserResult<number>>;
    parseNameAtAsync(start: number, includeSlash?: boolean, skipEmpty?: boolean): Promise<ParserResult<string>>;
    parseStringAtAsync(start: number, skipEmpty?: boolean): Promise<ParserResult<string>>;
    parseBoolAtAsync(start: number, skipEmpty?: boolean): Promise<ParserResult<boolean>>;
    parseNumberArrayAtAsync(start: number, float?: boolean, skipEmpty?: boolean): Promise<ParserResult<number[]>>;
    parseNameArrayAtAsync(start: number, includeSlash?: boolean, skipEmpty?: boolean): Promise<ParserResult<string[]>>;
    parseDictTypeAsync(bounds: ParserBounds): Promise<string>;
    parseDictSubtypeAsync(bounds: ParserBounds): Promise<string>;
    parseDictPropertyByNameAsync(propName: readonly number[] | number[], bounds: ParserBounds): Promise<string>;
    skipEmptyAsync(start: number): Promise<number>;
    skipToNextNameAsync(start: number, max: number): Promise<number>;
    sliceCharCodesAsync(start: number, end?: number): Promise<Uint8Array>;
    sliceCharsAsync(start: number, end?: number): Promise<string>;
}

interface ParserInfo {
    parser: DataParser;
    bounds: ParserBounds;
    cryptInfo?: CryptInfo;
    streamId?: number;
    type?: ObjectType;
    value?: any;
    rect?: Quadruple;
    parseInfoGetterAsync?: (id: number) => Promise<ParserInfo>;
}

declare class ObjectId implements Reference, IEncodable {
    readonly id: number;
    readonly generation: number;
    constructor(id: number, generation: number);
    static parseAsync(parser: DataParser, start: number, skipEmpty?: boolean): Promise<ParserResult<ObjectId>>;
    static parseRefAsync(parser: DataParser, start: number, skipEmpty?: boolean): Promise<ParserResult<ObjectId>>;
    static parseRefArrayAsync(parser: DataParser, start: number, skipEmpty?: boolean): Promise<ParserResult<ObjectId[]>>;
    static fromRef(ref: Reference): ObjectId;
    equals(other: ObjectId): boolean;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    toString(): string;
}

declare abstract class PdfObject implements IEncodable {
    $onChangeAction: () => void;
    $onEditAction: (undo?: () => Promise<void>) => void;
    protected _sourceBytes: Uint8Array;
    get sourceBytes(): Uint8Array;
    get sourceChars(): string;
    protected _ref: Reference;
    get ref(): Reference;
    set ref(ref: Reference);
    get id(): number;
    get generation(): number;
    protected _proxy: PdfObject;
    protected _added: boolean;
    get added(): boolean;
    protected _edited: boolean;
    get edited(): boolean;
    protected _deleted: boolean;
    get deleted(): boolean;
    protected onChange: ProxyHandler<PdfObject>;
    protected constructor();
    protected static getDataParserAsync(data: Uint8Array): Promise<DataParser>;
    markAsDeleted(value?: boolean): void;
    protected initProxy(): PdfObject;
    protected getProxy(): PdfObject;
    protected encodePrimitiveArray(array: (number | string)[] | readonly (number | string)[], encoder?: TextEncoder): number[];
    protected encodeNestedPrimitiveArray(array: (number | string)[][] | readonly (number | string)[][], encoder?: TextEncoder): number[];
    protected encodeSerializableArray(array: IEncodable[], cryptInfo?: CryptInfo): number[];
    protected parseRefPropAsync(propName: string, parser: DataParser, index: number): Promise<number>;
    protected parseRefArrayPropAsync(propName: string, parser: DataParser, index: number): Promise<number>;
    protected parseBoolPropAsync(propName: string, parser: DataParser, index: number): Promise<number>;
    protected parseNamePropAsync(propName: string, parser: DataParser, index: number, includeSlash?: boolean): Promise<number>;
    protected parseNameArrayPropAsync(propName: string, parser: DataParser, index: number, includeSlash?: boolean): Promise<number>;
    protected parseNumberPropAsync(propName: string, parser: DataParser, index: number, float?: boolean): Promise<number>;
    protected parseNumberArrayPropAsync(propName: string, parser: DataParser, index: number, float?: boolean): Promise<number>;
    protected parseDatePropAsync(propName: string, parser: DataParser, index: number, cryptInfo?: CryptInfo): Promise<number>;
    protected parseLiteralPropAsync(propName: string, parser: DataParser, index: number, cryptInfo?: CryptInfo): Promise<number>;
    protected parseHexPropAsync(propName: string, parser: DataParser, index: number, cryptInfo?: CryptInfo): Promise<number>;
    private setParsedProp;
    abstract toArray(cryptInfo?: CryptInfo): Uint8Array;
}

declare abstract class PdfDict extends PdfObject {
    readonly Type: DictType;
    protected _streamId: number;
    get streamId(): number;
    protected constructor(type: DictType);
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
}

declare class DecodeParamsDict extends PdfDict {
    protected readonly _intPropMap: Map<string, number>;
    protected readonly _boolPropMap: Map<string, boolean>;
    protected readonly _namePropMap: Map<string, string>;
    protected readonly _refPropMap: Map<string, ObjectId>;
    constructor();
    static parseAsync(parseInfo: ParserInfo): Promise<ParserResult<DecodeParamsDict>>;
    static parseArrayAsync(parser: DataParser, start: number, cryptInfo?: CryptInfo, skipEmpty?: boolean): Promise<ParserResult<DecodeParamsDict[]>>;
    getIntProp(name: string): number;
    getBoolProp(name: string): boolean;
    getNameProp(name: string): string;
    getRefProp(name: string): ObjectId;
    setIntProp(name: string, value: number): Map<string, number>;
    setBoolProp(name: string, value: boolean): Map<string, boolean>;
    setNameProp(name: string, value: string): Map<string, string>;
    setRefProp(name: string, value: ObjectId): Map<string, ObjectId>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
}

declare abstract class PdfStream extends PdfObject {
    readonly Type: StreamType;
    Length: number;
    Filter: StreamFilter;
    DecodeParms: DecodeParamsDict;
    DL: number;
    protected _streamData: Uint8Array;
    get streamData(): Uint8Array;
    set streamData(data: Uint8Array);
    protected _decodedStreamData: Uint8Array;
    get decodedStreamData(): Uint8Array;
    get decodedStreamDataChars(): string;
    protected constructor(type: StreamType);
    getStreamDataParserAsync(): Promise<DataParser>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    setTextStreamData(text: string): void;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
    protected setStreamData(data: Uint8Array): void;
    protected decodeStreamData(): void;
}

interface CmapCodeRange {
    length: number;
    start: Uint8Array;
    end: Uint8Array;
}
declare class UnicodeCmapStream extends PdfStream {
    protected readonly _codeRanges: CmapCodeRange[];
    protected readonly _map: Map<number, string>;
    constructor(type?: StreamType);
    static parseAsync(parseInfo: ParserInfo): Promise<ParserResult<UnicodeCmapStream>>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    hexBytesToUtfString(bytes: Uint8Array): string;
    protected isInsideAnyRange(bytes: Uint8Array): boolean;
    protected parseCodeRangesAsync(parser: DataParser): Promise<void>;
    protected parseCharMapAsync(parser: DataParser, decoder: TextDecoder): Promise<void>;
    protected parseCharRangesMapAsync(parser: DataParser, decoder: TextDecoder): Promise<void>;
    protected fillMapAsync(): Promise<void>;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
}

declare class EncodingDict extends PdfDict {
    BaseEncoding: string;
    Differences: (number | string)[];
    protected _charMap: Map<number, string>;
    get charMap(): Map<number, string>;
    protected _codeMap: Map<string, number>;
    get codeMap(): Map<string, number>;
    constructor();
    static parseAsync(parseInfo: ParserInfo): Promise<ParserResult<EncodingDict>>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
    protected refreshCharMaps(): void;
}

declare class HexString implements IEncodable {
    private readonly _literal;
    get literal(): string;
    private readonly _hex;
    get hex(): Uint8Array;
    private readonly _bytes;
    get bytes(): Uint8Array;
    private constructor();
    static parseAsync(parser: DataParser, start: number, cryptInfo?: CryptInfo, skipEmpty?: boolean): Promise<ParserResult<HexString>>;
    static parseArrayAsync(parser: DataParser, start: number, cryptInfo?: CryptInfo, skipEmpty?: boolean): Promise<ParserResult<HexString[]>>;
    static fromBytes(bytes: Uint8Array): HexString;
    static fromHexBytes(hex: Uint8Array): HexString;
    static fromString(literal: string): HexString;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
}

declare class LiteralString implements IEncodable {
    private readonly _literal;
    get literal(): string;
    private readonly _bytes;
    get bytes(): Uint8Array;
    private constructor();
    static parseAsync(parser: DataParser, start: number, cryptInfo?: CryptInfo, skipEmpty?: boolean): Promise<ParserResult<LiteralString>>;
    static parseArrayAsync(parser: DataParser, start: number, cryptInfo?: CryptInfo, skipEmpty?: boolean): Promise<ParserResult<LiteralString[]>>;
    static fromBytes(bytes: Uint8Array): LiteralString;
    static fromString(source: string): LiteralString;
    private static escape;
    private static unescape;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
}

declare class FontDescriptorDict extends PdfDict {
    FontName: string;
    FontFamily: HexString | LiteralString;
    FontStretch: string;
    FontWeight: number;
    Flags: number;
    FontBBox: Quadruple;
    ItalicAngle: number;
    Ascent: number;
    Descent: number;
    CapHeight: number;
    StemV: number;
    StemH: number;
    Leading: number;
    AvgWidth: number;
    MaxWidth: number;
    MissingWidth: number;
    XHeight: number;
    CharSet: HexString | LiteralString;
    FontFile: ObjectId;
    FontFile2: ObjectId;
    FontFile3: ObjectId;
    constructor();
    static parseAsync(parseInfo: ParserInfo): Promise<ParserResult<FontDescriptorDict>>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
}

declare class FontDict extends PdfDict {
    Subtype: string;
    BaseFont: string;
    Encoding: string | ObjectId;
    FontDescriptor: ObjectId;
    ToUnicode: ObjectId;
    FirstChar: number;
    LastChar: number;
    Widths: number[] | ObjectId;
    FontBBox: Quadruple;
    FontMatrix: Quadruple;
    Resources: Uint8Array;
    CharProcs: Uint8Array;
    DescendantFonts: Uint8Array;
    protected _name: string;
    get name(): string;
    protected _encoding: EncodingDict;
    get encoding(): EncodingDict;
    set encoding(value: EncodingDict);
    get encodingValue(): ObjectId | string;
    protected _descriptor: FontDescriptorDict;
    get descriptor(): FontDescriptorDict;
    set descriptor(value: FontDescriptorDict);
    get descriptorValue(): ObjectId;
    protected _toUtfCmap: UnicodeCmapStream;
    get toUtfCmap(): UnicodeCmapStream;
    get isMonospace(): boolean;
    get isSerif(): boolean;
    get isScript(): boolean;
    get isItalic(): boolean;
    constructor();
    static newFontMap(): Map<string, FontDict>;
    static parseAsync(parseInfo: ParserInfo): Promise<ParserResult<FontDict>>;
    private static createArialFont;
    private static createCalibriFont;
    private static createCambriaFont;
    private static createCourierFont;
    private static createTnrFont;
    private static createVerdanaFont;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    decodeText(bytes: Uint8Array): string;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
    protected initProxy(): FontDict;
    protected getProxy(): FontDict;
}

declare type CssMixBlendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion";

declare class DateString implements IEncodable {
    private readonly _source;
    get source(): string;
    private readonly _date;
    get date(): Date;
    private constructor();
    static parseAsync(parser: DataParser, start: number, cryptInfo?: CryptInfo, skipEmpty?: boolean): Promise<ParserResult<DateString>>;
    static fromDate(date: Date): DateString;
    static fromString(source: string): DateString;
    static fromArray(arr: Uint8Array): DateString;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
}

declare class ObjectMapDict extends PdfDict {
    protected readonly _objectIdMap: Map<string, ObjectId>;
    protected readonly _dictParserMap: Map<string, ParserInfo>;
    constructor();
    static parseAsync(parseInfo: ParserInfo): Promise<ParserResult<ObjectMapDict>>;
    getObjectId(name: string): ObjectId;
    getObjectIds(): Iterable<[string, ObjectId]>;
    getDictParser(name: string): ParserInfo;
    getDictParsers(): Iterable<[string, ParserInfo]>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
}

declare class SoftMaskDict extends PdfDict {
    S: SoftMaskType;
    G: ObjectId;
    BC: number[];
    TR: "/Identity";
    constructor();
    static parseAsync(parseInfo: ParserInfo): Promise<ParserResult<SoftMaskDict>>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
}

interface TextStateParams {
    matrix?: Mat3;
    lineMatrix?: Mat3;
    customFontName?: string;
    leading?: number;
    renderMode?: TextRenderMode;
    fontFamily?: string;
    fontSize?: string;
    lineHeight?: string;
    letterSpacing?: string;
    wordSpacing?: string;
    horizontalScale?: number;
    verticalAlign?: string;
    knockOut?: boolean;
}
declare class TextState {
    static readonly defaultParams: TextStateParams;
    matrix: Mat3;
    lineMatrix: Mat3;
    customFontName: string;
    leading: number;
    renderMode: TextRenderMode;
    fontFamily: string;
    fontSize: string;
    lineHeight: string;
    letterSpacing: string;
    wordSpacing: string;
    horizontalScale: number;
    verticalAlign: string;
    knockOut: boolean;
    constructor(params?: TextStateParams);
    clone(params?: TextStateParams): TextState;
    setWordSpacing(value: number): void;
    setLetterSpacing(value: number): void;
    setScale(value: number): void;
    setLeading(value: number): void;
    setFontSize(value: number): void;
    setVerticalAlign(value: number): void;
    moveAlongPx(value: number): void;
    moveAlongPdfUnits(value: number): void;
    nextLine(tx?: number, ty?: number): void;
}

interface GraphicsStateParams {
    matrix?: Mat3;
    textState?: TextState;
    clipPath?: SVGClipPathElement;
    strokeColorSpace?: "grayscale" | "rgb" | "cmyk";
    strokeAlpha?: number;
    strokeColor?: Vec3;
    fillColorSpace?: "grayscale" | "rgb" | "cmyk";
    fillAlpha?: number;
    fillColor?: Vec3;
    strokeWidth?: number;
    strokeMiterLimit?: number;
    strokeLineCap?: "butt" | "round" | "square";
    strokeLineJoin?: "bevel" | "miter" | "round";
    strokeDashArray?: string;
    strokeDashOffset?: number;
    mixBlendMode?: CssMixBlendMode;
}

declare class GraphicsStateDict extends PdfDict {
    LW: number;
    LC: LineCapStyle;
    LJ: LineJoinStyle;
    ML: number;
    D: [dashArray: [dash: number, gap: number], dashPhase: number];
    RI: RenderingIntent;
    OP: boolean;
    op: boolean;
    OPM: 0 | 1;
    Font: [font: ObjectId, size: number];
    FL: number;
    SM: number;
    SA: boolean;
    BM: BlendMode;
    SMask: string | SoftMaskDict;
    CA: number;
    ca: number;
    AIS: boolean;
    TK: boolean;
    constructor();
    static parseAsync(parseInfo: ParserInfo): Promise<ParserResult<GraphicsStateDict>>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    toParams(): GraphicsStateParams;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
    protected initProxy(): GraphicsStateDict;
    protected getProxy(): GraphicsStateDict;
}

interface ResourceStreamParsers {
    xform: (info: ParserInfo) => Promise<ParserResult<PdfStream>>;
    image: (info: ParserInfo) => Promise<ParserResult<PdfStream>>;
}
declare class ResourceDict extends PdfDict {
    ExtGState: ObjectMapDict;
    ColorSpace: ObjectMapDict;
    Pattern: ObjectMapDict;
    Shading: ObjectMapDict;
    XObject: ObjectMapDict;
    Font: ObjectMapDict;
    Properties: ObjectMapDict;
    ProcSet: string[];
    protected readonly _streamParsers: ResourceStreamParsers;
    protected _gsMap: Map<string, GraphicsStateDict>;
    protected _fontsMap: Map<string, FontDict>;
    protected _xObjectsMap: Map<string, PdfStream>;
    constructor(streamParsers?: ResourceStreamParsers);
    static parseAsync(parseInfo: ParserInfo, streamParsers?: ResourceStreamParsers): Promise<ParserResult<ResourceDict>>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    getGraphicsState(name: string): GraphicsStateDict;
    getGraphicsStates(): Iterable<[string, GraphicsStateDict]>;
    setGraphicsState(name: string, state: GraphicsStateDict): void;
    getFont(name: string): FontDict;
    getFonts(): Iterable<[string, FontDict]>;
    setFont(name: string, font: FontDict): void;
    getXObject(name: string): PdfStream;
    getXObjects(): Iterable<[string, PdfStream]>;
    setXObject(name: string, xObject: PdfStream): void;
    protected fillMapsAsync(parseInfoGetterAsync: (id: number) => Promise<ParserInfo>, cryptInfo?: CryptInfo): Promise<void>;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
    protected initProxy(): ResourceDict;
    protected getProxy(): ResourceDict;
}

declare class MeasureDict extends PdfDict {
    readonly Subtype = "/RL";
    constructor();
    static parseAsync(parseInfo: ParserInfo): Promise<ParserResult<MeasureDict>>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
}

declare abstract class GroupDict extends PdfDict {
    S: GroupDictType;
    protected constructor();
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
}

declare class TransparencyGroupDict extends GroupDict {
    CS: string;
    I: boolean;
    K: boolean;
    constructor();
    static parseAsync(parseInfo: ParserInfo): Promise<ParserResult<TransparencyGroupDict>>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
}

declare class XFormStream extends PdfStream {
    readonly Subtype: "/Form";
    readonly FormType: 1;
    BBox: Quadruple;
    Matrix: Hextuple;
    Resources: ResourceDict;
    Metadata: ObjectId;
    LastModified: DateString;
    StructParent: number;
    StructParents: number;
    Measure: MeasureDict;
    Group: TransparencyGroupDict;
    get matrix(): Mat3;
    set matrix(matrix: Mat3);
    get bBox(): BBox;
    get transformedBBox(): BBox;
    get edited(): boolean;
    constructor();
    static parseAsync(parseInfo: ParserInfo): Promise<ParserResult<XFormStream>>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
    protected initProxy(): XFormStream;
    protected getProxy(): XFormStream;
}

interface SvgElementWithBlendMode {
    element: SVGGraphicsElement;
    blendMode: CssMixBlendMode;
}
interface AppearanceRenderResult {
    clipPaths: SVGClipPathElement[];
    elements: SvgElementWithBlendMode[];
    pickHelpers: SVGGraphicsElement[];
}

declare class BorderStyleDict extends PdfDict {
    W: number;
    S: BorderStyle;
    D: Double;
    constructor();
    static parseAsync(parseInfo: ParserInfo): Promise<ParserResult<BorderStyleDict>>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
}

declare class AppearanceDict extends PdfDict {
    N: ObjectMapDict | ObjectId;
    R: ObjectMapDict | ObjectId;
    D: ObjectMapDict | ObjectId;
    protected _streamsMap: Map<string, XFormStream>;
    constructor();
    static parseAsync(parseInfo: ParserInfo): Promise<ParserResult<AppearanceDict>>;
    getStream(key: string): XFormStream;
    getStreams(): Iterable<XFormStream>;
    setStream(key: string, stream: XFormStream): void;
    clearStreams(): void;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    protected fillStreamsMapAsync(parseInfoGetterAsync: (id: number) => Promise<ParserInfo>): Promise<void>;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
    protected initProxy(): AppearanceDict;
    protected getProxy(): AppearanceDict;
}

declare class BorderEffectDict extends PdfDict {
    S: BorderEffect;
    L: number;
    constructor();
    static parseAsync(parseInfo: ParserInfo): Promise<ParserResult<BorderEffectDict>>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
}

declare class BorderArray {
    readonly hCornerR: number;
    readonly vCornerR: number;
    readonly width: number;
    readonly dash: number;
    readonly gap: number;
    constructor(hCornerR: number, vCornerR: number, width: number, dash?: number, gap?: number);
    static parseAsync(parser: DataParser, start: number, skipEmpty?: boolean): Promise<ParserResult<BorderArray>>;
    toArray(cryptInfo?: CryptInfo): Uint8Array;
}

declare abstract class AnnotationDict extends PdfDict implements RenderableAnnotation {
    $name: string;
    $pageId: number;
    $translationEnabled: boolean;
    $onRenderUpdatedAction: () => void;
    $onPointerDownAction: (e: PointerEvent) => void;
    $onPointerEnterAction: (e: PointerEvent) => void;
    $onPointerLeaveAction: (e: PointerEvent) => void;
    readonly Subtype: AnnotationType;
    Rect: Quadruple;
    Contents: LiteralString;
    P: ObjectId;
    NM: LiteralString;
    M: DateString | LiteralString;
    F: number;
    AP: AppearanceDict;
    AS: string;
    Border: BorderArray;
    BS: BorderStyleDict;
    BE: BorderEffectDict;
    C: readonly number[];
    StructParent: number;
    protected _apStream: XFormStream;
    get apStream(): XFormStream;
    set apStream(value: XFormStream);
    protected _bBox: BBox;
    protected _transformationPromise: Promise<void>;
    protected _transformationTimer: number;
    protected _tempX: number;
    protected _tempY: number;
    protected _currentAngle: number;
    protected _moved: boolean;
    protected _tempTransformationMatrix: Mat3;
    protected _tempStartPoint: Vec2;
    protected _tempVecX: Vec2;
    protected _tempVecY: Vec2;
    protected readonly _svgId: string;
    protected _pageInfo: PageInfo;
    protected _renderedBox: SVGGraphicsElement;
    protected _renderedControls: SVGGraphicsElement;
    protected _renderedContent: HTMLDivElement;
    protected _svgContentCopy: SVGGraphicsElement;
    get lastRenderResult(): AnnotationRenderResult;
    get strokeWidth(): number;
    protected constructor(subType: AnnotationType);
    toArray(cryptInfo?: CryptInfo): Uint8Array;
    renderAsync(pageInfo: PageInfo): Promise<AnnotationRenderResult>;
    renderApStreamAsync(): Promise<AppearanceRenderResult>;
    moveToAsync(point: Vec2): Promise<void>;
    rotateByAsync(angle: number, center?: Vec2): Promise<void>;
    toDto(): AnnotationDto;
    setTextContentAsync(text: string, undoable?: boolean): Promise<void>;
    protected parsePropsAsync(parseInfo: ParserInfo): Promise<void>;
    protected getColorString(): string;
    protected getCurrentRotation(): number;
    protected getLocalBB(): BBox;
    protected convertClientCoordsToPage(clientX: number, clientY: number): Vec2;
    protected convertPageCoordsToClient(pageX: number, pageY: number): Vec2;
    protected applyRectTransform(matrix: Mat3): void;
    protected applyCommonTransformAsync(matrix: Mat3, undoable?: boolean): Promise<void>;
    protected applyTempTransformAsync(): Promise<void>;
    protected renderAppearance(): AppearanceRenderResult;
    protected renderRect(): SVGGraphicsElement;
    protected renderBox(): SVGGraphicsElement;
    protected renderControls(): SVGGraphicsElement;
    protected buildRenderedContentStructure(renderResult: AppearanceRenderResult): HTMLDivElement;
    protected buildRenderContentCopy(contentRenderResult: AppearanceRenderResult): SVGGraphicsElement;
    protected renderScaleHandles(): SVGGraphicsElement[];
    protected renderRotationHandle(): SVGGraphicsElement;
    protected renderHandles(): SVGGraphicsElement[];
    protected updateRenderAsync(): Promise<any>;
    protected onSvgPointerEnter: (e: PointerEvent) => void;
    protected onSvgPointerLeave: (e: PointerEvent) => void;
    protected onSvgPointerDown: (e: PointerEvent) => void;
    protected onTranslationPointerDown: (e: PointerEvent) => void;
    protected onTranslationPointerMove: (e: PointerEvent) => void;
    protected onTranslationPointerUp: (e: PointerEvent) => void;
    protected onRotationHandlePointerDown: (e: PointerEvent) => void;
    protected onRotationHandlePointerMove: (e: PointerEvent) => void;
    protected onRotationHandlePointerUp: (e: PointerEvent) => void;
    protected onScaleHandlePointerDown: (e: PointerEvent) => void;
    protected onScaleHandlePointerMove: (e: PointerEvent) => void;
    protected onScaleHandlePointerUp: (e: PointerEvent) => void;
    protected initProxy(): AnnotationDict;
    protected getProxy(): AnnotationDict;
}

declare const annotSelectionRequestEvent: "tspdf-annotselectionrequest";
declare const annotFocusRequestEvent: "tspdf-annotfocusrequest";
declare const annotChangeEvent: "tspdf-annotchange";
declare const docServiceStateChangeEvent: "tspdf-docservicechange";
interface AnnotSelectionRequestEventDetail {
    annotation: AnnotationDict;
}
interface AnnotFocusRequestEventDetail {
    annotation: AnnotationDict;
}
interface AnnotEventDetail {
    type: "focus" | "select" | "add" | "edit" | "delete" | "render" | "import";
    annotations: AnnotationDto[];
}
interface DocServiceStateChangeEventDetail {
    undoableCount: number;
}
declare class AnnotSelectionRequestEvent extends CustomEvent<AnnotSelectionRequestEventDetail> {
    constructor(detail: AnnotSelectionRequestEventDetail);
}
declare class AnnotFocusRequestEvent extends CustomEvent<AnnotFocusRequestEventDetail> {
    constructor(detail: AnnotFocusRequestEventDetail);
}
declare class AnnotEvent extends CustomEvent<AnnotEventDetail> {
    constructor(detail: AnnotEventDetail);
}
declare class DocServiceStateChangeEvent extends CustomEvent<DocServiceStateChangeEventDetail> {
    constructor(detail: DocServiceStateChangeEventDetail);
}
declare global {
    interface HTMLElementEventMap {
        [annotSelectionRequestEvent]: AnnotSelectionRequestEvent;
        [annotFocusRequestEvent]: AnnotFocusRequestEvent;
        [annotChangeEvent]: AnnotEvent;
        [docServiceStateChangeEvent]: DocServiceStateChangeEvent;
    }
}

declare const viewerModes: readonly ["text", "hand", "annotation", "comparison"];
declare type ViewerMode = typeof viewerModes[number];

declare global {
    interface HTMLElementEventMap {
        [customStampEvent]: CustomStampEvent;
    }
}
declare type BaseFileButtons = "open" | "close";
declare type FileButtons = BaseFileButtons | "save";
interface TsPdfViewerOptions {
    containerSelector: string;
    workerSource: string;
    userName?: string;
    annotChangeCallback?: (detail: AnnotEventDetail) => void;
    customStamps?: CustomStampCreationInfo[];
    customStampChangeCallback?: (detail: CustomStampEventDetail) => void;
    visibleAdjPages?: number;
    previewWidth?: number;
    minScale?: number;
    maxScale?: number;
    disabledModes?: ViewerMode[];
    fileButtons?: FileButtons[];
    fileOpenAction?: () => void;
    fileSaveAction?: () => void;
    fileCloseAction?: () => void;
    comparableFileButtons?: BaseFileButtons[];
    comparableFileOpenAction?: () => void;
    comparableFileCloseAction?: () => void;
}
declare class TsPdfViewer {
    private readonly _userName;
    private readonly _outerContainer;
    private readonly _shadowRoot;
    private readonly _mainContainer;
    private readonly _eventService;
    private readonly _modeService;
    private readonly _docManagerService;
    private readonly _pageService;
    private readonly _customStampsService;
    private get _docService();
    private readonly _spinner;
    private readonly _viewer;
    private readonly _previewer;
    private _annotatorService;
    private _fileButtons;
    private _comparableFileButtons;
    private _fileInput;
    private _comparableFileInput;
    private _fileOpenAction;
    private _fileSaveAction;
    private _fileCloseAction;
    private _comparableFileOpenAction;
    private _comparableFileCloseAction;
    private _annotChangeCallback;
    private _customStampChangeCallback;
    private _mainContainerRObserver;
    private _panelsHidden;
    private _timers;
    constructor(options: TsPdfViewerOptions);
    destroy(): void;
    openPdfAsync(src: string | Blob | Uint8Array, fileName?: string): Promise<void>;
    closePdfAsync(): Promise<void>;
    openComparedPdfAsync(src: string | Blob | Uint8Array, fileName?: string): Promise<void>;
    closeComparedPdfAsync(): Promise<void>;
    importAnnotationsAsync(dtos: AnnotationDto[]): Promise<void>;
    importAnnotationsFromJsonAsync(json: string): Promise<void>;
    exportAnnotationsAsync(): Promise<AnnotationDto[]>;
    exportAnnotationsToJsonAsync(): Promise<string>;
    importCustomStamps(customStamps: CustomStampCreationInfo[]): void;
    importCustomStampsFromJson(json: string): void;
    exportCustomStamps(): CustomStampCreationInfo[];
    exportCustomStampsToJson(): string;
    getCurrentPdfAsync(): Promise<Blob>;
    protected onTextSelectionChange: () => void;
    private openDocAsync;
    private closeDocAsync;
    private initMainContainerEventHandlers;
    private initViewControls;
    private initFileButtons;
    private onFileInput;
    private onOpenFileButtonClick;
    private onSaveFileButtonClickAsync;
    private onCloseFileButtonClick;
    private onComparableFileInput;
    private onComparableOpenFileButtonClick;
    private onComparableCloseFileButtonClick;
    private initModeSwitchButtons;
    private initAnnotationButtons;
    private setMode;
    private onViewerModeButtonClick;
    private onZoomOutClick;
    private onZoomInClick;
    private onZoomFitViewerClick;
    private onZoomFitPageClick;
    private onRotateCounterClockwiseClick;
    private onRotateClockwiseClick;
    private rotateCounterClockwise;
    private rotateClockwise;
    private onPaginatorInput;
    private onPaginatorChange;
    private onPaginatorPrevClick;
    private onPaginatorNextClick;
    private onCurrentPagesChanged;
    private moveToPrevPage;
    private moveToNextPage;
    private annotatorUndo;
    private annotatorClear;
    private annotatorSave;
    private onCustomStampChanged;
    private onAnnotationChange;
    private onAnnotatorDataChanged;
    private setAnnotationMode;
    private onAnnotationEditTextButtonClick;
    private onAnnotationDeleteButtonClick;
    private onAnnotationModeButtonClick;
    private onMainContainerPointerMove;
    private hidePanels;
    private showPanels;
    private onPdfLoadingProgress;
    private docServiceUndo;
    private onDocChangeAsync;
    private onDocServiceStateChange;
    private refreshPagesAsync;
    private onPreviewerToggleClick;
    private togglePreviewer;
    private showPasswordDialogAsync;
    private onViewerKeyDown;
}

export { AnnotEvent, AnnotEventDetail, AnnotationDto, BaseFileButtons, FileButtons, TsPdfViewer, ViewerMode as TsPdfViewerMode, TsPdfViewerOptions };
