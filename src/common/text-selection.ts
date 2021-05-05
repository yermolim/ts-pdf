import { Vec2 } from "./math";
import { Octuple } from "./types";

export interface TextSelectionInfo {
  text: string;

  bottomLeft: Vec2;
  bottomRight: Vec2;
  topRight: Vec2;
  topLeft: Vec2;
}

function getNextNode(node: Node): Node {
  if (node.hasChildNodes()) {
    return node.firstChild;
  } else {
    while (node && !node.nextSibling) {
      node = node.parentNode;
    }
    if (!node) {
      return null;
    }
    return node.nextSibling;
  }
}

function getRangeNodes(range: Range): Node[] {
  let node = range.startContainer;
  const endNode = range.endContainer;

  // Special case for a range that is contained within a single node
  if (node === endNode) {
    return [node];
  }

  // Iterate nodes until we hit the end container
  const rangeNodes: Node[] = [];
  while (node && node !== endNode) {
    rangeNodes.push( node = getNextNode(node) );
  }

  // Add partially selected nodes at the start of the range
  node = range.startContainer;
  while (node && node !== range.commonAncestorContainer) {
    rangeNodes.unshift(node);
    node = node.parentNode;
  }

  return rangeNodes;
}

/**
 * get information about text selection from the selected range.
 * uses built-in 'Range.getBoundingClientRect' for getting coordinates,
 * so gives a correct result only if text nodes in the range are horizontally aligned
 * @param range selected range
 * @returns information objects
 */
function getSelectionInfosFromRangeTextNodes(range: Range): TextSelectionInfo[] {
  // when using PDF.js text render, different line of text are always in the separate span
  // so each node in the range is treated as a single-line text
  const textNodes = getRangeNodes(range).filter(x => x.nodeType === 3);

  const tempRange = document.createRange();
  const selectionInfos: TextSelectionInfo[] = [];
  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];

    const textContent = node.textContent;
    if (!textContent) {
      continue;
    }

    const textLength = node.textContent?.length || 0;
    let startOffset = 0;
    let endOffset = textLength;
    if (i === 0) {
      startOffset = range.startOffset;
    }
    if (i === textNodes.length - 1) {
      endOffset = range.endOffset;
    }
    const text = textContent.slice(startOffset, endOffset);

    tempRange.selectNode(node);
    const {x, y: ymin, width, height} = tempRange.getBoundingClientRect();
    const xmin = x + width * startOffset / textLength;
    const xmax = x + width * endOffset / textLength;
    const ymax = ymin + height;
    
    selectionInfos.push({
      text,
      bottomLeft: new Vec2(xmin, ymin),
      bottomRight: new Vec2(xmax, ymin),
      topRight: new Vec2(xmax, ymax),
      topLeft: new Vec2(xmin, ymax),
    });
  }

  return selectionInfos;
}

/**
 * get information about text selection from the selected range.
 * requirements for getting a correct result: 
 * - all text nodes are located inside 'span' elements;
 * - all the 'span' elements have absolutely-positioned dummy elements
 *   at the corners having the 'dummy-corner' class and one of the next classes 
 *   to indicate the corner: 'bl', 'br', 'tr', 'tl'. 
 *   these elements are used to get the client coordinates of the 'span' corner.
 * @param range selected range
 * @returns information objects 
 */
function getSelectionInfosFromRangeSpans(range: Range): TextSelectionInfo[] {
  // when using PDF.js text render, different line of text are always in the separate span
  // so each span in the range is treated as containing a single-line text
  const textNodes = getRangeNodes(range).filter(x => x.nodeType === 3);
  
  const selectionInfos: TextSelectionInfo[] = [];
  for (let i = 0; i < textNodes.length; i++) {
    const node = textNodes[i];

    const textContent = node.textContent;
    if (!textContent) {
      // ignore the text node if it has no content
      continue;
    }

    const textLength = node.textContent?.length || 0;
    let startOffset = 0;
    let endOffset = textLength;
    if (i === 0) {
      startOffset = range.startOffset;
    }
    if (i === textNodes.length - 1) {
      endOffset = range.endOffset;
    }
    const text = textContent.slice(startOffset, endOffset);

    if (!text) {
      // ignore the selection if it has no text content
      continue;
    }

    const parent = node.parentElement;
    if (!parent || parent.tagName.toLowerCase() !== "span") {
      // ignore the text node if it is not located inside span
      continue;
    }

    const dummies = parent.querySelectorAll(".dummy-corner");
    if (dummies.length !== 4) {
      // there should be four dummy-corner elements inside the span
      // otherwise skip the node
      continue;
    }
    
    // DEBUG
    // console.log(parent);  
    // console.log(parent.getBoundingClientRect());  

    // get all span corners positions
    const spanBlVec = new Vec2();
    const spanBrVec = new Vec2();
    const spanTrVec = new Vec2();
    const spanTlVec = new Vec2();
    dummies.forEach(dummy => {
      const {x, y} = dummy.getBoundingClientRect();

      // DEBUG
      // console.log(dummy);          
      // console.log(dummy.getBoundingClientRect());      

      if (dummy.classList.contains("bl")) {
        spanBlVec.set(x, y);
      } else if (dummy.classList.contains("br")) {
        spanBrVec.set(x, y);
      } else if (dummy.classList.contains("tr")) {
        spanTrVec.set(x, y);
      } else if (dummy.classList.contains("tl")) {
        spanTlVec.set(x, y);
      }
    });
    
    const startOffsetRelative = startOffset / textLength;
    const endOffsetRelative = endOffset / textLength;

    // top and bottom vectors should actually be the same 
    // except for some skew transformations,
    // so decided to keep them separated
    const spanBottomVec = Vec2.substract(spanBrVec, spanBlVec);
    const spanTopVec = Vec2.substract(spanTrVec, spanTlVec);    

    //calculate the selected text corner positions taking offsets into account
    const selectionBlVec = Vec2.add(
      spanBlVec, 
      Vec2.multiplyByScalar(spanBottomVec, startOffsetRelative)
    );
    const selectionBrVec = Vec2.add(
      spanBlVec, 
      Vec2.multiplyByScalar(spanBottomVec, endOffsetRelative)
    );
    const selectionTrVec = Vec2.add(
      spanTlVec, 
      Vec2.multiplyByScalar(spanTopVec, endOffsetRelative)
    );
    const selectionTlVec = Vec2.add(
      spanTlVec, 
      Vec2.multiplyByScalar(spanTopVec, startOffsetRelative)
    );

    selectionInfos.push({
      text,
      bottomLeft: selectionBlVec,
      bottomRight: selectionBrVec,
      topRight: selectionTrVec,
      topLeft: selectionTlVec,
    });
  }  

  return selectionInfos;
}

export function getSelectionInfosFromSelection(selection: Selection): TextSelectionInfo[] {  
  const selectionRange = selection.getRangeAt(0);
  
  // a simple way which returns axis-aligned bounding boxes
  // return getSelectionInfosFromRangeTextNodes(selectionRange);

  return getSelectionInfosFromRangeSpans(selectionRange);
}
