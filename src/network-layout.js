import * as d3 from 'd3';
import { startCase, lowerCase } from 'lodash';
import { clickHandler, doubleClickHandler } from './click-handler';
import makeDragHandler from './drag-handler';
import { highlightNode, restoreNode } from './highlight-node';
import Point from './point';

const { innerWidth, innerHeight } = window;

const ellipsis = (text, len = 25) => (text.length > len ? `${text.substr(0, len - 3)}...` : text);
const nodeName = node => startCase(lowerCase(ellipsis(node.name || node.largest.map(childNode => childNode.name).join(', '))));

const screenScale = ({ x, y, k }) => point => new Point(point.x * k + x, point.y * k + y)

const insideScreenBounds = point =>
    0 < point.x && point.x < innerWidth && 0 < point.y && point.y < innerHeight

const radiusLargeEnough = radius => radius > Math.min(innerWidth, innerHeight) / 4;

function isRenderTarget({ x, y, k }, nodeRadius) {
    const scaled = screenScale({ x, y, k });
    return node => radiusLargeEnough(nodeRadius(node) * k) && insideScreenBounds(scaled(node));
}

function makeLinkLod(links) {
    const n_always_show = 5;
    const len = links.length || 1;
    if (len < n_always_show) return k => l => true;
    const visible = d3.scaleLinear().domain([0.3, 2]).range([1 / len, 1]).clamp(true);
    return (k = 1) => l => 1 - l.index / len - n_always_show / len <= visible(k);
}

function makeNodeLod(nodes) {
    const visible = d3.scaleLinear().domain([0.5, 0.8]).range([1, nodes.length]).clamp(true);
    return (k = 1) => n => n.id <= visible(k);
}

export default function NetworkLayout({
        linkRenderer,
        style,
        renderTarget,
        localTransform,
        simulation
    }) {

    const dispatch = d3.dispatch('click', 'dblclick', 'render', 'destroy');

    const elements = {
        parent: renderTarget.parent,
        labels: renderTarget.labels,
    };

    let stopped = false;
    let thisNetwork = null;
    let nodes = [];
    let links = [];

    const onDrag = makeDragHandler(simulation);

    function init(network) {
        thisNetwork = network;
        nodes = network.nodes.filter(node => node.shouldRender);
        links = network.links.filter(link => link.shouldRender).reverse();
        network.visible = true;

        createElements();

        simulation.init({ nodes, links });
        simulation.on('tick', update);
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
            .style('fill', style.linkFillColor);

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
            .on('click', clickHandler(function (n) { dispatch.call('click', this, n) }))
            .on('dblclick', doubleClickHandler(function (n) { dispatch.call('dblclick', this, n) }))
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

    function update() {
        const { circle, searchMark, label, link } = elements;

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
            const dx = k * r + (k > 1 ? 1.8 * (1 - k) * r : 0);
            return Math.max(dx, 0);
        };
        label.accessors.visibility = n =>
            label.accessors.lod(k)(n) ? 'visible' : 'hidden'
        label.accessors.text = n => n.visible ? '' : nodeName(n);
        link.accessors.path = l =>
            (k < 12 || !l.source.nodes) && link.accessors.lod(k)(l)
            ? linkRenderer(l) : '';

        if (k > 1.5) {
            const zoomNormalized = d3.scaleLinear().domain([1.5, 6.5]).range([0, 1]).clamp(true);
            const center = new Point(window.innerWidth / 2, window.innerHeight / 2);
            const scaled = screenScale({ x, y, k });
            const distanceFromCenter = n => Point.distance(scaled(n), center);
            const distanceNormalized = d3.scalePow().exponent(2).domain([800, 0]).range([0, 1]).clamp(true);

            circle.accessors.fill = (n) => {
                if (!n.nodes) return style.nodeFillColor(n);
                const d = n => (k < 5 ? distanceNormalized(distanceFromCenter(n)) : 1);
                const fill = d3.interpolateRgb(style.nodeFillColor(n), '#ffffff');
                return fill(zoomNormalized(k) * d(n));
            };
            circle.accessors.r = (n) => {
                if (!n.nodes) return style.nodeRadius(n);
                const d = n => distanceNormalized(distanceFromCenter(n));
                const r = d3.interpolateNumber(style.nodeRadius(n), 70);
                return r(zoomNormalized(k) * d(n));
            };
        }

        if (k > 2) {
            elements.node.on('.drag', null);
            simulation.stop();
            stopped = true;

            const renderTarget = isRenderTarget({ x, y, k }, circle.accessors.r);

            nodes.filter(n => n.nodes && !n.visible)
                .filter(renderTarget)
                .forEach((n) => {
                    const childScale = 0.15;
                    const childTranslate = Point.from(n).mul(1 - childScale);
                    const parentElement = elements.parent.append('g')
                        .attr('transform', `translate(${childTranslate.toArray()}), scale(${childScale})`);
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

            nodes.filter(n => n.visible)
                .forEach(n => dispatch.call('destroy', null, n.path));
        }
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

    return {
        init,
        update,
        applyTransform,
        destroy,
        on: (name, callback) => callback ? dispatch.on(name, callback) : dispatch.on(name),
    };
}
