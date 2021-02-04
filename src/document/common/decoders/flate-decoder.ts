/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-bitwise */
import { FlatePredictor, flatePredictors } from "../const";
import { FlateStream } from "../streams/flate-stream";
import { Stream } from "../streams/stream";

export class FlateDecoder {
  static Decode(input: Uint8Array, 
    predictor: FlatePredictor = flatePredictors.NONE, 
    columns = 1, components = 1, bpc = 8): Uint8Array {

    const stream = new Stream(input, 0, input.length);
    const flate = new FlateStream(stream);

    /* TODO: make iterable decoding not returning all bytes at once
    to improve performance and memory use */
    const inflated = <Uint8Array>flate.takeBytes(null);
    switch (predictor) {
      case (flatePredictors.NONE):
        return inflated;
      case (flatePredictors.PNG_NONE):
      case (flatePredictors.PNG_SUB):
      case (flatePredictors.PNG_UP):
      case (flatePredictors.PNG_AVERAGE):
      case (flatePredictors.PNG_PAETH):
      case (flatePredictors.PNG_OPTIMUM):
        return FlateDecoder.removePngFilter(inflated, columns, components, bpc);
      case (flatePredictors.TIFF):
        throw new Error("Unsupported filter predictor");
    }
  }

  static Encode(input: Uint8Array): Uint8Array {
    // TODO: implement
    return null;
  }

  private static removePngFilter(input: Uint8Array, 
    columns: number, components: number, bpc: number): Uint8Array {
      
    const interval = Math.ceil(components * bpc / 8);
    const lineLen = columns * interval;    
    const lineLen_filtered = lineLen + 1;

    if (!!(input.length % lineLen_filtered)) {
      throw new Error("Data length doesn't match filter columns");
    }

    const output = new Uint8Array(input.length / lineLen_filtered * lineLen);
    const previous: number[] = new Array(lineLen).fill(0);
    const current: number[] = new Array(lineLen).fill(0);
    
    const getLeft = (j: number) => 
      j - interval < 0 // the pixel is the first one in the line, so 'left' is 0
        ? 0 
        : current[j - interval];

    const getAbove = (j: number) => 
      previous[j];

    const getUpperLeft = (j: number) => 
      j - interval < 0 // the pixel is the first one in the line, so 'upperLeft' is 0
        ? 0 
        : previous[j - interval];
    
    let x = 0;
    let y = 0;
    let k = 0;
    let rowStart = 0;
    let filterType = 0;
    let result = 0;
    for (let i = 0; i < input.length; i++) {
      if (i % lineLen_filtered === 0) {
        filterType = input[i];
        x = 0;
        if (i) {
          for (k = 0; k < lineLen; k++) {
            previous[k] = output[rowStart + k];
          }
        }
        rowStart = y;
      } else {
        current[x] = input[i];
        switch (filterType) {
          case 0: // PNG_NONE 
            // With the None filter, the scanline is transmitted unmodified
            result = current[x];
            break;
          case 1: // PNG_SUB 
            // The Sub filter transmits the difference between each byte 
            // and the value of the corresponding byte of the prior pixel
            result = (current[x] + getLeft(x)) % 256;
            break;
          case 2: // PNG_UP 
            // The Up filter is just like the Sub filter except that the pixel 
            // immediately above the current pixel, rather than just to its left, is used as the predictor
            result = (current[x] + getAbove(x)) % 256;
            break;
          case 3: // PNG_AVERAGE
            // The Average filter uses the average of the two neighboring pixels (left and above) 
            // to predict the value of a pixel
            result = (current[x] + Math.floor((getAbove(x) + getLeft(x)) / 2)) % 256;
            break;
          case 4: // PNG_PAETH 
            // The Paeth filter computes a simple linear function of the three neighboring pixels 
            // (left, above, upper left), then chooses as predictor the neighboring pixel 
            // closest to the computed value
            result = (current[x] + this.paethPredictor(getLeft(x), getAbove(x), getUpperLeft(x))) % 256;
            break;
        }
        output[y++] = result;
        x++;
      }
    }

    return output;
  }

  private static applyPngFilter(input: Uint8Array, 
    predictor: 10 | 11 | 12 | 13 | 14,
    columns: number): Uint8Array {

    // TODO: Implement
      
    switch (predictor) {
      case flatePredictors.PNG_NONE:
        // With the None filter, the scanline is transmitted unmodified
        break;
      case flatePredictors.PNG_SUB:
        // The Sub filter transmits the difference between each byte 
        // and the value of the corresponding byte of the prior pixel
        break;
      case flatePredictors.PNG_UP:
        // The Up filter is just like the Sub filter except that the pixel 
        // immediately above the current pixel, rather than just to its left, is used as the predictor
        break;
      case flatePredictors.PNG_AVERAGE:
        // The Average filter uses the average of the two neighboring pixels (left and above) 
        // to predict the value of a pixel
        break;
      case flatePredictors.PNG_PAETH:
        // The Paeth filter computes a simple linear function of the three neighboring pixels 
        // (left, above, upper left), then chooses as predictor the neighboring pixel 
        // closest to the computed value
        break;
    }

    return null;
  }

  /**
   * The Paeth filter computes a simple linear function 
   * of the three neighboring pixels (left, above, upper left), 
   * then chooses as predictor the neighboring pixel closest to the computed value
   * @param a left pixel
   * @param b above pixel
   * @param c upper left pixel
   */
  private static paethPredictor(a: number, b: number, c: number): number {

    const p = a + b - c;
    const pa = Math.abs(p - a);
    const pb = Math.abs(p - b);
    const pc = Math.abs(p - c);

    if (pa <= pb && pa <= pc) {
      return a;
    } else if (pb <= pc) {
      return b;
    } else {
      return c;
    }
  }
}
