import * as d3 from 'd3';
import { minBy, truncate } from 'lodash';
import makeDragHandler from './drag-handler';
import { highlightLinks, restoreLinks } from './highlight-links';
import * as LOD from './level-of-detail';
import Point from './point';
import Simulation from './simulation';

const width = window.innerWidth;
const height = window.innerHeight;
const center = new Point(width / 2, height / 2);

const nodeName = node => truncate(node.name);

const screenScale = ({ x, y, k }) => point => new Point(point.x * k + x, point.y * k + y);

const distanceFromCenter = Point.distanceFrom(center);

const insideScreenBounds = point =>
    0 < point.x && point.x < width && 0 < point.y && point.y < height;

/*
const closestPointOnBoundary = (point, radius) => {
    const u = center.sub(point).normalize.mul(radius);
    return u.add(point);
};

const visibleOnScreen = (point, radius) => {
    return insideScreenBounds(point) || insideScreenBounds(closestPointOnBoundary(point, radius));
};
*/

const radiusLargeEnough = radius => radius > Math.min(width, height) / 4;

const isRenderTarget = ({ x, y, k }, nodeRadius) => node => {
    const scaled = screenScale({ x, y, k });
    const radius = nodeRadius(node) * k;
    return radiusLargeEnough(radius) && insideScreenBounds(scaled(node));
};

// [k 0 x
//  0 k y
//  0 0 1]
const transformToMatrix = ({ x, y, k }) => [k, 0, 0, k, x, y];

export default class NetworkLayout {
    constructor({ linkRenderer, renderStyle, renderTarget, position, localTransform = {} }) {
        this.linkRenderer = linkRenderer;
        this.style = renderStyle;
        this.elements = renderTarget;
        this.localTransform = localTransform;
        this.simulation = Simulation(position);

        this.updateDisabled = false;
        this.stopped = false;

        this.network = null;
        this.nodes = [];
        this.links = [];

        this.onDrag = makeDragHandler(this.simulation);

        this.dispatch = d3.dispatch('click', 'render', 'destroy');
        this.on = this.dispatch.on.bind(this.dispatch);
    }

    get renderStyle() {
        return this.style;
    }

    set renderStyle(style) {
        this.style = style;
    }

    init(network) {
        this.network = network;
        this.nodes = network.nodes.filter(node => node.shouldRender);
        this.links = network.links.filter(link => link.shouldRender).reverse();
        network.visible = true;

        this.createElements();

        this.simulation.init(this);

        this.simulation.on('tick', () => {
            this.updateDisabled = true;
            this.updateAttributes(true);
        });

        this.simulation.on('end', () => this.updateDisabled = false);
    }

    createElements() {
        const { parent, labels } = this.elements;

        parent.selectAll('*').remove();
        labels.selectAll('*').remove();

        this.elements.link = parent.append('g')
            .attr('class', 'links')
            .selectAll('.link')
            .data(this.links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .style('fill', this.style.linkFillColor);

        this.elements.link.accessors = {
            path: l => LOD.linkByIndex(this.links)()(l) ? this.linkRenderer(l) : '',
            lod: LOD.linkByIndex(this.links),
        };

        const onNodeClicked = (dispatch => function (n) {
            dispatch.call('click', this, n);
            d3.select(this).select('circle')
                .style('stroke', '#f48074');
        })(this.dispatch);

        this.elements.node = parent.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(this.nodes)
            .enter()
            .append('g')
            .attr('id', n => n.path.toId())
            .on('click', onNodeClicked)
            .on('mouseover', highlightLinks)
            .on('mouseout', restoreLinks(this.style))
            .call(this.onDrag);

        this.elements.circle = this.elements.node.append('circle')
            .attr('r', this.style.nodeRadius)
            .style('fill', this.style.nodeFillColor)
            .style('stroke', this.style.nodeBorderColor)
            .style('stroke-width', this.style.nodeBorderWidth);

        this.elements.circle.accessors = {
            r: n => this.style.nodeRadius(n),
            fill: n => this.style.nodeFillColor(n),
        };

        const radius = (n) => {
            if (n.visible) return 0;
            const r = this.elements.circle.accessors.r(n);
            if (n.occurred) {
                if (n.occurred.size > 0) {
                    return r
                }
            } else {
                const max = Array.from(n.occurrences.values())
                    .reduce((max, curr) => Math.max(max, curr), 0);
                return r * max / (n.totalChildren || 1);
            }
            return 0;
        };

        const fill = (n) => {
            if (n.occurred) {
                for (let color of n.occurred.keys()) {
                    return color;
                }
            } else {
                let maxColor = '';
                let maxOccurrences = 0;
                for (let [color, occurrences] of n.occurrences.entries()) {
                    if (occurrences > maxOccurrences) {
                        maxColor = color;
                        maxOccurrences = occurrences;
                    }
                }
                return maxColor;
            }
            return '';
        }

        this.elements.occurrences = this.elements.node.append('circle')
            .attr('r', radius)
            .attr('fill', fill);

        this.elements.occurrences.accessors = {
            r: n => radius(n),
            fill: n => fill(n),
        };

        this.elements.searchMark = this.elements.node.append('circle')
            .attr('r', this.style.searchMarkRadius)
            .style('fill', '#F48074');

        this.elements.label = labels.selectAll('.label')
            .data(this.nodes)
            .enter()
            .append('text')
            .attr('class', 'label')
            .text(nodeName)
            .attr('text-anchor', 'start')
            .style('fill', 'black')
            .style('font-size', 13)
            .style('paint-order', 'stroke')
            .style('stroke', 'white')
            .style('stroke-width', '2px')
            .style('stroke-linecap', 'square')
            .style('stroke-linejoin', 'round');

        this.elements.label.accessors = {
            x: n => n.x,
            y: n => n.y,
            dx: n => 1.1 * this.style.nodeRadius(n),
            lod: LOD.nodeByIndex(this.nodes),
            visibility: n => 'visible',
            text: nodeName,
        };
    }

    clearSelectedNodes() {
        this.elements.circle
            .style('stroke', this.style.nodeBorderColor);
    }

    updateAttributes(simulationRunning = false) {
        if (this.updateDisabled && !simulationRunning) return;

        const { circle, searchMark, label, link, occurrences } = this.elements;

        this.linkRenderer.nodeRadius(circle.accessors.r);

        occurrences
            .attr('r', occurrences.accessors.r)
            .attr('fill', occurrences.accessors.fill)
            .attr('cx', n => n.x)
            .attr('cy', n => n.y);
        circle
            .style('fill', circle.accessors.fill)
            .attr('r', circle.accessors.r)
            .attr('cx', n => n.x)
            .attr('cy', n => n.y);
        searchMark
            .attr('r', this.style.searchMarkRadius)
            .attr('cx', n => n.x)
            .attr('cy', n => n.y);
        label
            .text(label.accessors.text)
            .attr('x', label.accessors.x)
            .attr('y', label.accessors.y)
            .attr('dx', label.accessors.dx)
            .attr('visibility', label.accessors.visibility);
        link
            .attr('d', link.accessors.path);

        return this;
    }

    applyTransform(transform) {
        const { circle, label, link } = this.elements;
        const {
            translate = Point.origin,
            scale = 1,
            parentTranslate = Point.origin,
            parentScale = 1,
        } = this.localTransform;

        let { x, y, k } = transform;
        x += k * (parentScale * translate.x + parentTranslate.x);
        y += k * (parentScale * translate.y + parentTranslate.y);
        k *= scale;

        label.accessors.x = n => x + k * n.x;
        label.accessors.y = n => y + k * n.y;
        label.accessors.dx = (n) => {
            const r = 1.1 * this.style.nodeRadius(n);
            const dx = k * r + (k > 1 ? 1.4 * (1 - k) * r : 0);
            return Math.max(dx, 0);
        };
        label.accessors.visibility = n => label.accessors.lod(k)(n) ? 'visible' : 'hidden';
        label.accessors.text = n => n.visible ? '' : nodeName(n);
        link.accessors.path = l => (k < 15 || !l.source.nodes) && link.accessors.lod(k)(l)
            ? this.linkRenderer(l) : '';

        if (k > 1.5) {
            const zoomNormalized = d3.scaleLinear().domain([1.5, 6.5]).range([0, 1]).clamp(true);

            const closest = (() => {
                if (k < 9) return null;
                const scaled = screenScale({ x, y, k });
                return minBy(this.nodes, n => distanceFromCenter(scaled(n)));
            })();

            circle.accessors.fill = (n) => {
                if (!n.nodes) return this.style.nodeFillColor(n);
                const fill = d3.interpolateRgb(this.style.nodeFillColor(n), '#ffffff');
                return fill(zoomNormalized(k));
            };

            circle.accessors.r = (n) => {
                const targetRadius = 60;
                const initialRadius = this.style.nodeRadius(n);
                if (!n.nodes) return initialRadius;
                if (k >= 9 && n === closest) {
                    const r = d3.interpolateNumber(Math.max(targetRadius, initialRadius), 200);
                    const fillScreen = d3.scalePow().exponent(2).domain([9, 15]).range([0, 1]).clamp(true);
                    return r(fillScreen(k));
                } else {
                    if (initialRadius > targetRadius) return initialRadius;
                    const r = d3.interpolateNumber(initialRadius, targetRadius);
                    return r(zoomNormalized(k));
                }
            };
        }

        const renderTarget = isRenderTarget({ x, y, k }, circle.accessors.r);

        if (k > 2) {
            this.elements.node.on('.drag', null);
            this.simulation.stop();
            this.updateDisabled = false;
            this.stopped = true;

            const targets = this.nodes.filter(n => n.nodes && !n.visible && renderTarget(n));

            targets.forEach((n) => {
                const childScale = 0.15;
                const childTranslate = Point.from(n).mul(1 - childScale);
                const transformMatrix = transformToMatrix({
                    ...childTranslate,
                    k: childScale,
                });

                const renderTarget = {
                    parent: this.elements.parent.append('g')
                        .attr('transform', `matrix(${transformMatrix})`),
                    labels: d3.select('#labelsContainer').append('g')
                        .attr('class', 'network labels'),
                }

                const childTransform = {
                    parentTranslate: Point.add(translate, parentTranslate),
                    translate: childTranslate,
                    parentScale: scale * parentScale,
                    scale: childScale * scale,
                };

                this.dispatch.call('render', null, {
                    path: n.path,
                    layout: new NetworkLayout({
                        linkRenderer: this.linkRenderer,
                        renderStyle: this.renderStyle,
                        renderTarget,
                        position: Point.from(n),
                        localTransform: childTransform,
                    }),
                });
            });
        } else if (this.stopped) {
            this.elements.node.call(this.onDrag);
            this.simulation.restart();
            this.stopped = false;
        }

        if (k < 4) {
            this.nodes.filter(n => n.visible && !renderTarget(n))
                .forEach(n => this.dispatch.call('destroy', null, n.path));
        }

        return this;
    }

    destroy() {
        this.simulation.stop();
        if (this.network) {
            this.network.visible = false;
            this.network = null;
        }
        this.nodes = [];
        this.links = [];
        this.elements.parent.remove();
        this.elements.labels.remove();
    }
}
