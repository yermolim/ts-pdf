import { dictObjTypes, flatePredictors, FlatePredictor } from "../../const";
import { DictObj } from "../core/dict-obj";

export class FlateParamsDict extends DictObj {
  /**
   * A code that selects the predictor algorithm, if any. 
   * If the value of this entry is 1, the filter shall assume 
   * that the normal algorithm was used to encode the data, without prediction. 
   * If the value is greater than 1, the filter shall assume 
   * that the data was differenced before being encoded, 
   * and Predictor selects the predictor algorithm
   */
  Predictor: FlatePredictor = flatePredictors.NONE;
  /**
   * (May be used only if Predictor is greater than 1) 
   * The number of interleaved color components per sample. 
   * Valid values are 1 to 4 (PDF 1.0+) and 1 or greater (PDF 1.3+)
   */
  Colors = 1;
  /**
   * (May be used only if Predictor is greater than 1) 
   * The number of bits used to represent each colour component in a sample. 
   * Valid values are 1, 2, 4, 8, and (PDF 1.5+) 16
   */
  BitsPerComponent: 1 | 2 | 4 | 8 | 16 = 8;
  /**
   * (May be used only if Predictor is greater than 1) 
   * The number of samples in each row
   */
  Columns = 1;
  
  constructor() {
    super(dictObjTypes.EMPTY);
  }
}
