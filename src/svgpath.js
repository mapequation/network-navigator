/*
 * Based on work by Daniel Edler
 */
export default class SvgPath {
    constructor() {
        this.path = [];
        this._relative = false;
    }

    toString() {
        return this.path.join(' ');
    }

    relative() {
        this._relative = true;
        return this;
    }

    absolute() {
        this._relative = false;
        return this;
    }

    m(x, y) {
        this.path.push(`m ${x} ${y}`);
        return this;
    }

    M(x, y) {
        this.path.push(`M ${x} ${y}`);
        return this;
    }

    moveTo(x, y) {
        this.path.push(this._relative ? this.m(x, y) : this.M(x, y));
        return this;
    }

    l(x, y) {
        this.path.push(`l ${x} ${y}`);
        return this;
    }

    L(x, y) {
        this.path.push(`L ${x} ${y}`);
        return this;
    }

    lineTo(x, y) {
        this.path.push(this._relative ? this.l(x, y) : this.L(x, y));
        return this;
    }

    q(x1, y1, x2, y2) {
        this.path.push(`q ${x1} ${y1}, ${x2} ${y2}`);
        return this;
    }

    Q(x1, y1, x2, y2) {
        this.path.push(`Q ${x1} ${y1}, ${x2} ${y2}`);
        return this;
    }

    curveTo(x1, y1, x2, y2) {
        this.path.push(this._relative ? this.q(x1, y1, x2, y2) : this.Q(x1, y1, x2, y2));
        return this;
    }

    Z() {
        this.path.push('Z');
        return this;
    }

    end() {
        return this.Z();
    }
}
