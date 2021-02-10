import { keywordCodes } from "../common/codes";
import { annotationTypes, dictTypes } from "../common/const";
import { AnnotationDict } from "../entities/annotations/annotation-dict";
import { FreeTextAnnotation } from "../entities/annotations/markup/free-text-annotation";
import { CircleAnnotation } from "../entities/annotations/markup/geometric/circle-annotation";
import { LineAnnotation } from "../entities/annotations/markup/geometric/line-annotation";
import { SquareAnnotation } from "../entities/annotations/markup/geometric/square-annotation";
import { InkAnnotation } from "../entities/annotations/markup/ink-annotation";
import { StampAnnotation } from "../entities/annotations/markup/stamp-annotation";
import { TextAnnotation } from "../entities/annotations/markup/text-annotation";
import { ObjectId } from "../entities/common/object-id";
import { ObjectStream } from "../entities/streams/object-stream";
import { CatalogDict } from "../entities/structure/catalog-dict";
import { PageDict } from "../entities/structure/page-dict";
import { PageTreeDict } from "../entities/structure/page-tree-dict";
import { XRef } from "../entities/x-refs/x-ref";
import { XRefStream } from "../entities/x-refs/x-ref-stream";
import { XRefTable } from "../entities/x-refs/x-ref-table";
import { DataParser, ParseInfo, ParseResult } from "./data-parser";
import { DataWriter } from "./data-writer";
import { ReferenceData, ReferenceDataChange } from "./reference-data";

export class DocumentData {
  private readonly _data: Uint8Array; 
  private readonly _docParser: DataParser;
  private readonly _version: string; 

  private readonly _xrefs: XRef[];
  private readonly _referenceData: ReferenceData;

  private _catalog: CatalogDict;
  private _pageRoot: PageTreeDict;
  private _pages: PageDict[];

  get size(): number {
    if (this._xrefs?.length) {
      return this._xrefs[0].size;
    } else {
      return 0;
    }
  }

  constructor(data: Uint8Array) {
    this._data = data;
    this._docParser = new DataParser(data);
    this._version = this._docParser.getPdfVersion();
    
    const lastXrefIndex = this._docParser.getLastXrefIndex();
    if (!lastXrefIndex) {{
      throw new Error("File doesn't contain update section");
    }}
    const xrefs = DocumentData.parseAllXrefs(this._docParser, lastXrefIndex.value);
    if (!xrefs.length) {{
      throw new Error("Failed to parse cross-reference sections");
    }}

    this._xrefs = xrefs;
    this._referenceData = new ReferenceData(xrefs);
    // DEBUG
    // console.log(this._xrefs);    
    // console.log(this._referenceData);   
    
    this.parsePageTree(); 
    // DEBUG
    // console.log(this._catalog);    
    // console.log(this._pageRoot); 
    // console.log(this._pages);  
  }    

  private static parseXref(parser: DataParser, start: number, max: number): XRef {
    if (!parser || !start) {
      return null;
    }
    
    const xrefTableIndex = parser.findSubarrayIndex(keywordCodes.XREF_TABLE, 
      {minIndex: start, closedOnly: true});
    if (xrefTableIndex && xrefTableIndex.start === start) {      
      const xrefStmIndexProp = parser.findSubarrayIndex(keywordCodes.XREF_HYBRID,
        {minIndex: start, maxIndex: max, closedOnly: true});
      if (xrefStmIndexProp) {
        // HYBRID
        const streamXrefIndex = parser.parseNumberAt(xrefStmIndexProp.end + 1);
        if (!streamXrefIndex) {
          return null;
        }
        start = streamXrefIndex.value;
      } else {
        // TABLE
        const xrefTable = XRefTable.parse(parser, start);
        return xrefTable?.value;
      }
    } else {
      // STREAM
    }

    const id = ObjectId.parse(parser, start, false);
    if (!id) {
      return null;
    }
    const xrefStreamBounds = parser.getIndirectObjectBoundsAt(id.end + 1);   
    if (!xrefStreamBounds) {      
      return null;
    }       
    const xrefStream = XRefStream.parse({parser: parser, bounds: xrefStreamBounds});
    return xrefStream?.value; 
  }  
  
  private static parseAllXrefs(parser: DataParser, start: number): XRef[] {    
    const xrefs: XRef[] = [];
    let max = parser.maxIndex;
    let xref: XRef;
    while (start) {
      xref = DocumentData.parseXref(parser, start, max);
      if (xref) {
        xrefs.push(xref);        
        max = start;
        start = xref.prev;
      } else {
        break;
      }
    }
    return xrefs;
  }

  getRefinedData(idsToDelete: number[]): Uint8Array {
    const changeData = new ReferenceDataChange(this._referenceData);
    idsToDelete.forEach(x => changeData.setRefFree(x));
    
    const writer = new DataWriter(this._data);

    const newXrefOffset = writer.offset;
    const newXrefRef = changeData.takeFreeRef(newXrefOffset, true);

    const entries = changeData.exportEntries();

    const lastXref = this._xrefs[0];
    const newXref = lastXref.createUpdate(entries);

    writer.writeIndirectObject(newXrefRef, newXref);
    writer.writeEof(newXrefOffset);  

    const bytes = writer.getCurrentData();
    return bytes;
  }

  getSupportedAnnotations(): Map<number, AnnotationDict[]> {
    const annotationMap = new Map<number, AnnotationDict[]>();
    
    for (const page of this._pages) {
      if (!page.Annots) {
        break;
      }

      const annotationIds: ObjectId[] = [];
      if (Array.isArray(page.Annots)) {
        annotationIds.push(...page.Annots);
      } else {
        const parseInfo = this.getObjectParseInfo(page.Annots.id);
        if (parseInfo) {
          const annotationRefs = ObjectId.parseRefArray(parseInfo.parser, 
            parseInfo.bounds.contentStart);
          if (annotationRefs?.value?.length) {
            annotationIds.push(...annotationRefs.value);
          }
        }        
      }

      const annotations: AnnotationDict[] = [];
      for (const objectId of annotationIds) {
        const info = this.getObjectParseInfo(objectId.id);
  
        const annotationType = info.parser.parseDictSubtype(info.bounds);
        let annot: ParseResult<AnnotationDict>;
        switch (annotationType) {
          case annotationTypes.TEXT:
            annot = TextAnnotation.parse(info);
            break;
          case annotationTypes.FREE_TEXT:
            annot = FreeTextAnnotation.parse(info);
            break;
          case annotationTypes.STAMP:
            annot = StampAnnotation.parse(info);
            break;
          case annotationTypes.CIRCLE:
            annot = CircleAnnotation.parse(info);
            break;
          case annotationTypes.SQUARE:
            annot = SquareAnnotation.parse(info);
            break;
          case annotationTypes.POLYGON:
            annot = SquareAnnotation.parse(info);
            break;
          case annotationTypes.POLYLINE:
            annot = SquareAnnotation.parse(info);
            break;
          case annotationTypes.LINE:
            annot = LineAnnotation.parse(info);
            break;
          case annotationTypes.INK:
            annot = InkAnnotation.parse(info);
            break;
          default:
            break;
        }
        if (annot) {
          annotations.push(annot.value);
        }
      }
      
      annotationMap.set(page.id, annotations);
    }

    return annotationMap;
  }

  private parsePageTree() {  
    const catalogId = this._xrefs[0].root;
    const catalogParseInfo = this.getObjectParseInfo(catalogId.id);
    const catalog = CatalogDict.parse(catalogParseInfo);
    if (!catalog) {
      throw new Error("Document root catalog not found");
    }
    this._catalog = catalog.value;
    const pageRootId = catalog.value.Pages;
    const pageRootParseInfo = this.getObjectParseInfo(pageRootId.id);
    const pageRootTree = PageTreeDict.parse(pageRootParseInfo);
    if (!pageRootTree) {
      throw new Error("Document root page tree not found");
    }
    this._pageRoot = pageRootTree.value;    

    const pages: PageDict[] = [];
    this.parsePages(pages, pageRootTree.value);
    this._pages = pages;
  }

  private parsePages(output: PageDict[], tree: PageTreeDict) {
    if (!tree.Kids.length) {
      return;
    }

    for (const kid of tree.Kids) {
      const parseInfo = this.getObjectParseInfo(kid.id);
      if (!parseInfo) {
        continue;
      }

      const type = parseInfo.parser.parseDictType(parseInfo.bounds);
      if (type === dictTypes.PAGE_TREE) {          
        const kidTree = PageTreeDict.parse(parseInfo);
        if (kidTree) {
          this.parsePages(output, kidTree.value);
        }
      } else if (type === dictTypes.PAGE) {        
        const kidPage = PageDict.parse(parseInfo);
        if (kidPage) {
          output.push(kidPage.value);
        }
      }
    }
  };  
 
  /**
   * returns a proper parser instance and byte bounds for the object by its id.
   * returns null if an object with the specified id not found.
   * @param id 
   */
  private getObjectParseInfo = (id: number): ParseInfo => {
    if (!id) {
      return null;
    }
    const offset = this._referenceData?.getOffset(id);
    if (isNaN(offset)) {
      return null;
    } 
    
    const objectId = ObjectId.parse(this._docParser, offset);
    if (!objectId) {
      return null;
    }   

    const bounds = this._docParser.getIndirectObjectBoundsAt(objectId.end + 1, true);
    if (!bounds) {
      return null;
    }
    const parseInfoGetter = this.getObjectParseInfo;
    const info = {
      parser: this._docParser, 
      bounds, 
      parseInfoGetter, 
      id: objectId.value.id,
      generation: objectId.value.generation,
    };

    if (objectId.value.id === id) {
      // object id equals the sought one, so this is the needed object
      return info;
    } 

    // object id at the given offset is not equal to the sought one
    // check if the object is an object stream and try to find the needed object inside it
    const stream = ObjectStream.parse(info);
    if (!stream) {
      return;
    }
    const objectParseInfo = stream.value.getObjectData(id);
    if (objectParseInfo) {
      // the object is found inside the stream
      objectParseInfo.parseInfoGetter = parseInfoGetter;
      return objectParseInfo;
    }

    return null;
  };
}
