import SvgPath from 'svgpath';

function functor(v) {
    return typeof v === 'function' ? v : () => v;
}

/*
 * Based on work by Daniel Edler
 */
export default class LinkRenderer {
    constructor() {
        const NODE_DEFAULT_RADIUS = 10;
        const LINK_DEFAULT_WIDTH = 10;
        const LINK_DEFAULT_BEND = 30;

        this._source = link => link.source;
        this._target = link => link.target;
        this._node = {};
        this._node.x = node => node.x;
        this._node.y = node => node.y;
        this._node.r = node => node.size || NODE_DEFAULT_RADIUS;
        this._width = link => link.width || LINK_DEFAULT_WIDTH;
        this._bend = link => link.bend || LINK_DEFAULT_BEND;
        this._oppositeLink = () => null;
    }

    get source() {
        return this._source;
    }

    set source(s) {
        this._source = functor(s);
    }

    get target() {
        return this._target;
    }

    set target(t) {
        this._target = functor(t);
    }

    get nodeRadius() {
        return this._node.r;
    }

    set nodeRadius(r) {
        this._node.r = functor(r);
    }

    get nodeX() {
        return this._node.x;
    }

    set nodeX(x) {
        this._node.x = functor(x);
    }

    get nodeY() {
        return this._node.y;
    }

    set nodeY(y) {
        this._node.y = functor(y);
    }

    get width() {
        return this._width;
    }

    set width(w) {
        this._width = functor(w);
    }

    get bend() {
        return this._bend;
    }

    set bend(b) {
        this._bend = functor(b);
    }

    get oppositeLink() {
        return this._oppositeLink;
    }

    set oppositeLink(l) {
        this._oppositeLink = functor(l);
    }

    get svgPath() {
        /* Closure to keep reference to 'this' */
        return (link) => {
            const source = this.source(link);
            const target = this.target(link);
            const x0 = this.nodeX(source);
            const y0 = this.nodeY(source);
            const r0 = this.nodeRadius(source);
            const x1 = this.nodeX(target);
            const y1 = this.nodeY(target);
            const r1 = this.nodeRadius(target);
            const width = this.width(link);
            const bend = this.bend(link);
            const oppositeLink = this.oppositeLink(link);
            const oppositeWidth = oppositeLink ? this.width(oppositeLink) : width;
            const dx = x1 - x0;
            const dy = y1 - y0;
            const l = Math.sqrt((dx * dx) + (dy * dy));
            const lBetween = l - r0 - r1;

            // Skip draw link of nodes overlap if not big bend
            if (lBetween <= 0 && Math.abs(bend) < 50) {
                return '';
            }

            // Get unit vector in direction and perpendicular
            const dir = { x: dx / l, y: dy / l };
            const right = { x: -dir.y, y: dir.x };

            // Size of arrowhead
            const tipLength = Math.min(lBetween / 3, 10 * (width ** (1 / 3)));
            const tipWidth = 2 * Math.sqrt(width); // excluding the line width

            // Size of opposite arrowhead
            const oppositeTipLength = Math.min(lBetween / 3, 10 * (oppositeWidth ** (1 / 3)));

            // Bending
            const bending = (() => {
                const bendMagnitude = Math.abs(bend);
                const positiveCurvature = dir.x > 0 || (dir.x === 0 && dir.y < 0);
                const curvatureSign = positiveCurvature ? 1 : -1;
                const bendSign = bend > 0 ? 1 : -1;
                const finalBendSign = curvatureSign * bendSign;
                return {
                    signed: finalBendSign * bendMagnitude,
                    outerAddition: (bendMagnitude / 10) ** 0.4,
                };
            })();

            const midPoint = (() => {
                // Calculate the end points for the middle bezier curve.
                // Rotate them towards the control point later.
                const x02tmp = x0 + ((r0 + oppositeTipLength) * dir.x);
                const y02tmp = y0 + ((r0 + oppositeTipLength) * dir.y);
                const x12tmp = x1 - ((r1 + tipLength) * dir.x);
                const y12tmp = y1 - ((r1 + tipLength) * dir.y);

                return {
                    x: 0.5 * (x02tmp + x12tmp),
                    y: 0.5 * (y02tmp + y12tmp),
                };
            })();

            const CP1 = {
                x: midPoint.x + (bending.signed * right.x),
                y: midPoint.y + (bending.signed * right.y),
            };
            const CP2 = {
                x: midPoint.x + ((bending.signed + width + bending.outerAddition) * right.x),
                y: midPoint.y + ((bending.signed + width + bending.outerAddition) * right.y),
            };

            // points from source to control point
            const dx1 = CP1.x - x0;
            const dy1 = CP1.y - y0;
            const l1 = Math.sqrt((dx1 * dx1) + (dy1 * dy1));
            const dir0 = { x: dx1 / l1, y: dy1 / l1 };
            const right0 = { x: -dir0.y, y: dir0.x };
            const x01 = x0 + (r0 * dir0.x);
            const y01 = y0 + (r0 * dir0.y);
            const x02 = x01 + (oppositeTipLength * dir0.x);
            const y02 = y01 + (oppositeTipLength * dir0.y);
            const x03 = x02 + (width * right0.x);
            const y03 = y02 + (width * right0.y);
            const x04 = x0 + (width * right0.x);
            const y04 = y0 + (width * right0.y);

            // points from target to control point
            const dx2 = CP1.x - x1;
            const dy2 = CP1.y - y1;
            const l2 = Math.sqrt((dx2 * dx2) + (dy2 * dy2));
            const dir1 = { x: dx2 / l2, y: dy2 / l2 };
            const x11 = x1 + (r1 * dir1.x);
            const y11 = y1 + (r1 * dir1.y);
            const x12 = x11 + (tipLength * dir1.x);
            const y12 = y11 + (tipLength * dir1.y);
            const left1 = { x: dir1.y, y: -dir1.x };
            const x13 = x12 + (width * left1.x);
            const y13 = y12 + (width * left1.y);
            const x14 = x13 + (tipWidth * left1.x);
            const y14 = y13 + (tipWidth * left1.y);

            return new SvgPath()
                .moveTo(x02, y02)
                .lineTo(x0, y0)
                .lineTo(x04, y04)
                .lineTo(x03, y03)
                .curveTo(CP2.x, CP2.y, x13, y13)
                .lineTo(x14, y14)
                .lineTo(x11, y11)
                .lineTo(x12, y12)
                .curveTo(CP1.x, CP1.y, x02, y02)
                .end()
                .toString();
        };
    }
}
