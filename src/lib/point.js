export default class Point {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  static from(other) {
    return new Point(other.x, other.y);
  }

  static polar(r, theta) {
    return new Point(r * Math.cos(theta), r * Math.sin(theta));
  }

  static get origin() {
    return new Point(0, 0);
  }

  static distanceFrom(point) {
    return other => Point.distance(point, other);
  }

  static distance(p1, p2) {
    return Point.sub(p1, p2).length;
  }

  static add(p1, p2) {
    return new Point(p1.x + p2.x, p1.y + p2.y);
  }

  static sub(p1, p2) {
    return new Point(p1.x - p2.x, p1.y - p2.y);
  }

  static dot(p1, p2) {
    return p1.x * p2.x + p1.y * p2.y;
  }

  toArray() {
    return [this.x, this.y];
  }

  add(point) {
    return Point.add(this, point);
  }

  sub(point) {
    return Point.sub(this, point);
  }

  mul(scalar) {
    return new Point(this.x * scalar, this.y * scalar);
  }

  div(scalar) {
    return this.mul(1 / scalar);
  }

  dot(point) {
    return Point.dot(this, point);
  }

  get length() {
    return Math.sqrt(this.dot(this));
  }

  get size() {
    return this.length;
  }

  get normalize() {
    return this.div(this.length);
  }
}
