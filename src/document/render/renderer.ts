import { Mat3, Vec2 } from "../../math";
import { GraphicsState, GraphicsStateParams } from "./graphics-state";

export class Renderer {
  cropBox: {min: Vec2; max: Vec2};

  protected _graphicsStates: GraphicsState[] = [];
  get state(): GraphicsState {
    return this._graphicsStates[this._graphicsStates.length - 1];
  }

  constructor(min: Vec2, max: Vec2, matrix: Mat3) {
    this.cropBox = {min, max};
    this._graphicsStates.push(new GraphicsState({matrix}));
  }

  pushState(params?: GraphicsStateParams) {
    this._graphicsStates.push(Object.assign({}, this._graphicsStates[this._graphicsStates.length - 1], params));
  }
  
  popState(): GraphicsState {
    return this._graphicsStates.pop();
  }
}
