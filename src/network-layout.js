import * as d3 from 'd3';
import { startCase, lowerCase, minBy } from 'lodash';
import makeDragHandler from './drag-handler';
import { highlightNode, restoreNode } from './highlight-node';
import Point from './point';

const parentElement = document.getElementById("content");
const width = parentElement.clientWidth;
const height = parentElement.clientHeight;

const ellipsis = (text, len = 25) => (text.length > len ? `${text.substr(0, len - 3)}...` : text);
const nodeName = node => startCase(lowerCase(ellipsis(node.name || node.largest.map(childNode => childNode.name).join(', '))));

const screenScale = ({ x, y, k }) => point => new Point(point.x * k + x, point.y * k + y)

const insideScreenBounds = point =>
    0 < point.x && point.x < width && 0 < point.y && point.y < height

const radiusLargeEnough = radius => radius > Math.min(width, height) / 4;

function isRenderTarget({ x, y, k }, nodeRadius) {
    const scaled = screenScale({ x, y, k });
    return node => radiusLargeEnough(nodeRadius(node) * k) && insideScreenBounds(scaled(node));
}

// [k 0 x
//  0 k y
//  0 0 1]
const transformToMatrix = ({ x, y, k }) => [k, 0, 0, k, x, y];

function makeLinkLod(links) {
    const n_always_show = 5;
    const len = links.length || 1;
    const visible = d3.scaleLinear().domain([0.65, 1.7]).range([1 / len, 1]).clamp(true);
    if (len < n_always_show) {
        return k => l => true;
    }
    return (k = 1) => l => 1 - l.index / len - n_always_show / len <= visible(k);
}

function makeNodeLod(nodes) {
    const visible = d3.scaleLinear().domain([0.65, 1]).range([1, nodes.length]).clamp(true);
    return (k = 1) => n => n.id <= visible(k);
}

export default function NetworkLayout({
        linkRenderer,
        style,
        renderTarget,
        localTransform,
        simulation
    }) {

    let layout;

    const dispatch = d3.dispatch('click', 'render', 'destroy');

    const elements = {
        parent: renderTarget.parent,
        labels: renderTarget.labels,
    };

    let stopped = false;
    let thisNetwork = null;
    let nodes = [];
    let links = [];

    let updateDisabled = false;

    const onDrag = makeDragHandler(simulation);

    function init(network) {
        thisNetwork = network;
        nodes = network.nodes.filter(node => node.shouldRender);
        links = network.links.filter(link => link.shouldRender).reverse();
        network.visible = true;

        createElements();

        simulation.init({ nodes, links });
        simulation.on('tick', () => {
            updateDisabled = true;
            updateAttributes(true);
        });
        simulation.on('end', () => updateDisabled = false);
    }

    function createElements() {
        const { parent, labels } = elements;

        parent.selectAll('*').remove();
        labels.selectAll('*').remove();

        elements.link = parent.append('g')
            .attr('class', 'links')
            .selectAll('.link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .style('fill', style.linkFillColor)
            .style('stroke', style.linkBorderColor)
            .style('stroke-width', '0.10');

        elements.link.accessors = {
            path: l => makeLinkLod(links)()(l) ? linkRenderer(l) : '',
            lod: makeLinkLod(links),
        };

        elements.node = parent.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('id', n => n.path.toId())
            .on('click', function (n) { dispatch.call('click', this, n) })
            .on('mouseover', highlightNode)
            .on('mouseout', restoreNode(style))
            .call(onDrag);

        elements.circle = elements.node.append('circle')
            .attr('r', style.nodeRadius)
            .style('fill', style.nodeFillColor)
            .style('stroke', style.nodeBorderColor)
            .style('stroke-width', style.nodeBorderWidth);

        elements.circle.accessors = {
            r: style.nodeRadius,
            fill: style.nodeFillColor,
        };

        elements.searchMark = elements.node.append('circle')
            .attr('r', style.searchMarkRadius)
            .style('fill', '#F48074');

        elements.label = labels.selectAll('.label')
            .data(nodes)
            .enter()
            .append('text')
            .attr('class', 'label')
            .text(nodeName)
            .attr('text-anchor', 'start')
            .style('fill', 'black')
            .style('font-size', 12)
            .style('paint-order', 'stroke')
            .style('stroke', 'white')
            .style('stroke-width', '1.5px')
            .style('stroke-linecap', 'square')
            .style('stroke-linejoin', 'round');

        elements.label.accessors = {
            x: n => n.x,
            y: n => n.y,
            dx: n => 1.1 * style.nodeRadius(n),
            lod: makeNodeLod(nodes),
            visibility: n => 'visible',
            text: nodeName,
        };
    }

    function updateAttributes(simulationRunning = false) {
        if (updateDisabled && !simulationRunning) return;

        const { circle, searchMark, label, link } = elements;

        linkRenderer.nodeRadius(circle.accessors.r);

        circle
            .style('fill', circle.accessors.fill)
            .attr('r', circle.accessors.r)
            .attr('cx', n => n.x)
            .attr('cy', n => n.y);
        searchMark
            .attr('r', style.searchMarkRadius)
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

        return layout;
    }

    function applyTransform({ x, y, k }) {
        const { circle, label, link } = elements;
        const { translate = Point.origin, scale = 1, parentTranslate = Point.origin, parentScale = 1 } = localTransform || {};

        x += k * (parentScale * translate.x + parentTranslate.x);
        y += k * (parentScale * translate.y + parentTranslate.y);
        k *= scale;

        label.accessors.x = n => x + k * n.x;
        label.accessors.y = n => y + k * n.y;
        label.accessors.dx = (n) => {
            const r = 1.1 * style.nodeRadius(n);
            const dx = k * r + (k > 1 ? 1.4 * (1 - k) * r : 0);
            return Math.max(dx, 0);
        };
        label.accessors.visibility = n => label.accessors.lod(k)(n) ? 'visible' : 'hidden'
        label.accessors.text = n => n.visible ? '' : nodeName(n);
        link.accessors.path = l => l.flow > 5e-6 && (k < 15 || !l.source.nodes) && link.accessors.lod(k)(l)
            ? linkRenderer(l) : '';

        if (k > 1.5) {
            const zoomNormalized = d3.scaleLinear().domain([1.5, 6.5]).range([0, 1]).clamp(true);

            const closest = (() => {
                if (k < 9) return null;
                const center = Point.from({ x: width / 2, y: height / 2 });
                const scaled = screenScale({ x, y, k });
                const distanceToCenter = n => Point.distance(scaled(n), center);
                return minBy(nodes, distanceToCenter);
            })();

            circle.accessors.fill = (n) => {
                if (!n.nodes) return style.nodeFillColor(n);
                const fill = d3.interpolateRgb(style.nodeFillColor(n), '#ffffff');
                return fill(zoomNormalized(k));
            };

            circle.accessors.r = (n) => {
                const targetRadius = 60;
                const initialRadius = style.nodeRadius(n);
                if (!n.nodes) return initialRadius;
                if (k >= 9 && n === closest) {
                    const r = d3.interpolateNumber(Math.max(targetRadius,  initialRadius), 200);
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
            elements.node.on('.drag', null);
            simulation.stop();
            updateDisabled = false;
            stopped = true;

            const targets = nodes.filter(n => n.nodes && !n.visible && renderTarget(n));

            targets.forEach((n) => {
                    const childScale = 0.15;
                    const childTranslate = Point.from(n).mul(1 - childScale);
                    const transformMatrix = transformToMatrix({
                        x: childTranslate.x,
                        y: childTranslate.y,
                        k: childScale,
                    });
                    const parentElement = elements.parent.append('g')
                        .attr('transform', `matrix(${transformMatrix})`);
                    const labelsElement = d3.select('#labelsContainer').append('g')
                        .attr('class', 'network labels');

                    const childTransform = {
                        parentTranslate: Point.add(translate, parentTranslate),
                        translate: childTranslate,
                        parentScale: scale * parentScale,
                        scale: childScale * scale,
                    };

                    dispatch.call('render', null, {
                        network: n,
                        localTransform: childTransform,
                        renderTarget: {
                            parent: parentElement,
                            labels: labelsElement
                        },
                    });
                });
        } else if (stopped) {
            elements.node.call(onDrag);
            simulation.restart();
            stopped = false;
        }

        if (k < 4) {
            nodes.filter(n => n.visible && !renderTarget(n))
                .forEach(n => dispatch.call('destroy', null, n.path));
        }

        return layout;
    }

    function destroy() {
        simulation.stop();
        if (thisNetwork) {
            thisNetwork.visible = false;
            thisNetwork = null;
        }
        nodes = [];
        links = [];
        elements.parent.remove();
        elements.labels.remove();
    }

    return layout = {
        init,
        updateAttributes,
        applyTransform,
        destroy,
        on: (name, callback) => callback ? (dispatch.on(name, callback), layout) : (dispatch.on(name), layout),
    };
}
