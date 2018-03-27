import * as d3 from 'd3';
import { clickHandler, doubleClickHandler } from 'click-handler';
import makeDragHandler from 'drag-handler';
import { makeLinkLod, makeNodeLod } from 'render-style';
import { highlightNode, restoreNode } from 'highlight-node';
import { traverseDepthFirst } from 'network';

const ellipsis = (text, len = 25) => (text.length > len ? `${text.substr(0, len - 3)}...` : text);
const capitalizeWord = word => word && word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
const capitalize = str => str.split(' ').map(capitalizeWord).join(' ');
const nodeName = node => capitalize(ellipsis(node.name || node.largest.map(childNode => childNode.name).join(', ')))
const numberOfHits = n =>
    +n.marked || Array.from(traverseDepthFirst(n)).filter(child => child.marked).length;

const { innerWidth, innerHeight } = window;

const screenScale = ({ x, y, k }) => point => ({ x: point.x * k + x, y: point.y * k + y });

const insideScreenBounds = point =>
    0 < point.x && point.x < innerWidth && 0 < point.y && point.y < innerHeight

const withinRadiusFromBounds = (point, radius) => [
    Math.abs(point.x/* - 0*/), Math.abs(point.x - innerWidth),
    Math.abs(point.y/* - 0*/), Math.abs(point.y - innerHeight),
].some(distance => distance < radius);

const radiusIsLarge = radius => radius > Math.min(innerWidth, innerHeight) / 4;

function isRenderTarget({ x, y, k }, nodeRadius) {
    const scaled = screenScale({ x, y, k });
    return node => radiusIsLarge(nodeRadius(node) * k) && insideScreenBounds(scaled(node));
}

export default function NetworkLayout({
        linkRenderer,
        style,
        renderTarget,
        localTransform,
        simulation
    }) {

    const dispatch = d3.dispatch('click', 'dblclick', 'mouseover', 'mouseout', 'render', 'destroy');

    const elements = {
        parent: renderTarget.parent,
        labels: renderTarget.labels,
    };

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

        dispatch.on('mouseover', highlightNode);
        dispatch.on('mouseout', restoreNode(style));
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
            path: linkRenderer,
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
            .on('mouseover', function (n) { dispatch.call('mouseover', this, n) })
            .on('mouseout', function (n) { dispatch.call('mouseout', this, n) })
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
            .attr('r', n => style.searchMarkRadius(numberOfHits(n)))
            .style('fill', '#F48074');

        elements.label = labels.selectAll('.label')
            .data(nodes)
            .enter()
            .append('text')
            .attr('class', 'label')
            .text(nodeName)
            .attr('text-anchor', 'left')
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
            .attr('r', n => style.searchMarkRadius(numberOfHits(n)))
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
        const { translate = [0, 0], scale = 1, parentScale = 1, parentTranslate = [0, 0] } = localTransform || {};

        x += k * (parentScale * translate[0] + parentTranslate[0]);
        y += k * (parentScale * translate[1] + parentTranslate[1]);
        k *= scale;

        label.accessors.x = n => x + k * n.x;
        label.accessors.y = n => y + k * n.y;
        label.accessors.dx = (n) => {
            const r = 1.1 * style.nodeRadius(n);
            const dx = k * r + (k > 1 ? 2 * (1 - k) * r : 0);
            return Math.max(dx, 0);
        };
        label.accessors.visibility = n =>
            label.accessors.lod(k)(n) ? 'visible' : 'hidden'
        label.accessors.text = (n) => {
            const node = k < 0.15 && n.id === 1 && n.parent ? n.parent : n;
            return k > 3 && n.nodes ? '' : nodeName(node);
        };
        link.accessors.path = l =>
            k < 12 && link.accessors.lod(k)(l) ? linkRenderer(l) : null;

        if (k > 1.5) {
            const zoomNormalized = d3.scaleLinear().domain([1.5, 6.5]).range([0, 1]).clamp(true);
            const c = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
            const scaled = screenScale({ x, y, k });
            const distance = (p1, p2) => Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2)
            const distanceFromCenter = n => distance(n, c);
            const distanceNormalized = d3.scaleLinear().domain([600, 0]).range([0, 1]).clamp(true);

            circle.accessors.fill = (n) => {
                if (!n.nodes) return style.nodeFillColor(n);
                const d = n => (k < 5 ? distanceNormalized(distanceFromCenter(scaled(n))) : 1);
                return d3.interpolateRgb(style.nodeFillColor(n), '#ffffff')
                    (zoomNormalized(k) * d(n));
            };
            circle.accessors.r = (n) => {
                if (!n.nodes) return style.nodeRadius(n);
                return d3.interpolateNumber(style.nodeRadius(n), 150)
                    (zoomNormalized(k) * distanceNormalized(distanceFromCenter(scaled(n))));
            };
        }

        if (k > 2) {
            elements.node.on('.drag', null);
            dispatch.on('mouseover', null);
            simulation.stop();

            nodes.filter(n => n.nodes && !n.visible)
                .filter(isRenderTarget({ x, y, k }, circle.accessors.r))
                .forEach((n) => {
                    const childScale = 0.15;
                    const childTranslate = [n.x * (1 - childScale), n.y * (1 - childScale)];
                    const parentElement = elements.parent.append('g')
                        .attr('transform', `translate(${childTranslate}), scale(${childScale})`);
                    const labelsElement = d3.select('#labelsContainer').append('g')
                        .attr('class', 'network labels');

                    const childTransform = {
                        parentTranslate: [translate[0] + parentTranslate[0], translate[1] + parentTranslate[1]],
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
        } else {
            elements.node.call(onDrag);
            dispatch.on('mouseover', highlightNode);
            simulation.restart();

            nodes.filter(n => n.visible)
                .forEach(n => dispatch.call('destroy', null, n.path));
        }

        update();
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
