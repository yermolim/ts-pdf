// planning to use worker to prevent UI thread from blocking

export const workerSrc = /*javascript*/`
let bytes = new Uint8Array();
let maxBytesIndex = 0;

const messageQueue = [];
let busy = false;

self.onmessage = (event) => {
  if (busy) {
    messageQueue.push(event);
  } else {
    busy = true;
    processData(event.data);
  }
};

function sendResponse(response) {
  self.postMessage(response);
  if (messageQueue.length) {
    processData(messageQueue.shift().data);
  } else {
    busy = false;
  }
}

function processData(data) {
  switch (data.name) {
    case "init":
      if (data.bytes?.length) {
        bytes = data.bytes;
        maxBytesIndex = bytes.length - 1;
        sendResponse({name: "init", type: "success"});
      } else {        
        sendResponse({name: "init", type: "error", 
          message: "init: byte array is empty"});
      }
      break;      
    case "find-subarray":
      try {
        const subarrayBounds = findSubarrayIndex(data.sub, data.options);
        sendResponse({name: "find-subarray", type: "success", 
          result: subarrayBounds});
      } catch (e) {
        sendResponse({name: "find-subarray", type: "error", 
          message: e.message});
      }
      break;
    default:
      break;
  }
}

function findSubarrayIndex(sub, options) {
  const arr = bytes;

  const {direction, minIndex, maxIndex, closedOnly} = options;
  
  direction = direction ?? true;
  minIndex = Math.max(Math.min(minIndex ?? 0, maxBytesIndex), 0);
  maxIndex = Math.max(Math.min(maxIndex ?? maxBytesIndex, maxBytesIndex), 0);
  const allowOpened = !closedOnly;

  let i = direction
    ? minIndex
    : maxIndex; 

  let j; 
  if (direction) { 
    outer_loop:
    for (i; i <= maxIndex; i++) {
      for (j = 0; j < sub.length; j++) {
        if (arr[i + j] !== sub[j]) {
          continue outer_loop;
        }
      }
      if (allowOpened || !isRegularChar(arr[i + j])) {
        return {start: i, end: i + j - 1};
      }
    }
  } else {
    const subMaxIndex = sub.length - 1;
    outer_loop:
    for (i; i >= minIndex; i--) {
      for (j = 0; j < sub.length; j++) {
        if (arr[i - j] !== sub[subMaxIndex - j]) {
          continue outer_loop;
        }
      }
      if (allowOpened || !isRegularChar(arr[i - j])) {
        return {start: i - j + 1, end: i};
      }
    }
  }

  return null;
}
`;
