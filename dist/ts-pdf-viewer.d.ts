// Generated by dts-bundle-generator v5.8.0

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
export declare type ObjectType = typeof objectTypes[keyof typeof objectTypes];
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
export declare type StreamFilter = typeof streamFilters[keyof typeof streamFilters];
declare const streamTypes: {
	readonly XREF: "/XRef";
	readonly OBJECT_STREAM: "/ObjStm";
	readonly FORM_XOBJECT: "/XObject";
	readonly METADATA_STREAM: "/Metadata";
};
export declare type StreamType = typeof streamTypes[keyof typeof streamTypes];
declare const userTypes: {
	readonly INDIVIDUAL: "/Ind";
	readonly TITLE: "/Title";
	readonly ORGANIZATION: "/Org";
};
export declare type UserTypes = typeof userTypes[keyof typeof userTypes];
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
	readonly EMPTY: "";
};
export declare type DictType = typeof dictTypes[keyof typeof dictTypes] | UserTypes;
declare const groupDictTypes: {
	readonly TRANSPARENCY: "/Transparency";
};
export declare type GroupDictType = typeof groupDictTypes[keyof typeof groupDictTypes];
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
export declare type ValueType = typeof valueTypes[keyof typeof valueTypes];
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
export declare type AnnotationType = typeof annotationTypes[keyof typeof annotationTypes];
declare const lineCapStyles: {
	readonly BUTT: 0;
	readonly ROUND: 1;
	readonly SQUARE: 2;
};
export declare type LineCapStyle = typeof lineCapStyles[keyof typeof lineCapStyles];
declare const lineJoinStyles: {
	readonly MITER: 0;
	readonly ROUND: 1;
	readonly BEVEL: 2;
};
export declare type LineJoinStyle = typeof lineJoinStyles[keyof typeof lineJoinStyles];
declare const renderingIntents: {
	readonly ABSOLUTE: "/AbsoluteColorimetric";
	readonly RELATIVE: "/RelativeColorimetric";
	readonly SATURATION: "/Saturation";
	readonly PERCEPTUAL: "/Perceptual";
};
export declare type RenderingIntent = typeof renderingIntents[keyof typeof renderingIntents];
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
export declare type BlendMode = typeof blendModes[keyof typeof blendModes];
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
export declare type TextRenderMode = typeof textRenderModes[keyof typeof textRenderModes];
declare const softMaskTypes: {
	readonly ALPHA: "/Alpha";
	readonly LUMINOSITY: "/Luminosity";
};
export declare type SoftMaskType = typeof softMaskTypes[keyof typeof softMaskTypes];
export interface Reference {
	id: number;
	generation: number;
}
export interface IDataCryptor {
	encrypt(data: Uint8Array, ref: Reference): Uint8Array;
	decrypt(data: Uint8Array, ref: Reference): Uint8Array;
}
export interface CryptInfo {
	ref?: Reference;
	stringCryptor?: IDataCryptor;
	streamCryptor?: IDataCryptor;
}
export interface IEncodable {
	toArray(cryptInfo?: CryptInfo): Uint8Array;
}
export declare type Pair = readonly [
	x: number,
	y: number
];
export declare type Matrix = readonly [
	a: number,
	b: number,
	d: number,
	e: number,
	g: number,
	h: number
];
export declare type Rect = readonly [
	ll_x: number,
	ll_y: number,
	ur_x: number,
	ur_y: number
];
export interface AnnotationDto {
	annotationType: string;
	uuid: string;
	pageId: number;
	dateCreated: string;
	dateModified: string;
	author: string;
	rect: Rect;
	matrix: Matrix;
}
export declare type SearchDirection = "straight" | "reverse";
export interface SearchOptions {
	direction?: SearchDirection;
	minIndex?: number;
	maxIndex?: number;
	closedOnly?: boolean;
}
export interface Bounds {
	start: number;
	end: number;
	contentStart?: number;
	contentEnd?: number;
}
export interface ParseInfo {
	parser: DataParser;
	bounds: Bounds;
	cryptInfo?: CryptInfo;
	streamId?: number;
	type?: ObjectType;
	value?: any;
	rect?: Rect;
	parseInfoGetter?: (id: number) => ParseInfo;
}
export interface ParseResult<T> extends Bounds {
	value: T;
}
declare class DataParser {
	private readonly _data;
	private readonly _maxIndex;
	get maxIndex(): number;
	constructor(data: Uint8Array);
	getPdfVersion(): string;
	getLastXrefIndex(): ParseResult<number>;
	findSubarrayIndex(sub: number[] | readonly number[], options?: SearchOptions): Bounds;
	findCharIndex(charCode: number, direction?: "straight" | "reverse", start?: number): number;
	findNewLineIndex(direction?: "straight" | "reverse", start?: number): number;
	findSpaceIndex(direction?: "straight" | "reverse", start?: number): number;
	findNonSpaceIndex(direction?: "straight" | "reverse", start?: number): number;
	findDelimiterIndex(direction?: "straight" | "reverse", start?: number): number;
	findNonDelimiterIndex(direction?: "straight" | "reverse", start?: number): number;
	findIrregularIndex(direction?: "straight" | "reverse", start?: number): number;
	findRegularIndex(direction?: "straight" | "reverse", start?: number): number;
	getValueTypeAt(start: number, skipEmpty?: boolean): ValueType;
	getIndirectObjectBoundsAt(start: number, skipEmpty?: boolean): Bounds;
	getXrefTableBoundsAt(start: number, skipEmpty?: boolean): Bounds;
	getDictBoundsAt(start: number, skipEmpty?: boolean): Bounds;
	getArrayBoundsAt(start: number, skipEmpty?: boolean): Bounds;
	getHexBounds(start: number, skipEmpty?: boolean): Bounds;
	getLiteralBounds(start: number, skipEmpty?: boolean): Bounds;
	parseNumberAt(start: number, float?: boolean, skipEmpty?: boolean): ParseResult<number>;
	parseNameAt(start: number, includeSlash?: boolean, skipEmpty?: boolean): ParseResult<string>;
	parseStringAt(start: number, skipEmpty?: boolean): ParseResult<string>;
	parseBoolAt(start: number, skipEmpty?: boolean): ParseResult<boolean>;
	parseNumberArrayAt(start: number, float?: boolean, skipEmpty?: boolean): ParseResult<number[]>;
	parseNameArrayAt(start: number, includeSlash?: boolean, skipEmpty?: boolean): ParseResult<string[]>;
	parseDictType(bounds: Bounds): string;
	parseDictSubtype(bounds: Bounds): string;
	parseDictNameProperty(subarray: readonly number[] | number[], bounds: Bounds): string;
	skipEmpty(start: number): number;
	skipToNextName(start: number, max: number): number;
	getCharCode(index: number): number;
	getChar(index: number): string;
	sliceCharCodes(start: number, end?: number): Uint8Array;
	sliceChars(start: number, end?: number): string;
	subCharCodes(start: number, end?: number): Uint8Array;
	isOutside(index: number): boolean;
	private findSingleCharIndex;
}
declare class ObjectId implements Reference, IEncodable {
	readonly id: number;
	readonly generation: number;
	constructor(id: number, generation: number);
	static parse(parser: DataParser, start: number, skipEmpty?: boolean): ParseResult<ObjectId>;
	static parseRef(parser: DataParser, start: number, skipEmpty?: boolean): ParseResult<ObjectId>;
	static parseRefArray(parser: DataParser, start: number, skipEmpty?: boolean): ParseResult<ObjectId[]>;
	static fromRef(ref: Reference): ObjectId;
	equals(other: ObjectId): boolean;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	toString(): string;
}
declare abstract class PdfObject implements IEncodable {
	$onEditedAction: () => void;
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
	markAsDeleted(value?: boolean): void;
	protected parseRefProp(propName: string, parser: DataParser, index: number): number;
	protected parseRefArrayProp(propName: string, parser: DataParser, index: number): number;
	protected parseBoolProp(propName: string, parser: DataParser, index: number): number;
	protected parseNameProp(propName: string, parser: DataParser, index: number, includeSlash?: boolean): number;
	protected parseNameArrayProp(propName: string, parser: DataParser, index: number, includeSlash?: boolean): number;
	protected parseNumberProp(propName: string, parser: DataParser, index: number, float?: boolean): number;
	protected parseNumberArrayProp(propName: string, parser: DataParser, index: number, float?: boolean): number;
	protected parseDateProp(propName: string, parser: DataParser, index: number, cryptInfo?: CryptInfo): number;
	protected parseLiteralProp(propName: string, parser: DataParser, index: number, cryptInfo?: CryptInfo): number;
	private setParsedProp;
	abstract toArray(cryptInfo?: CryptInfo): Uint8Array;
}
declare abstract class PdfDict extends PdfObject {
	readonly Type: DictType;
	protected _streamId: number;
	get streamId(): number;
	protected constructor(type: DictType);
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	protected parseProps(parseInfo: ParseInfo): void;
}
declare class DateString implements IEncodable {
	private readonly _source;
	get source(): string;
	private readonly _date;
	get date(): Date;
	private constructor();
	static parse(parser: DataParser, start: number, cryptInfo?: CryptInfo, skipEmpty?: boolean): ParseResult<DateString>;
	static fromDate(date: Date): DateString;
	static fromString(source: string): DateString;
	static fromArray(arr: Uint8Array): DateString;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
}
declare const borderStyles: {
	readonly SOLID: "/S";
	readonly DASHED: "/D";
	readonly BEVELED: "/B";
	readonly INSET: "/I";
	readonly UNDERLINE: "/U";
};
export declare type BorderStyle = typeof borderStyles[keyof typeof borderStyles];
declare class BorderStyleDict extends PdfDict {
	W: number;
	S: BorderStyle;
	D: Pair;
	constructor();
	static parse(parseInfo: ParseInfo): ParseResult<BorderStyleDict>;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	protected parseProps(parseInfo: ParseInfo): void;
}
declare class ObjectMapDict extends PdfDict {
	protected readonly _objectIdMap: Map<string, ObjectId>;
	protected readonly _dictParserMap: Map<string, ParseInfo>;
	constructor();
	static parse(parseInfo: ParseInfo): ParseResult<ObjectMapDict>;
	getObjectId(name: string): ObjectId;
	getObjectIds(): Iterable<[
		string,
		ObjectId
	]>;
	getDictParser(name: string): ParseInfo;
	getDictParsers(): Iterable<[
		string,
		ParseInfo
	]>;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	protected parseProps(parseInfo: ParseInfo): void;
}
declare class Vec2 {
	readonly length = 2;
	x: number;
	y: number;
	constructor(x?: number, y?: number);
	static multiplyByScalar(v: Vec2, s: number): Vec2;
	static addScalar(v: Vec2, s: number): Vec2;
	static normalize(v: Vec2): Vec2;
	static add(v1: Vec2, v2: Vec2): Vec2;
	static substract(v1: Vec2, v2: Vec2): Vec2;
	static dotProduct(v1: Vec2, v2: Vec2): number;
	static applyMat3(v: Vec2, m: Mat3): Vec2;
	static lerp(v1: Vec2, v2: Vec2, t: number): Vec2;
	static rotate(v: Vec2, center: Vec2, theta: number): Vec2;
	static equals(v1: Vec2, v2: Vec2, precision?: number): boolean;
	static getDistance(v1: Vec2, v2: Vec2): number;
	clone(): Vec2;
	set(x: number, y: number): Vec2;
	setFromVec2(vec2: Vec2): Vec2;
	multiplyByScalar(s: number): Vec2;
	addScalar(s: number): Vec2;
	getMagnitude(): number;
	normalize(): Vec2;
	add(v: Vec2): Vec2;
	substract(v: Vec2): Vec2;
	dotProduct(v: Vec2): number;
	applyMat3(m: Mat3): Vec2;
	lerp(v: Vec2, t: number): Vec2;
	rotate(center: Vec2, theta: number): Vec2;
	equals(v: Vec2, precision?: number): boolean;
	toArray(): number[];
	toIntArray(): Int32Array;
	toFloatArray(): Float32Array;
	[Symbol.iterator](): Iterator<number>;
}
declare class Vec3 {
	readonly length = 3;
	x: number;
	y: number;
	z: number;
	constructor(x?: number, y?: number, z?: number);
	static multiplyByScalar(v: Vec3, s: number): Vec3;
	static addScalar(v: Vec3, s: number): Vec3;
	static normalize(v: Vec3): Vec3;
	static add(v1: Vec3, v2: Vec3): Vec3;
	static substract(v1: Vec3, v2: Vec3): Vec3;
	static dotProduct(v1: Vec3, v2: Vec3): number;
	static crossProduct(v1: Vec3, v2: Vec3): Vec3;
	static onVector(v1: Vec3, v2: Vec3): Vec3;
	static onPlane(v: Vec3, planeNormal: Vec3): Vec3;
	static applyMat3(v: Vec3, m: Mat3): Vec3;
	static lerp(v1: Vec3, v2: Vec3, t: number): Vec3;
	static equals(v1: Vec3, v2: Vec3, precision?: number): boolean;
	static getDistance(v1: Vec3, v2: Vec3): number;
	static getAngle(v1: Vec3, v2: Vec3): number;
	clone(): Vec3;
	set(x: number, y: number, z: number): Vec3;
	setFromVec3(v: Vec3): Vec3;
	multiplyByScalar(s: number): Vec3;
	addScalar(s: number): Vec3;
	getMagnitude(): number;
	getAngle(v: Vec3): number;
	normalize(): Vec3;
	add(v: Vec3): Vec3;
	substract(v: Vec3): Vec3;
	dotProduct(v: Vec3): number;
	crossProduct(v: Vec3): Vec3;
	onVector(v: Vec3): Vec3;
	onPlane(planeNormal: Vec3): Vec3;
	applyMat3(m: Mat3): Vec3;
	lerp(v: Vec3, t: number): Vec3;
	equals(v: Vec3, precision?: number): boolean;
	toArray(): number[];
	toIntArray(): Int32Array;
	toFloatArray(): Float32Array;
	[Symbol.iterator](): Iterator<number>;
}
declare class Mat3 {
	readonly length = 9;
	private readonly _matrix;
	get x_x(): number;
	get x_y(): number;
	get x_z(): number;
	get y_x(): number;
	get y_y(): number;
	get y_z(): number;
	get z_x(): number;
	get z_y(): number;
	get z_z(): number;
	constructor();
	static fromMat3(m: Mat3): Mat3;
	static multiply(m1: Mat3, m2: Mat3): Mat3;
	static multiplyScalar(m: Mat3, s: number): Mat3;
	static transpose(m: Mat3): Mat3;
	static invert(m: Mat3): Mat3;
	static buildScale(x: number, y?: number): Mat3;
	static buildRotation(theta: number): Mat3;
	static buildTranslate(x: number, y: number): Mat3;
	static equals(m1: Mat3, m2: Mat3, precision?: number): boolean;
	clone(): Mat3;
	set(...elements: number[]): Mat3;
	reset(): Mat3;
	setFromMat3(m: Mat3): Mat3;
	multiply(m: Mat3): Mat3;
	multiplyScalar(s: number): Mat3;
	transpose(): Mat3;
	invert(): Mat3;
	getDeterminant(): number;
	getTRS(): {
		t: Vec2;
		r: number;
		s: Vec2;
	};
	equals(m: Mat3, precision?: number): boolean;
	applyScaling(x: number, y?: number): Mat3;
	applyTranslation(x: number, y: number): Mat3;
	applyRotation(theta: number): Mat3;
	toArray(): number[];
	toIntArray(): Int32Array;
	toIntShortArray(): Int32Array;
	toFloatArray(): Float32Array;
	toFloatShortArray(): Float32Array;
	[Symbol.iterator](): Iterator<number>;
}
export interface RenderToSvgResult {
	svg: SVGGraphicsElement;
	clipPaths?: SVGClipPathElement[];
	tempCopy?: SVGGraphicsElement;
	tempCopyUse?: SVGUseElement;
}
export interface BBox {
	ll: Vec2;
	lr: Vec2;
	ur: Vec2;
	ul: Vec2;
}
declare class DecodeParamsDict extends PdfDict {
	protected readonly _intPropMap: Map<string, number>;
	protected readonly _boolPropMap: Map<string, boolean>;
	protected readonly _namePropMap: Map<string, string>;
	protected readonly _refPropMap: Map<string, ObjectId>;
	constructor();
	static parse(parseInfo: ParseInfo): ParseResult<DecodeParamsDict>;
	static parseArray(parser: DataParser, start: number, cryptInfo?: CryptInfo, skipEmpty?: boolean): ParseResult<DecodeParamsDict[]>;
	getIntProp(name: string): number;
	getBoolProp(name: string): boolean;
	getNameProp(name: string): string;
	getRefProp(name: string): ObjectId;
	setIntProp(name: string, value: number): Map<string, number>;
	setBoolProp(name: string, value: boolean): Map<string, boolean>;
	setNameProp(name: string, value: string): Map<string, string>;
	setRefProp(name: string, value: ObjectId): Map<string, ObjectId>;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	protected parseProps(parseInfo: ParseInfo): void;
}
declare abstract class PdfStream extends PdfObject {
	readonly Type: StreamType;
	Length: number;
	Filter: StreamFilter;
	DecodeParms: DecodeParamsDict;
	DL: number;
	protected _streamData: Uint8Array;
	protected _decodedStreamData: Uint8Array;
	get streamData(): Uint8Array;
	set streamData(data: Uint8Array);
	get decodedStreamData(): Uint8Array;
	get decodedStreamDataChars(): string;
	protected constructor(type: StreamType);
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	setTextStreamData(text: string): void;
	protected parseProps(parseInfo: ParseInfo): void;
	protected setStreamData(data: Uint8Array): void;
	protected decodeStreamData(): void;
}
declare class FontDict extends PdfDict {
	Subtype: string;
	BaseFont: string;
	Encoding: string;
	ToUnicode: ObjectId;
	constructor();
	static parse(parseInfo: ParseInfo): ParseResult<FontDict>;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	protected parseProps(parseInfo: ParseInfo): void;
}
declare class SoftMaskDict extends PdfDict {
	S: SoftMaskType;
	G: ObjectId;
	BC: number[];
	TR: "/Identity";
	constructor();
	static parse(parseInfo: ParseInfo): ParseResult<SoftMaskDict>;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	protected parseProps(parseInfo: ParseInfo): void;
}
export interface TextStateParams {
	fontFamily?: string;
	fontSize?: string;
	lineHeight?: string;
	letterSpacing?: string;
	wordSpacing?: string;
	textHorScale?: number;
	textRenderMode?: TextRenderMode;
	textVertAlign?: string;
	textKnockOut?: boolean;
}
declare class TextState {
	static readonly defaultParams: TextStateParams;
	fontFamily: string;
	fontSize: string;
	lineHeight: string;
	letterSpacing: string;
	wordSpacing: string;
	textHorScale: number;
	textRenderMode: TextRenderMode;
	textVertAlign: string;
	textKnockOut: boolean;
	constructor(params?: TextStateParams);
	clone(params?: TextStateParams): TextState;
}
export interface GraphicsStateParams {
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
	mixBlendMode?: "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | " color-burn" | "hard-light" | "soft-light" | "difference" | "exclusion";
}
declare class GraphicsStateDict extends PdfDict {
	LW: number;
	LC: LineCapStyle;
	LJ: LineJoinStyle;
	ML: number;
	D: [
		dashArray: [
			dash: number,
			gap: number
		],
		dashPhase: number
	];
	RI: RenderingIntent;
	OP: boolean;
	op: boolean;
	OPM: 0 | 1;
	Font: [
		font: ObjectId,
		size: number
	];
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
	static parse(parseInfo: ParseInfo): ParseResult<GraphicsStateDict>;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	toParams(): GraphicsStateParams;
	protected parseProps(parseInfo: ParseInfo): void;
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
	protected _gsMap: Map<string, GraphicsStateDict>;
	protected _fontsMap: Map<string, FontDict>;
	protected _xObjectsMap: Map<string, PdfStream>;
	constructor();
	static parse(parseInfo: ParseInfo): ParseResult<ResourceDict>;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	getGraphicsState(name: string): GraphicsStateDict;
	getGraphicsStates(): Iterable<[
		string,
		GraphicsStateDict
	]>;
	setGraphicsState(name: string, state: GraphicsStateDict): void;
	getFont(name: string): FontDict;
	getFonts(): Iterable<[
		string,
		FontDict
	]>;
	getXObject(name: string): PdfStream;
	getXObjects(): Iterable<[
		string,
		PdfStream
	]>;
	setXObject(name: string, xObject: PdfStream): void;
	protected fillMaps(parseInfoGetter: (id: number) => ParseInfo, cryptInfo?: CryptInfo): void;
	protected parseProps(parseInfo: ParseInfo): void;
}
declare class MeasureDict extends PdfDict {
	readonly Subtype = "/RL";
	constructor();
	static parse(parseInfo: ParseInfo): ParseResult<MeasureDict>;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	protected parseProps(parseInfo: ParseInfo): void;
}
declare abstract class GroupDict extends PdfDict {
	S: GroupDictType;
	protected constructor();
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	protected parseProps(parseInfo: ParseInfo): void;
}
declare class TransparencyGroupDict extends GroupDict {
	CS: string;
	I: boolean;
	K: boolean;
	constructor();
	static parse(parseInfo: ParseInfo): ParseResult<TransparencyGroupDict>;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	protected parseProps(parseInfo: ParseInfo): void;
}
declare class XFormStream extends PdfStream {
	readonly Subtype: "/Form";
	readonly FormType: 1;
	BBox: Rect;
	Matrix: Matrix;
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
	static parse(parseInfo: ParseInfo): ParseResult<XFormStream>;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	protected parseProps(parseInfo: ParseInfo): void;
}
declare class AppearanceDict extends PdfDict {
	N: ObjectMapDict | ObjectId;
	R: ObjectMapDict | ObjectId;
	D: ObjectMapDict | ObjectId;
	protected _streamsMap: Map<string, XFormStream>;
	constructor();
	static parse(parseInfo: ParseInfo): ParseResult<AppearanceDict>;
	getStream(key: string): XFormStream;
	getStreams(): Iterable<XFormStream>;
	setStream(key: string, stream: XFormStream): void;
	clearStreams(): void;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	protected fillStreamsMap(parseInfoGetter: (id: number) => ParseInfo): void;
	protected parseProps(parseInfo: ParseInfo): void;
}
declare const borderEffects: {
	NONE: string;
	CLOUDY: string;
};
export declare type BorderEffect = typeof borderEffects[keyof typeof borderEffects];
declare class BorderEffectDict extends PdfDict {
	S: BorderEffect;
	L: number;
	constructor();
	static parse(parseInfo: ParseInfo): ParseResult<BorderEffectDict>;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	protected parseProps(parseInfo: ParseInfo): void;
}
declare class LiteralString implements IEncodable {
	private readonly _literal;
	get literal(): string;
	private readonly _bytes;
	get bytes(): Uint8Array;
	private constructor();
	static parse(parser: DataParser, start: number, cryptInfo?: CryptInfo, skipEmpty?: boolean): ParseResult<LiteralString>;
	static fromBytes(bytes: Uint8Array): LiteralString;
	static fromString(source: string): LiteralString;
	private static escape;
	private static unescape;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
}
declare class BorderArray {
	readonly hCornerR: number;
	readonly vCornerR: number;
	readonly width: number;
	readonly dash: number;
	readonly gap: number;
	constructor(hCornerR: number, vCornerR: number, width: number, dash?: number, gap?: number);
	static parse(parser: DataParser, start: number, skipEmpty?: boolean): ParseResult<BorderArray>;
	toArray(cryptInfo?: CryptInfo): Uint8Array;
}
declare abstract class AnnotationDict extends PdfDict {
	$name: string;
	$pageId: number;
	$pageRect: Rect;
	$translationEnabled: boolean;
	readonly Subtype: AnnotationType;
	Rect: Rect;
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
	protected _transformationTimer: number;
	protected _transformationMatrix: Mat3;
	protected _transformationPoint: Vec2;
	protected _currentAngle: number;
	protected _boxX: Vec2;
	protected _boxY: Vec2;
	protected _boxXLength: number;
	protected _boxYLength: number;
	protected readonly _svgId: string;
	protected _svg: SVGGraphicsElement;
	protected _svgBox: SVGGraphicsElement;
	protected _svgContentCopy: SVGGraphicsElement;
	protected _svgContentCopyUse: SVGUseElement;
	protected _svgContent: SVGGraphicsElement;
	protected _svgClipPaths: SVGClipPathElement[];
	protected _lastRenderResult: RenderToSvgResult;
	get lastRenderResult(): RenderToSvgResult;
	protected constructor(subType: AnnotationType);
	toArray(cryptInfo?: CryptInfo): Uint8Array;
	renderAsync(): Promise<RenderToSvgResult>;
	applyCommonTransform(matrix: Mat3): void;
	moveTo(pageX: number, pageY: number): void;
	toDto(): AnnotationDto;
	protected parseProps(parseInfo: ParseInfo): void;
	protected getCurrentRotation(): number;
	protected getLocalBB(): BBox;
	protected applyRectTransform(matrix: Mat3): void;
	protected convertClientCoordsToPage(clientX: number, clientY: number): Vec2;
	protected convertPageCoordsToClient(pageX: number, pageY: number): Vec2;
	protected renderRect(): SVGGraphicsElement;
	protected renderBox(): SVGGraphicsElement;
	protected renderMainElement(): SVGGraphicsElement;
	protected renderApAsync(): Promise<RenderToSvgResult>;
	protected renderContent(): RenderToSvgResult;
	protected renderContentCopy(): {
		copy: SVGGraphicsElement;
		use: SVGUseElement;
	};
	protected renderScaleHandles(): SVGGraphicsElement[];
	protected renderRotationHandle(): SVGGraphicsElement;
	protected renderHandles(): SVGGraphicsElement[];
	protected updateRenderAsync(): Promise<void>;
	protected onRectPointerDown: (e: PointerEvent) => void;
	protected onRectPointerMove: (e: PointerEvent) => void;
	protected onRectPointerUp: (e: PointerEvent) => void;
	protected onRotationHandlePointerDown: (e: PointerEvent) => void;
	protected onRotationHandlePointerMove: (e: PointerEvent) => void;
	protected onRotationHandlePointerUp: (e: PointerEvent) => void;
	protected onScaleHandlePointerDown: (e: PointerEvent) => void;
	protected onScaleHandlePointerMove: (e: PointerEvent) => void;
	protected onScaleHandlePointerUp: (e: PointerEvent) => void;
}
export interface AnnotEventDetail {
	type: "select" | "add" | "edit" | "delete";
	annotations: AnnotationDict[];
}
export declare class AnnotEvent extends CustomEvent<AnnotEventDetail> {
	constructor(detail: AnnotEventDetail);
}
export interface AnnotChangeCallBacks {
	select: (annots: AnnotationDto[]) => void;
	add: (annots: AnnotationDto[]) => void;
	edit: (annots: AnnotationDto[]) => void;
	delete: (annots: AnnotationDto[]) => void;
}
export interface TsPdfViewerOptions {
	containerSelector: string;
	workerSource: string;
	userName?: string;
	annotChangeCallbacks?: AnnotChangeCallBacks;
}
export declare class TsPdfViewer {
	private readonly _userName;
	private readonly _visibleAdjPages;
	private readonly _previewWidth;
	private readonly _minScale;
	private readonly _maxScale;
	private _scale;
	private _annotChangeCallbacks;
	private _outerContainer;
	private _shadowRoot;
	private _mainContainer;
	private _mainContainerRObserver;
	private _panelsHidden;
	private _previewer;
	private _previewerHidden;
	private _viewer;
	private _viewerMode;
	private _pages;
	private _renderedPages;
	private _currentPage;
	private _pdfLoadingTask;
	private _pdfDocument;
	private _docData;
	private _annotatorMode;
	private _annotator;
	private _contextMenu;
	private _contextMenuEnabled;
	private _pointerInfo;
	private _timers;
	private _pinchInfo;
	constructor(options: TsPdfViewerOptions);
	private static downloadFile;
	destroy(): void;
	openPdfAsync(src: string | Blob | Uint8Array): Promise<void>;
	closePdfAsync(): Promise<void>;
	importAnnotations(dtos: AnnotationDto[]): void;
	exportAnnotations(): AnnotationDto[];
	importAnnotationsFromJson(json: string): void;
	exportAnnotationsToJson(): string;
	private initViewerGUI;
	private initMainDivs;
	private initViewControls;
	private initModeSwitchButtons;
	private initAnnotationButtons;
	private onPdfLoadingProgress;
	private onPdfLoadedAsync;
	private onPdfClosedAsync;
	private refreshPagesAsync;
	private scrollToPreview;
	private onPreviewerToggleClick;
	private onPreviewerPageClick;
	private onPreviewerScroll;
	private onViewerPointerMove;
	private setViewerMode;
	private disableCurrentViewerMode;
	private onTextModeButtonClick;
	private onHandModeButtonClick;
	private onAnnotationModeButtonClick;
	private scrollToPage;
	private onViewerScroll;
	private onViewerPointerDownScroll;
	private setScale;
	private zoom;
	private zoomOut;
	private zoomIn;
	private getViewerCenterPosition;
	private onViewerWheelZoom;
	private onViewerTouchZoom;
	private onZoomOutClick;
	private onZoomInClick;
	private onZoomFitViewerClick;
	private onZoomFitPageClick;
	private getVisiblePages;
	private getCurrentPage;
	private renderVisiblePreviews;
	private renderVisiblePages;
	private onPaginatorInput;
	private onPaginatorChange;
	private onPaginatorPrevClick;
	private onPaginatorNextClick;
	private onAnnotationDeleteButtonClick;
	private setAnnotationMode;
	private onAnnotationSelectModeButtonClick;
	private onAnnotationStampModeButtonClick;
	private onAnnotationPenModeButtonClick;
	private onAnnotationGeometricModeButtonClick;
	private onAnnotationChange;
	private initContextStampPicker;
	private initContextPenColorPicker;
	private updateAnnotatorPageData;
	private onDownloadFileButtonClick;
	private showPasswordDialogAsync;
}

export {};
