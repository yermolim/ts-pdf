import { annotationTypes } from "../../../const";
import { getRandomUuid } from "../../../../common";
import { CryptInfo, Rect } from "../../../common-interfaces";
import { ParseInfo, ParseResult } from "../../../data-parser";

import { DateString } from "../../strings/date-string";
import { LiteralString } from "../../strings/literal-string";

import { XFormStream } from "../../streams/x-form-stream";
import { ResourceDict } from "../../appearance/resource-dict";
import { MarkupAnnotation } from "./markup-annotation";

export const stampTypes = {
  DRAFT: "/Draft",
  NOT_APPROVED: "/NotApproved",
  APPROVED: "/Approved",
  AS_IS: "/AsIs",
  FOR_COMMENT: "/ForComment",
  EXPERIMENTAL: "/Experimental",
  FINAL: "/Final",
  SOLD: "/Sold",
  EXPIRED: "/Expired",
  PUBLIC: "/ForPublicRelease",
  NOT_PUBLIC: "/NotForPublicRelease",
  DEPARTMENTAL: "/Departmental",
  CONFIDENTIAL: "/Confidential",
  SECRET: "/TopSecret",
} as const;
export type StampType = typeof stampTypes[keyof typeof stampTypes];

const stampBBox: Rect = [0, 0, 440, 120];
const halfStampBBox: Rect = [0, 0, 220, 60];
const draftStampForm = 
`33.5 13.4 m
404.5 6.92 l
419.6 6.657 431.9 18.52 432.1 33.62 c
432.89 78.92 l
433.153 94.02 421.29 106.32 406.19 106.52 c
35.19 113 l
20.09 113.263 7.79 101.4 7.59 86.3 c
6.8 41 l
6.537 25.9 18.4 13.6 33.5 13.4 c
s
150 61 m
150.047 65.947 149.114 70.413 147.2 74.4 c
145.287 78.333 142.853 81.373 139.9 83.52 c
137.68 85.127 135.24 86.263 132.58 86.93 c
129.92 87.593 126.763 87.957 123.11 88.02 c
106.91 88.29 l
106.401 35.19 l
123.001 34.912 l
126.734 34.85 129.961 35.165 132.681 35.857 c
135.394 36.524 137.681 37.507 139.541 38.807 c
142.721 40.994 145.234 43.974 147.081 47.747 c
148.941 51.5 149.898 55.934 149.951 61.047 c
h
137.8 61.097 m
137.767 57.597 137.183 54.621 136.05 52.167 c
134.937 49.687 133.183 47.764 130.79 46.397 c
129.57 45.731 128.323 45.287 127.05 45.067 c
125.797 44.827 123.897 44.728 121.35 44.77 c
118.36 44.82 l
118.678 78.12 l
121.668 78.07 l
124.481 78.023 126.541 77.846 127.848 77.538 c
129.161 77.207 130.438 76.637 131.678 75.828 c
133.818 74.362 135.381 72.432 136.368 70.038 c
137.348 67.618 137.821 64.648 137.788 61.128 c
f
185 50 m
184.987 48.667 184.74 47.53 184.259 46.59 c
183.778 45.643 182.961 44.907 181.809 44.38 c
181.002 44.013 180.066 43.802 178.999 43.749 c
177.932 43.672 176.689 43.645 175.269 43.669 c
170.989 43.74 l
171.126 58.04 l
174.756 57.979 l
176.643 57.948 178.223 57.814 179.496 57.579 c
180.769 57.344 181.833 56.837 182.686 56.059 c
183.499 55.306 184.086 54.486 184.446 53.599 c
184.827 52.686 185.011 51.483 184.996 49.989 c
h
203.8 86.6 m
189.4 86.841 l
176.7 67.541 l
171.25 67.632 l
171.437 87.132 l
159.637 87.329 l
159.128 34.229 l
178.928 33.897 l
181.635 33.852 183.965 33.991 185.918 34.315 c
187.871 34.639 189.705 35.382 191.418 36.545 c
193.151 37.705 194.531 39.228 195.558 41.115 c
196.605 42.975 197.141 45.335 197.168 48.195 c
197.206 52.122 196.446 55.335 194.888 57.835 c
193.355 60.335 191.138 62.432 188.238 64.125 c
f
251 85.8 m
238.8 86.004 l
235.53 75.304 l
218.53 75.588 l
215.46 86.388 l
203.56 86.587 l
219.96 33.187 l
233.56 32.959 l
h
232.6 65.6 m
226.78 46.6 l
221.33 65.8 l
f
290 42.3 m
268.9 42.653 l
268.995 52.543 l
288.495 52.216 l
288.593 62.516 l
269.093 62.843 l
269.31 85.543 l
257.51 85.74 l
257.001 32.64 l
289.801 32.091 l
f
334 41.5 m
319.7 41.739 l
320.11 84.639 l
308.31 84.837 l
307.9 41.937 l
293.6 42.176 l
293.502 31.876 l
333.902 31.199 l
f
`;

export class StampAnnotation extends MarkupAnnotation {
  /**
   * (Optional) The name of an icon that shall be used in displaying the annotation
   */
  Name: StampType | string = stampTypes.DRAFT;
  
  protected constructor() {
    super(annotationTypes.STAMP);
  }

  static createStandard(type: StampType): StampAnnotation {
    const now = DateString.fromDate(new Date());

    const stampForm = new XFormStream();
    stampForm.LastModified = now;
    stampForm.BBox = stampBBox;
    stampForm.Filter = "/FlateDecode";
    switch (type) {
      case "/Draft":        
        stampForm.setTextStreamData(draftStampForm);
        break;
      default:
        throw new Error(`Stamp type '${type}' is not supported`);
    }

    const stampApStream = new XFormStream();
    stampApStream.LastModified = now;
    stampApStream.BBox = stampBBox;
    stampApStream.Resources = new ResourceDict();
    stampApStream.Resources.setXObject("/Fm", stampForm);
    stampApStream.Filter = "/FlateDecode";
    stampApStream.setTextStreamData(`q 1 0 0 -1 0 ${stampBBox[3]} cm .804 0 0 rg .804 0 0 RG 1 j 8.58 w /Fm Do Q`);

    const stampUuid = getRandomUuid();
    const stampAnnotation = new StampAnnotation();
    stampAnnotation.Name = type;
    stampAnnotation.Rect = halfStampBBox;
    stampAnnotation.Contents = LiteralString.fromString(type.slice(1));
    stampAnnotation.Subj = LiteralString.fromString(type.slice(1));
    stampAnnotation.CreationDate = now;
    stampAnnotation.NM = LiteralString.fromString(stampUuid);
    stampAnnotation.name = stampUuid;
    stampAnnotation.apStream = stampApStream;

    return stampAnnotation;
  }

  static parse(parseInfo: ParseInfo): ParseResult<StampAnnotation> {
    if (!parseInfo) {
      throw new Error("Parsing information not passed");
    }
    try {
      const pdfObject = new StampAnnotation();
      pdfObject.parseProps(parseInfo); 
      const proxy = new Proxy<StampAnnotation>(pdfObject, pdfObject.onChange);
      pdfObject._proxy = proxy;
      return {value: proxy, start: parseInfo.bounds.start, end: parseInfo.bounds.end};
    } catch (e) {
      console.log(e.message);
      return null;
    }
  }  
  
  toArray(cryptInfo?: CryptInfo): Uint8Array {
    const superBytes = super.toArray(cryptInfo);  
    const encoder = new TextEncoder();  
    const bytes: number[] = [];  

    if (this.Name) {
      bytes.push(...encoder.encode("/Name "), ...encoder.encode(this.Name));
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
  protected parseProps(parseInfo: ParseInfo) {
    super.parseProps(parseInfo);
    const {parser, bounds} = parseInfo;
    const start = bounds.contentStart || bounds.start;
    const end = bounds.contentEnd || bounds.end; 

    parser.sliceChars(start, end);
    
    let i = parser.skipToNextName(start, end - 1);
    let name: string;
    let parseResult: ParseResult<string>;
    while (true) {
      parseResult = parser.parseNameAt(i);
      if (parseResult) {
        i = parseResult.end + 1;
        name = parseResult.value;
        switch (name) {
          case "/Name":
            i = this.parseNameProp(name, parser, i);
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
    
    if (!this.Name) {
      throw new Error("Not all required properties parsed");
    }
  }
}
