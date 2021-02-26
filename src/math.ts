export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(v, max));
}

export class Vec2 {
  readonly length = 2;
  x: number;
  y: number;

  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  static multiplyByScalar(v: Vec2, s: number): Vec2 {
    return new Vec2(v.x * s, v.y * s);
  }
  
  static addScalar(v: Vec2, s: number): Vec2 {
    return new Vec2(v.x + s, v.y + s);
  }

  static normalize(v: Vec2): Vec2 {
    return new Vec2().setFromVec2(v).normalize();
  }

  static add(v1: Vec2, v2: Vec2): Vec2 {
    return new Vec2(v1.x + v2.x, v1.y + v2.y);
  }

  static substract(v1: Vec2, v2: Vec2): Vec2 {
    return new Vec2(v1.x - v2.x, v1.y - v2.y);
  }

  static dotProduct(v1: Vec2, v2: Vec2): number {
    return v1.x * v2.x + v1.y * v2.y;
  }

  static applyMat3(v: Vec2, m: Mat3): Vec2 {
    return v.clone().applyMat3(m);
  }

  static lerp(v1: Vec2, v2: Vec2, t: number): Vec2 {
    return v1.clone().lerp(v2, t);
  }
  
  static rotate(v: Vec2, center: Vec2, theta: number): Vec2 {
    return v.clone().rotate(center, theta);
  }

  static equals(v1: Vec2, v2: Vec2, precision = 6): boolean {
    return v1.equals(v2);
  }
  
  static getDistance(v1: Vec2, v2: Vec2): number {
    const x = v2.x - v1.x;
    const y = v2.y - v1.y;
    return Math.sqrt(x * x + y * y);
  }

  clone(): Vec2 {
    return new Vec2(this.x, this.y);
  }

  set(x: number, y: number): Vec2 {
    this.x = x;
    this.y = y;
    return this;
  }
  
  setFromVec2(vec2: Vec2): Vec2 {
    this.x = vec2.x;
    this.y = vec2.y;
    return this;
  }

  multiplyByScalar(s: number): Vec2 {
    this.x *= s;
    this.y *= s;
    return this;
  }

  addScalar(s: number): Vec2 {
    this.x += s;
    this.y += s;
    return this;
  }

  getMagnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  normalize(): Vec2 {
    const m = this.getMagnitude();
    if (m) {
      this.x /= m;
      this.y /= m;      
    }
    return this;
  }  

  add(v: Vec2): Vec2 {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  substract(v: Vec2): Vec2 {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  dotProduct(v: Vec2): number {
    return Vec2.dotProduct(this, v);
  }

  applyMat3(m: Mat3): Vec2 {
    if (m.length !== 9) {
      throw new Error("Matrix must contain 9 elements");
    }

    const {x, y} = this;
    const [x_x, x_y,, y_x, y_y,, z_x, z_y,] = m;

    this.x = x * x_x + y * y_x + z_x;
    this.y = x * x_y + y * y_y + z_y;

    return this;
  } 

  lerp(v: Vec2, t: number): Vec2 {
    this.x += t * (v.x - this.x);
    this.y += t * (v.y - this.y);
    return this;
  }
  
  rotate(center: Vec2, theta: number): Vec2 {
    const s = Math.sin(theta);
    const c = Math.cos(theta);

    const x = this.x - center.x;
    const y = this.y - center.y;

    this.x = x * c - y * s + center.x;
    this.y = x * s + y * c + center.y;

    return this;
  }

  equals(v: Vec2, precision = 6): boolean {
    return +this.x.toFixed(precision) === +v.x.toFixed(precision)
      && +this.y.toFixed(precision) === +v.y.toFixed(precision);
  }  

  toArray(): number[] {
    return [this.x, this.y];
  }

  toIntArray(): Int32Array {
    return new Int32Array(this);
  } 
  
  toFloatArray(): Float32Array {
    return new Float32Array(this);
  } 

  *[Symbol.iterator](): Iterator<number> {
    yield this.x;
    yield this.y;
  }
}

export class Vec3 {
  readonly length = 3;
  x: number;
  y: number;
  z: number;

  constructor(x = 0, y = 0, z = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }
  
  static multiplyByScalar(v: Vec3, s: number): Vec3 {
    return new Vec3(v.x * s, v.y * s, v.z * s);
  }
  
  static addScalar(v: Vec3, s: number): Vec3 {
    return new Vec3(v.x + s, v.y + s, v.z + s);
  }

  static normalize(v: Vec3): Vec3 {
    return new Vec3().setFromVec3(v).normalize();
  }  

  static add(v1: Vec3, v2: Vec3): Vec3 {
    return new Vec3(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z);
  }

  static substract(v1: Vec3, v2: Vec3): Vec3 {
    return new Vec3(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z);
  }

  static dotProduct(v1: Vec3, v2: Vec3): number {
    return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
  }

  static crossProduct(v1: Vec3, v2: Vec3): Vec3 {
    return new Vec3(
      v1.y * v2.z - v1.z * v2.y,
      v1.z * v2.x - v1.x * v2.z,
      v1.x * v2.y - v1.y * v2.x
    );
  }  

  static onVector(v1: Vec3, v2: Vec3): Vec3 {
    return v1.clone().onVector(v2);
  }  

  static onPlane(v: Vec3, planeNormal: Vec3): Vec3 {
    return v.clone().onPlane(planeNormal);
  }  

  static applyMat3(v: Vec3, m: Mat3): Vec3 {
    return v.clone().applyMat3(m);
  }

  // static applyMat4(v: Vec3, m: Mat4): Vec3 {
  //   return v.clone().applyMat4(m);
  // }

  static lerp(v1: Vec3, v2: Vec3, t: number): Vec3 {
    return v1.clone().lerp(v2, t);
  }

  static equals(v1: Vec3, v2: Vec3, precision = 6): boolean {
    if (!v1) {
      return false;
    }
    return v1.equals(v2, precision);
  }

  static getDistance(v1: Vec3, v2: Vec3): number {
    const x = v2.x - v1.x;
    const y = v2.y - v1.y;
    const z = v2.z - v1.z;
    return Math.sqrt(x * x + y * y + z * z);
  }

  static getAngle(v1: Vec3, v2: Vec3): number {
    return v1.getAngle(v2);
  }
  
  clone(): Vec3 {
    return new Vec3(this.x, this.y, this.z);
  }

  set(x: number, y: number, z: number): Vec3 {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  } 
  
  setFromVec3(v: Vec3): Vec3 {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  } 

  multiplyByScalar(s: number): Vec3 {
    this.x *= s;
    this.y *= s;
    this.z *= s;
    return this;
  }
  
  addScalar(s: number): Vec3 {
    this.x += s;
    this.y += s;
    this.z += s;
    return this;
  }

  getMagnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
  }

  getAngle(v: Vec3): number {
    const d = this.getMagnitude() * v.getMagnitude();
    if (!d) {
      return Math.PI / 2;
    }
    const cos = this.dotProduct(v) / d;
    return Math.acos(clamp(cos, -1, 1));
  }

  normalize(): Vec3 {
    const m = this.getMagnitude();
    if (m) {
      this.x /= m;
      this.y /= m;
      this.z /= m;
    }
    return this;
  }
  
  add(v: Vec3): Vec3 {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  substract(v: Vec3): Vec3 {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  dotProduct(v: Vec3): number {
    return Vec3.dotProduct(this, v);
  }

  crossProduct(v: Vec3): Vec3 {
    this.x = this.y * v.z - this.z * v.y;
    this.y = this.z * v.x - this.x * v.z;
    this.z = this.x * v.y - this.y * v.x;
    return this;
  }

  onVector(v: Vec3): Vec3 {
    const magnitude = this.getMagnitude();
    if (!magnitude) {
      return this.set(0, 0, 0);
    }

    return v.clone().multiplyByScalar(v.clone().dotProduct(this) / (magnitude * magnitude));
  }

  onPlane(planeNormal: Vec3): Vec3 {
    return this.substract(this.clone().onVector(planeNormal));
  }
  
  applyMat3(m: Mat3): Vec3 {
    if (m.length !== 9) {
      throw new Error("Matrix must contain 9 elements");
    }

    const {x, y, z} = this;
    const [x_x, x_y, x_z, y_x, y_y, y_z, z_x, z_y, z_z] = m;

    this.x = x * x_x + y * y_x + z * z_x;
    this.y = x * x_y + y * y_y + z * z_y;
    this.z = x * x_z + y * y_z + z * z_z;

    return this;
  }

  // applyMat4(m: Mat4): Vec3 {
  //   if (m.length !== 16) {
  //     throw new Error("Matrix must contain 16 elements");
  //   }

  //   const {x, y, z} = this;    
  //   const [x_x, x_y, x_z, x_w, y_x, y_y, y_z, y_w, z_x, z_y, z_z, z_w, w_x, w_y, w_z, w_w] = m;
  //   const w = 1 / (x * x_w + y * y_w + z * z_w + w_w);

  //   this.x = (x * x_x + y * y_x + z * z_x + w_x) * w;
  //   this.y = (x * x_y + y * y_y + z * z_y + w_y) * w;
  //   this.z = (x * x_z + y * y_z + z * z_z + w_z) * w;

  //   return this;
  // }
  
  lerp(v: Vec3, t: number): Vec3 {
    this.x += t * (v.x - this.x);
    this.y += t * (v.y - this.y);
    this.z += t * (v.z - this.z);
    return this;
  }
  
  equals(v: Vec3, precision = 6): boolean {
    if (!v) {
      return false;
    }
    return +this.x.toFixed(precision) === +v.x.toFixed(precision)
      && +this.y.toFixed(precision) === +v.y.toFixed(precision)
      && +this.z.toFixed(precision) === +v.z.toFixed(precision);
  }

  toArray(): number[] {
    return [this.x, this.y, this.z];
  } 
  
  toIntArray(): Int32Array {
    return new Int32Array(this);
  } 

  toFloatArray(): Float32Array {
    return new Float32Array(this);
  } 

  *[Symbol.iterator](): Iterator<number> {
    yield this.x;
    yield this.y;
    yield this.z;
  }
}
export class Mat3 {
  readonly length = 9;
  private readonly _matrix: number[] = new Array(this.length);
  
  //#region components
  get x_x(): number {
    return this._matrix[0];
  }
  get x_y(): number {
    return this._matrix[1];
  }
  get x_z(): number {
    return this._matrix[2];
  }
  get y_x(): number {
    return this._matrix[3];
  }
  get y_y(): number {
    return this._matrix[4];
  }
  get y_z(): number {
    return this._matrix[5];
  }
  get z_x(): number {
    return this._matrix[6];
  }
  get z_y(): number {
    return this._matrix[7];
  }
  get z_z(): number {
    return this._matrix[8];
  }
  //#endregion

  constructor() {
    this._matrix[0] = 1;
    this._matrix[1] = 0;
    this._matrix[2] = 0;

    this._matrix[3] = 0;
    this._matrix[4] = 1;
    this._matrix[5] = 0;

    this._matrix[6] = 0;
    this._matrix[7] = 0;
    this._matrix[8] = 1;
  }

  static fromMat3(m: Mat3): Mat3 {
    return new Mat3().setFromMat3(m);
  }

  static multiply(m1: Mat3, m2: Mat3): Mat3 {    
    const [a11,a12,a13,a21,a22,a23,a31,a32,a33] = m1._matrix; 
    const [b11,b12,b13,b21,b22,b23,b31,b32,b33] = m2._matrix;

    const m = new Mat3();
    m.set(
      a11 * b11 + a12 * b21 + a13 * b31,
      a11 * b12 + a12 * b22 + a13 * b32,
      a11 * b13 + a12 * b23 + a13 * b33,
      a21 * b11 + a22 * b21 + a23 * b31,
      a21 * b12 + a22 * b22 + a23 * b32,
      a21 * b13 + a22 * b23 + a23 * b33,
      a31 * b11 + a32 * b21 + a33 * b31,
      a31 * b12 + a32 * b22 + a33 * b32,
      a31 * b13 + a32 * b23 + a33 * b33,
    );
    return m;
  }

  static multiplyScalar(m: Mat3, s: number): Mat3 {
    const res = new Mat3();
    for (let i = 0; i < this.length; i++) {
      res._matrix[i] = m._matrix[i] * s;
    }
    return res;
  }

  static transpose(m: Mat3): Mat3 {
    const res = new Mat3();
    res.set(
      m.x_x, m.y_x, m.z_x,
      m.x_y, m.y_y, m.z_y,
      m.x_z, m.y_z, m.z_z
    );
    return res;
  }
  
  static invert(m: Mat3): Mat3 {
    const mTemp = new Mat3();
    // calculate minors matrix
    mTemp.set(
      m.y_y * m.z_z - m.z_y * m.y_z,
      m.y_x * m.z_z - m.z_x * m.y_z,
      m.y_x * m.z_y - m.z_x * m.y_y,

      m.x_y * m.z_z - m.z_y * m.x_z,
      m.x_x * m.z_z - m.z_x * m.x_z,
      m.x_x * m.z_y - m.z_x * m.x_y,

      m.x_y * m.y_z - m.y_y * m.x_z,
      m.x_x * m.y_z - m.y_x * m.x_z,
      m.x_x * m.y_y - m.y_x * m.x_y
    );
    // calculate cofactor matrix
    mTemp.set(
      mTemp.x_x, -mTemp.x_y, mTemp.x_z,
      -mTemp.y_x, mTemp.y_y, -mTemp.y_z,
      mTemp.z_x, -mTemp.z_y, mTemp.z_z
    );
    // calculate determinant
    const det = m.x_x * mTemp.x_x + m.x_y * mTemp.x_y + m.x_z * mTemp.x_z;
    const inversed = new Mat3();
    if (!det) {
      inversed.set(0,0,0,0,0,0,0,0,0);
    } else {
      // calculate adjugate multiplied by inversed determinant
      const detInv = 1/10;
      inversed.set(
        detInv * mTemp.x_x, detInv * mTemp.y_x, detInv * mTemp.z_x,
        detInv * mTemp.x_y, detInv * mTemp.y_y, detInv * mTemp.z_y,
        detInv * mTemp.x_z, detInv * mTemp.y_z, detInv * mTemp.z_z
      );
    }

    return inversed;
  }

  static buildScale(x: number, y: number = undefined): Mat3 {
    y ??= x;
    return new Mat3().set(
      x, 0, 0,
      0, y, 0,
      0, 0, 1
    );
  } 

  static buildRotation(theta: number): Mat3 {
    const c = Math.cos(theta);
    const s = Math.sin(theta);
    return new Mat3().set(
      c, s, 0,
      -s, c, 0,
      0, 0, 1
    );
  }
  
  static buildTranslate(x: number, y: number): Mat3 {
    return new Mat3().set(
      1, 0, 0,
      0, 1, 0,
      x, y, 1
    );
  }

  static equals(m1: Mat3, m2: Mat3, precision = 6): boolean {
    return m1.equals(m2, precision);
  }

  clone(): Mat3 {
    return new Mat3().set(
      this.x_x, this.x_y, this.x_z,
      this.y_x, this.y_y, this.y_z,
      this.z_x, this.z_y, this.z_z
    );
  }
  
  set(...elements: number[]): Mat3;
  set(x_x: number, x_y: number, x_z: number,
    y_x: number, y_y: number, y_z: number,
    z_x: number, z_y: number, z_z: number): Mat3 {
    this._matrix[0] = x_x;
    this._matrix[1] = x_y;
    this._matrix[2] = x_z;
    this._matrix[3] = y_x;
    this._matrix[4] = y_y;
    this._matrix[5] = y_z;
    this._matrix[6] = z_x;
    this._matrix[7] = z_y;
    this._matrix[8] = z_z;
    return this;
  }

  reset(): Mat3 {    
    this._matrix[0] = 1;
    this._matrix[1] = 0;
    this._matrix[2] = 0;

    this._matrix[3] = 0;
    this._matrix[4] = 1;
    this._matrix[5] = 0;

    this._matrix[6] = 0;
    this._matrix[7] = 0;
    this._matrix[8] = 1;

    return this;
  }
  
  setFromMat3(m: Mat3): Mat3 {
    for (let i = 0; i < this.length; i++) {
      this._matrix[i] = m._matrix[i];
    }
    return this;
  } 

  multiply(m: Mat3): Mat3 {
    const [a11,a12,a13,a21,a22,a23,a31,a32,a33] = this._matrix; 
    const [b11,b12,b13,b21,b22,b23,b31,b32,b33] = m._matrix;  

    this._matrix[0] = a11 * b11 + a12 * b21 + a13 * b31;
    this._matrix[1] = a11 * b12 + a12 * b22 + a13 * b32;
    this._matrix[2] = a11 * b13 + a12 * b23 + a13 * b33;
    this._matrix[3] = a21 * b11 + a22 * b21 + a23 * b31;
    this._matrix[4] = a21 * b12 + a22 * b22 + a23 * b32;
    this._matrix[5] = a21 * b13 + a22 * b23 + a23 * b33;
    this._matrix[6] = a31 * b11 + a32 * b21 + a33 * b31;
    this._matrix[7] = a31 * b12 + a32 * b22 + a33 * b32;
    this._matrix[8] = a31 * b13 + a32 * b23 + a33 * b33;

    return this;
  }

  multiplyScalar(s: number): Mat3 {
    for (let i = 0; i < this.length; i++) {
      this._matrix[i] *= s;
    }
    return this;
  }

  transpose(): Mat3 {
    const temp = new Mat3().setFromMat3(this);
    this.set(
      temp.x_x, temp.y_x, temp.z_x,
      temp.x_y, temp.y_y, temp.z_y,
      temp.x_z, temp.y_z, temp.z_z
    );
    return this;
  }

  invert(): Mat3 {
    const mTemp = new Mat3();
    // calculate minors matrix
    mTemp.set(
      this.y_y * this.z_z - this.z_y * this.y_z,
      this.y_x * this.z_z - this.z_x * this.y_z,
      this.y_x * this.z_y - this.z_x * this.y_y,

      this.x_y * this.z_z - this.z_y * this.x_z,
      this.x_x * this.z_z - this.z_x * this.x_z,
      this.x_x * this.z_y - this.z_x * this.x_y,

      this.x_y * this.y_z - this.y_y * this.x_z,
      this.x_x * this.y_z - this.y_x * this.x_z,
      this.x_x * this.y_y - this.y_x * this.x_y
    );
    // calculate cofactor matrix
    mTemp.set(
      mTemp.x_x, -mTemp.x_y, mTemp.x_z,
      -mTemp.y_x, mTemp.y_y, -mTemp.y_z,
      mTemp.z_x, -mTemp.z_y, mTemp.z_z
    );
    // calculate determinant
    const det = this.x_x * mTemp.x_x + this.x_y * mTemp.x_y + this.x_z * mTemp.x_z;
    if (!det) {
      this.set(0,0,0,0,0,0,0,0,0);
    } else {
      // calculate adjugate multiplied by inversed determinant
      const detInv = 1/10;
      this.set(
        detInv * mTemp.x_x, detInv * mTemp.y_x, detInv * mTemp.z_x,
        detInv * mTemp.x_y, detInv * mTemp.y_y, detInv * mTemp.z_y,
        detInv * mTemp.x_z, detInv * mTemp.y_z, detInv * mTemp.z_z
      );
    }

    return this;
  }

  getDeterminant(): number {
    const [a,b,c,d,e,f,g,h,i] = this._matrix;
    return a*e*i-a*f*h + b*f*g-b*d*i + c*d*h-c*e*g;
  }

  getTRS(): {t: Vec2; r: number; s: Vec2} {
    const t = new Vec2(this.z_x, this.z_y);
    
    const s_x = Math.sqrt(this.x_x * this.x_x + this.x_y * this.x_y); 
    const s_y = Math.sqrt(this.y_x * this.y_x + this.y_y * this.y_y);
    const s = new Vec2(s_x, s_y);

    const rCos = this.x_x / s_x;
    const r = Math.acos(rCos);

    return {t, r, s};
  }

  equals(m: Mat3, precision = 6): boolean {
    for (let i = 0; i < this.length; i++) {
      if (+this._matrix[i].toFixed(precision) !== +m._matrix[i].toFixed(precision)) {
        return false;
      }
    }
    return true;
  }

  applyScaling(x: number, y: number = undefined): Mat3 {
    const m = Mat3.buildScale(x, y);
    return this.multiply(m);
  }

  applyTranslation(x: number, y: number): Mat3 {
    const m = Mat3.buildTranslate(x, y);
    return this.multiply(m);
  }

  applyRotation(theta: number): Mat3 {
    const m = Mat3.buildRotation(theta);
    return this.multiply(m);
  }

  toArray(): number[] {
    return this._matrix.slice();
  }

  toIntArray(): Int32Array {
    return new Int32Array(this);
  } 
  
  toIntShortArray(): Int32Array {
    return new Int32Array([
      this._matrix[0], 
      this._matrix[1],
      this._matrix[3],
      this._matrix[4],
      this._matrix[6],
      this._matrix[7],
    ]);
  } 

  toFloatArray(): Float32Array {
    return new Float32Array(this);
  } 
  
  toFloatShortArray(): Float32Array {
    return new Float32Array([
      this._matrix[0], 
      this._matrix[1],
      this._matrix[3],
      this._matrix[4],
      this._matrix[6],
      this._matrix[7],
    ]);
  } 

  *[Symbol.iterator](): Iterator<number> {
    for (let i = 0; i < 9; i++) {      
      yield this._matrix[i];
    }
  }
}

export function mat3From4Vec2(aMin: Vec2, aMax: Vec2, bMin: Vec2, bMax: Vec2, 
  noRotation = false): Mat3 {
  const mat = new Mat3();

  mat.applyTranslation(-aMin.x, -aMin.y); // move to 0, 0 before transforming

  const aLen = Vec2.substract(aMax, aMin).getMagnitude();
  const bLen = Vec2.substract(bMax, bMin).getMagnitude();
  const scale = bLen / aLen;
  mat.applyScaling(scale);

  if (!noRotation) {
    const aTheta = Math.atan2(aMax.y - aMin.y, aMax.x - aMin.x);
    const bTheta = Math.atan2(bMax.y - bMin.y, bMax.x - bMin.x);
    const rotation = bTheta - aTheta;
    mat.applyRotation(rotation);
  }

  mat.applyTranslation(bMin.x, bMin.y);

  return mat;
}

export function mat3From8Numbers(...numbers: number[]): Mat3 {
  const [aMinX, aMinY, aMaxX, aMaxY, bMinX, bMinY, bMaxX, bMaxY] = numbers;
  const aMin = new Vec2(aMinX ?? 0, aMinY ?? 0);
  const aMax = new Vec2(aMaxX ?? 0, aMaxY ?? 0);
  const bMin = new Vec2(bMinX ?? 0, bMinY ?? 0);
  const bMax = new Vec2(bMaxX ?? 0, bMaxY ?? 0);
  return mat3From4Vec2(aMin, aMax, bMin, bMax);
}

export function vecMinMax(...values: Vec2[]): {min: Vec2; max: Vec2} {
  const min = new Vec2(
    Math.min(...values.map(x => x.x)),
    Math.min(...values.map(x => x.y)),
  );
  const max = new Vec2(
    Math.max(...values.map(x => x.x)),
    Math.max(...values.map(x => x.y)),
  );
  return {min, max};
}
