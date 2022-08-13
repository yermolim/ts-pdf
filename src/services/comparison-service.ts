/* eslint-disable @typescript-eslint/no-use-before-define */
import { PDFDocumentProxy, PDFPageProxy, RenderParameters } from "pdfjs-dist/types/src/display/api";

import { Vec2 } from "mathador";
import { Double, Quadruple } from "ts-viewers-core";

export type PdfDocComparisonResult = Map<number, PdfPageComparisonResult>;
export interface PdfPageComparisonResult {
  areas: Quadruple[];
  offset: Double;
};

export class ComparisonService {
  private readonly _maxChangedPixels: number;
  private _comparisonResult: PdfDocComparisonResult;
  
  constructor() {}
  
  destroy() {}

  getComparisonResult(): PdfDocComparisonResult {
    return this._comparisonResult;
  }

  getComparisonResultForPage(pageIndex: number): PdfPageComparisonResult {
    const comparisonResult = this.getComparisonResult();
    return comparisonResult?.get(pageIndex);
  }

  clearComparisonResult() {
    return this._comparisonResult = null;
  }

  /**
   * 
   * @param subjectDocProxy comparand doc proxy
   * @param agentDocProxy comparator doc proxy
   * @param offsets a map containing agent page offsets ([x, y]) by page index
   * @returns comparison result as a map 
   * (keys are page indices, values are AABB coords tuples of the changed areas)
   */
  async compareAsync(subjectDocProxy: PDFDocumentProxy, agentDocProxy: PDFDocumentProxy,
    offsets?: Map<number, Double>): Promise<PdfDocComparisonResult> {
    const result: PdfDocComparisonResult = new Map<number, PdfPageComparisonResult>();

    if (!subjectDocProxy || !agentDocProxy) {
      // nothing to compare
      return result;
    }

    const subjectPagesCount = subjectDocProxy.numPages;
    const agentPagesCount = agentDocProxy.numPages;
    for (let i = 0; i < subjectPagesCount; i++) {
      const subjectPage = await subjectDocProxy.getPage(i + 1);
      const agentPage = i < agentPagesCount
        ? await agentDocProxy.getPage(i + 1)
        : null;
      const pageComparisonResult = await this.comparePagesAsync(
        subjectPage, agentPage, offsets?.get(i));
      result.set(i, pageComparisonResult);
    }

    this._comparisonResult = result;
    return this._comparisonResult;
  }

  private async comparePagesAsync(subjectPageProxy: PDFPageProxy, 
    agentPageProxy: PDFPageProxy, offset?: Double): Promise<PdfPageComparisonResult> {

    const subjectImageData = await this.renderPageAsync(subjectPageProxy);
    const agentImageData = await this.renderPageAsync(agentPageProxy);
    
    const pageComparisonResult: PdfPageComparisonResult = 
      await this.compareImageDataAsync(subjectImageData, agentImageData, {offset});
    return pageComparisonResult;
  }
  
  private async renderPageAsync(pageProxy: PDFPageProxy): Promise<ImageData> {
    if (!pageProxy) {
      return null;
    }

    // get page viewport
    const viewport = pageProxy.getViewport({scale: 1, rotation: 0});
    const {width, height} = viewport;

    // create a new canvas of the needed size
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const canvasCtx = canvas.getContext("2d");

    // fill it with a rendered page
    const params = <RenderParameters>{
      canvasContext: canvasCtx,
      viewport: viewport,
      enableWebGL: true,
    };
    const renderTask = pageProxy.render(params);
    await renderTask.promise;

    const imageData = canvasCtx.getImageData(0, 0, width, height);
    return imageData;
  }

  /**
   * compare two images data
   * @param subjectImageData 
   * @param agentImageData 
   * @param options threshold: max distance between changed pixels to consider them belonging to the same area;
   * offset: agent image offset ([x, y])
   * @returns an array of AABB coords tuples of the changed areas
   */
  private async compareImageDataAsync(subjectImageData: ImageData, agentImageData: ImageData, 
    options?: {threshold?: number; offset?: Double}): Promise<PdfPageComparisonResult> {

    const threshold = options?.threshold ?? 5;
    const offset = options?.offset || [0, 0];

    // handle base cases
    if (!subjectImageData) {
      return {
        areas: [],
        offset: [0, 0],
      };
    }
    if (!agentImageData) {
      return {
        areas: [[0, 0, subjectImageData.width, subjectImageData.height]],
        offset: [0, 0],
      };
    }

    const aabbs: Quadruple[] = [];

    const sw = subjectImageData.width;
    const sh = subjectImageData.height;
    const aw = agentImageData.width;
    const ah = agentImageData.height;

    // run over image pixels
    const sBytes = subjectImageData.data;
    const aBytes = agentImageData.data;  
    let si: number;
    let ai: number;
    let ax: number;
    let ay: number;
    for (let sx = 0; sx < sw; sx++) {
      for (let sy = 0; sy < sh; sy++) {
        ax = sx + offset[0];
        ay = sy + offset[1];
        if (ax < 0 || ay < 0
          || ax >= aw || ay >= ah) {
          // this.addPixelToAabbs(aabbs, x, y, threshold, sw, sh);
          continue;
        }
        si = (sw * sy + sx) * 4;
        ai = (aw * ay + ax) * 4;
        if (sBytes[si] !== aBytes[ai]
          || sBytes[si + 1] !== aBytes[ai + 1]
          || sBytes[si + 2] !== aBytes[ai + 2]
          || sBytes[si + 3] !== aBytes[ai + 3]) {
          this.addPixelToAabbs(aabbs, sx, sy, threshold, sw, sh);
        }
      }
    }
    
    const mergedAabbs = this.mergeIntersectingAabbs(aabbs);    
    return {
      areas: mergedAabbs,
      offset,
    };
  }  

  private addPixelToAabbs(aabbs: Quadruple[], x: number, y: number, threshold: number,
    pageWidth: number, pageHeight: number) {
    let merged: boolean;
    const cxmin = Math.max(x - threshold, 0); 
    const cymin = Math.max(y - threshold, 0); 
    const cxmax = Math.min(x + threshold, pageWidth); 
    const cymax = Math.min(y + threshold, pageHeight);
    for (let j = 0; j < aabbs.length; j++) {
      const [mxmin, mymin, mxmax, mymax] = aabbs[j];
      if (Math.max(cxmin, mxmin) < Math.min(cxmax, mxmax)
        && Math.max(cymin, mymin) < Math.min(cymax, mymax)) {
        aabbs[j] = [Math.min(cxmin, mxmin), Math.min(cymin, mymin),
          Math.max(cxmax, mxmax), Math.max(cymax, mymax)];
        merged = true;
        break;
      }
    }
    if (!merged) {
      aabbs.push([cxmin, cymin, cxmax, cymax]);
    }
  }

  /**
   * compare two images data (pixel grouping is done using using DBSCAN algorithm)
   * @param subjectImageData 
   * @param agentImageData 
   * @param threshold max distance between changed pixels to consider them belonging to the same area
   * @returns an array of AABB coords tuples of the changed areas
   */
  private async compareImageDataDbscanAsync(subjectImageData: ImageData, 
    agentImageData: ImageData, threshold = 10): Promise<Quadruple[]> {
  
    // handle base cases
    if (!subjectImageData) {
      return [];
    }
    if (!agentImageData) {
      return [[0, 0, subjectImageData.width, subjectImageData.height]];
    }
  
    const changedPixels = this.getChangedPixels(subjectImageData, agentImageData);
  
    if (changedPixels.length > this._maxChangedPixels) {
      // return whole page as a rect to prevent extremely long clustering
      return [[0, 0, subjectImageData.width, subjectImageData.height]];
    }
  
    // DEBUG
    // console.log(changedPixels);
    // return changedPixels.map(x => [x.x, x.y, x.x, x.y]);
  
    // clusterise pixels
    const clusters = await DBSCAN.runAsync(changedPixels, threshold, 1);
  
    // DEBUG
    // console.log(clusters);
    // return clusters.flat().map(x => [x.x, x.y, x.x, x.y]);
  
    // get AABBs for clusters
    const aabbs = this.convertClustersToAabbs(clusters);
      
    // DEBUG
    // console.log(aabbs);
    // return aabbs;
  
    // merge intersecting AABBs
    const mergedAabbs = this.mergeIntersectingAabbs(aabbs);
      
    // DEBUG
    // console.log(mergedAabbs);
  
    return mergedAabbs;
  }

  private getChangedPixels(subjectImageData: ImageData, agentImageData: ImageData): Vec2[] {
    const sw = subjectImageData.width;
    const sh = subjectImageData.height;
    const aw = agentImageData.width;
    const ah = agentImageData.height;

    // get changed pixels
    const sBytes = subjectImageData.data;
    const aBytes = agentImageData.data;    
    const changedPixels: Vec2[] = [];
    let si: number;
    let ai: number;
    for (let x = 0; x < sw; x++) {
      for (let y = 0; y < sh; y++) {
        if (x >= aw || y >= ah) {
          changedPixels.push(new Vec2(x, y));
          continue;
        }
        si = (sw * y + x) * 4;
        ai = (aw * y + x) * 4;
        if (sBytes[si] !== aBytes[ai]
          || sBytes[si + 1] !== aBytes[ai + 1]
          || sBytes[si + 2] !== aBytes[ai + 2]
          || sBytes[si + 3] !== aBytes[ai + 3]) {
          changedPixels.push(new Vec2(x, y));
        }
      }
    }
    return changedPixels;
  }

  private convertClustersToAabbs(clusters: Vec2[][]): Quadruple[] {    
    const aabbs: Quadruple[] = [];
    for (const cluster of clusters) {
      if (!cluster?.length) {
        continue;
      }
      let aabb: number[];
      for (const vec of cluster) {
        if (!aabb) {
          aabb = [vec.x, vec.y, vec.x, vec.y];
          continue;
        }

        if (vec.x < aabb[0]) {
          aabb[0] = vec.x;
        } else if (vec.x > aabb[2]) {
          aabb[2] = vec.x;
        }

        if (vec.y < aabb[1]) {
          aabb[1] = vec.y;
        } else if (vec.y > aabb[3]) {
          aabb[3] = vec.y;
        }
      }
      aabbs.push(<Quadruple><any>aabb);
    }
    return aabbs;
  }

  private mergeIntersectingAabbs(aabbs: Quadruple[]): Quadruple[] {
    const mergedAabbs: Quadruple[] = [];
    for (const [cxmin, cymin, cxmax, cymax] of aabbs) {
      let merged: boolean;
      for (let j = 0; j < mergedAabbs.length; j++) {
        const [mxmin, mymin, mxmax, mymax] = mergedAabbs[j];
        if (Math.max(cxmin, mxmin) < Math.min(cxmax, mxmax)
          && Math.max(cymin, mymin) < Math.min(cymax, mymax)) {
          mergedAabbs[j] = [Math.min(cxmin, mxmin), Math.min(cymin, mymin),
            Math.max(cxmax, mxmax), Math.max(cymax, mymax)];
          merged = true;
          break;
        }
      }
      if (!merged) {
        mergedAabbs.push([cxmin, cymin, cxmax, cymax]);
      }
    }
    return mergedAabbs;
  }
}

class DBSCAN {
  private readonly _distance: number;
  private readonly _minPoints: number;

  private readonly _points: Vec2[];
  private readonly _clusters: Vec2[][] = [];
  private readonly _noise: number[] = [];
  private readonly _visited: boolean[];
  private readonly _assigned: boolean[];

  /**
   *
   * @param distance
   * @param minPoints
   */
  constructor (points: Vec2[], distance: number, minPoints: number) {
    this._points = points ?? [];
    this._distance = Math.max(distance, 0) || 1;
    this._minPoints = Math.max(minPoints, 1);

    this._visited = new Array<boolean>(points.length);
    this._assigned = new Array<boolean>(points.length);
  }

  static async runAsync(points: Vec2[], epsilon?: number, minPoints?: number): Promise<Vec2[][]> {
    const dbScan = new DBSCAN(points, epsilon ?? 1, minPoints ?? 1);
    // TODO: move to worker
    return dbScan.runClustering();
  }

  private runClustering(): Vec2[][] {
    if (!this._points.length) {
      return [];
    }

    for (let pointId = 0; pointId < this._points.length; pointId++) {
      // if point is not visited, check if it forms a cluster
      if (!this._visited[pointId]) {
        this._visited[pointId] = true;
  
        // if closest neighbourhood is too small to form a cluster, mark as noise
        const neighbours = this.getPointNeighbourIds(pointId);
  
        if (neighbours.length < this._minPoints) {
          this._noise.push(pointId);
        } else {
          // create new cluster and add point
          const clusterId = this._clusters.length;
          this._clusters.push([]);
          this.addPointToCluster(pointId, clusterId);  
          this.expandCluster(clusterId, neighbours);
        }
      }
    }
  
    return this._clusters;
  };
  
  /**
   * expand cluster to closest points of given neighbourhood
   * @param clusterId
   * @param neighbours
   */
  private expandCluster(clusterId: number, neighbours: number[]) {
    for (let i = 0; i < neighbours.length; i++) {
      const neighbourPoint = neighbours[i];

      if (!this._visited[neighbourPoint]) {
        this._visited[neighbourPoint] = true;
        const newNeighbours = this.getPointNeighbourIds(neighbourPoint);

        if (newNeighbours.length >= this._minPoints) {
          neighbours.push(...newNeighbours);
        }
      }

      if (!this._assigned[neighbourPoint]) {
        this.addPointToCluster(neighbourPoint, clusterId);
      }
    }
  };

  private addPointToCluster(pointId: number, clusterId: number) {
    this._clusters[clusterId].push(this._points[pointId]);
    this._assigned[pointId] = true;
  };

  /**
   * find all neighbour point ids for the point
   * @param pointId,
   * @returns
   */
  private getPointNeighbourIds(pointId: number): number[] {
    const neighbours: number[] = [];
    for (let i = 0; i < this._points.length; i++) {
      const dist = Vec2.getDistance(this._points[pointId], this._points[i]);
      if (dist < this._distance) {
        neighbours.push(i);
      }
    }
    return neighbours;
  };
}

