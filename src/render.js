/**
 * @file This file is the rendering part of the app
 * and contains a factory function for setting up the
 * svg canvas with callbacks for interaction from the user
 * and returning a render function.
 *
 * @author Anton Eriksson
 */

import * as d3 from 'd3';
import { halfLink, undirectedLink } from 'network-rendering';
import { byFlow } from 'filter';
import { traverseDepthFirst } from 'network';

const ellipsis = (text, len = 25) => (text.length > len ? `${text.substr(0, len - 3)}...` : text);
const capitalizeWord = word => word && word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
const capitalize = str => str.split(' ').map(capitalizeWord).join(' ');
const nodeName = node => capitalize(ellipsis(node.name || node.largest.map(childNode => childNode.name).join(', ')))

function makeDragHandler(simulation) {
    const dragStarted = (node) => {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        node.fx = node.x;
        node.fy = node.y;
    };

    const drag = (node) => {
        node.fx = d3.event.x;
        node.fy = d3.event.y;
    };

    const dragEnded = (node) => {
        if (!d3.event.active) simulation.alphaTarget(0);
        node.fx = null;
        node.fy = null;
    };

    return d3.drag()
        .on('start', dragStarted)
        .on('drag', drag)
        .on('end', dragEnded);
}

function makeClickHandler() {
    let clickTimeout;
    const clickDelay = 200;

    return {
        doubleClick(callback) {
            return function(n) {
                clearTimeout(clickTimeout);
                callback.call(this, n);
            }
        },

        click(callback) {
            return function(n) {
                clearTimeout(clickTimeout);
                clickTimeout = setTimeout(() => callback.call(this, n), clickDelay);
            }
        }
    }
}

function showInfoBox(node) {
    if (!node.nodes) return;

    const svg = d3.select('svg');

    const width = 240;
    const height = 200;

    const info = svg.append('g')
        .attr('class', 'infobox')
        .attr('id', `info-${node.path.toId()}`);

    const infoBox = info.append('rect')
        .attr('width', width)
        .attr('height', height)
        .attr('x', svg.attr('width') - width - 30)
        .attr('y', svg.attr('height') - height - 30)
        .style('fill', 'white')
        .style('stroke', 'black')
        .style('stroke-width', '2px');

    const items = node.nodes.slice(0, 12);

    let dy = 0;
    items.forEach((item) => {
        info.append('text')
            .text(ellipsis(item.name || item.largest.map(i => i.name).join(', '), 30))
            .attr('x', +infoBox.attr('x') + 10)
            .attr('y', +infoBox.attr('y') + 20)
            .attr('dy', dy)
            .style('fill', 'black')
            .style('font-size', 12);
        dy += 15;
    });
}

function hideInfoBox() {
    d3.selectAll('.infobox').remove();
}

function highlight(n) {
    d3.select(this).select('circle')
        .style('stroke', '#F48074');
    d3.selectAll('.link').filter(d => d.target === n)
        .raise()
        .style('fill', '#ba6157');
    d3.selectAll('.link').filter(d => d.source === n)
        .raise()
        .style('fill', '#F48074');
}

function restore(nodeBorderColor, linkFillColor) {
    d3.select(this).select('circle')
        .style('stroke', nodeBorderColor);
    d3.selectAll('.link')
        .sort((a, b) => a.flow - b.flow)
        .style('fill', linkFillColor);
}

function onNodeMouseOver(n) {
    highlight.call(this, n);
    showInfoBox(n);
}

function onNodeMouseOut(nodeBorderColor, linkFillColor) {
    return function(n) {
        restore.call(this, nodeBorderColor, linkFillColor);
        hideInfoBox();
    }
}

/**
 * Factory function to set up svg and return
 * a render function to render a network.
 *
 * @param {Object} style renderStyle object
 * @param {boolean} [directed=true] directed or undirected links, affects link appearance
 * @return {makeRenderFunction~render} the render function
 */
export default function makeRenderFunction(style, directed = true) {
    const ZOOM_EXTENT_MIN = 0.1;
    const ZOOM_EXTENT_MAX = 50;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const screenCenter = {
        x: width / 2,
        y: height / 2,
    };

    const event = d3.dispatch('zoom', 'path', 'select');

    const svg = d3.select('svg')
        .attr('width', width)
        .attr('height', height);

    svg.append('rect')
        .attr('class', 'background')
        .attr('width', width)
        .attr('height', height);

    const root = svg.append('g')
        .attr('class', 'network');

    const labels = svg.append('g')
        .attr('class', 'network labels')

    const zoom = d3.zoom()
        .scaleExtent([ZOOM_EXTENT_MIN, ZOOM_EXTENT_MAX])
        .on('zoom', () => {
            event.call('zoom', null, d3.event.transform);
            root.attr('transform', d3.event.transform);
        });

    svg.call(zoom)
        .on('dblclick.zoom', null);

    const linkSvgPath = (directed ? halfLink : undirectedLink)()
        .nodeRadius(style.nodeRadius)
        .width(style.linkWidth);

    const parentNodes = [];

    function returnToParent() {
        const parent = parentNodes.pop();

        // Do nothing if we're at the top
        if (!parent) return;

        hideInfoBox();

        event.call('path', null, parent.parent);

        const parentElem = d3.select(`#${parent.path.toId()}`);
        const { x, y } = parentElem ? parentElem.datum() : screenCenter;
        const scale = ZOOM_EXTENT_MAX;
        const translate = [screenCenter.x - scale * x, screenCenter.y - scale * y];

        svg.call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale));
        svg.transition()
            .duration(200)
            .call(zoom.transform, d3.zoomIdentity);
    }

    function enterChild(node) {
        // Do nothing if node has no child nodes
        if (!(node.nodes && node.nodes.length)) return;

        hideInfoBox();

        parentNodes.push(node);

        const scale = ZOOM_EXTENT_MAX;
        const translate = [screenCenter.x - scale * node.x, screenCenter.y - scale * node.y];

        svg.transition()
            .duration(400)
            .on('end', () => event.call('path', null, node))
            .call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale))
            .transition()
            .duration(0)
            .call(zoom.transform, d3.zoomIdentity);
    }

    d3.select('body').on('keydown', () => {
        const translateAmount = 50;
        const translateDuration = 250;
        const key = d3.event.key || d3.event.keyCode;
        switch (key) {
        case 'Esc':
        case 'Escape':
        case 27:
            returnToParent();
            break;
        case 'Space':
        case ' ':
            svg.transition()
                .duration(200)
                .call(zoom.transform, d3.zoomIdentity);
            break;
        case 'ArrowUp':
        case 'w':
        case 'W':
            svg.transition()
                .duration(translateDuration)
                .call(zoom.translateBy, 0, translateAmount);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            svg.transition()
                .duration(translateDuration)
                .call(zoom.translateBy, 0, -translateAmount);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            svg.transition()
                .duration(translateDuration)
                .call(zoom.translateBy, translateAmount, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            svg.transition()
                .duration(translateDuration)
                .call(zoom.translateBy, -translateAmount, 0);
            break;
        default:
            break;
        }
    });

    /**
     * Render a network of nodes and links to svg.
     *
     * @param {Network} network the network
     * @param {number} charge charge strength
     * @param {number} linkDistance link rest length
     */
    const render = (network, charge, linkDistance) => {
        const nodes = network.nodes.filter(node => node.shouldRender);
        const links = network.links.filter(link => link.shouldRender).reverse();
        const { state } = network;

        const simulation = state.simulation =
            state.simulation || d3.forceSimulation().stop();

        svg.selectAll('.network').selectAll('*').remove();

        const link = root.append('g')
            .attr('class', 'links')
            .selectAll('.link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .style('fill', style.linkFillColor);

        const dragHandler = makeDragHandler(simulation);

        const clickHandler = makeClickHandler();

        const node = root.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('id', n => n.path.toId())
            .on('dblclick', clickHandler.doubleClick(enterChild))
            .on('click', clickHandler.click(n => event.call('select', null, n)))
            .on('mouseover', onNodeMouseOver)
            .on('mouseout', onNodeMouseOut(style.nodeBorderColor, style.linkFillColor))
            .call(dragHandler);

        const circle = node.append('circle')
            .attr('r', style.nodeRadius)
            .style('fill', style.nodeFillColor)
            .style('stroke', style.nodeBorderColor)
            .style('stroke-width', style.nodeBorderWidth);

        const numberOfHits = n =>
            +n.marked || Array.from(traverseDepthFirst(n)).filter(child => child.marked).length;

        const mark = node.append('circle')
            .attr('r', n => style.searchMarkRadius(numberOfHits(n)))
            .style('fill', '#F48074');

        const label = labels.selectAll('.label')
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

        const labelAttr = {
            x: n => n.x,
            y: n => n.y,
            dx: n => 1.1 * style.nodeRadius(n),
            visibility: n => 'visible',
            text: nodeName,
        };

        const linkAttr = {
            visibility: l => true,
        };

        const tick = () => {
            circle
                .attr('cx', n => n.x)
                .attr('cy', n => n.y);
            mark
                .attr('r', n => style.searchMarkRadius(numberOfHits(n)))
                .attr('cx', n => n.x)
                .attr('cy', n => n.y);
            label
                .text(labelAttr.text)
                .attr('x', labelAttr.x)
                .attr('y', labelAttr.y)
                .attr('dx', labelAttr.dx)
                .attr('visibility', labelAttr.visibility);
            link
                .attr('d', l => linkAttr.visibility(l) ? linkSvgPath(l) : null);
        };

        const labelVisible = (() => {
            const visible = d3.scaleLinear().domain([0.2, 0.8]).range([1, nodes.length]).clamp(true);
            return k => n => n.id <= visible(k) ? 'visible' : 'hidden';
        })();

        const linkVisible = (() => {
            const len = links.length || 1;
            const visible = d3.scaleSqrt().domain([0.2, 2.5]).range([1 / len, 1]).clamp(true);
            return k => l => 1 - l.index / len <= visible(k);
        })();

        event.on('zoom', (transform) => {
            const { x, y, k } = transform;
            labelAttr.x = n => x + k * n.x;
            labelAttr.y = n => y + k * n.y;
            labelAttr.dx = (n) => {
                const r = 1.1 * style.nodeRadius(n);
                const dx = k * r + (k > 1 ? 1.5 * (1 - k) * r : 0);
                return Math.max(dx, 0);
            };
            labelAttr.visibility = labelVisible(k);
            labelAttr.text = (n) => {
                const node = k < 0.15 && n.id === 1 && n.parent ? n.parent : n;
                return nodeName(node);
            };
            linkAttr.visibility = linkVisible(k);

            tick();
        });

        simulation
            .force('collide', d3.forceCollide(20)
                .radius(style.nodeRadius))
            .force('link', d3.forceLink()
                .distance(linkDistance))
            .force('charge', d3.forceManyBody()
                .strength(-charge)
                .distanceMax(400))
            .force('center', d3.forceCenter(screenCenter.x, screenCenter.y));

        simulation
            .nodes(nodes)
            .on('tick', tick);

        simulation
            .force('link')
            .links(links);

        if (state.charge !== charge || state.linkDistance !== linkDistance) {
            state.charge = charge;
            state.linkDistance = linkDistance
            state.dirty = true;
        }

        if (network.state.dirty && simulation.alpha() < 1) {
            simulation.alpha(0.8);
            simulation.tick();
        }

        if (simulation.alpha() === 1) {
            for (let i = 0; i < 30; i++) simulation.tick();
        }

        simulation.restart();
    };

    /**
     * Accessor for event
     *
     * @param {string} name the name
     * @param {?Function} callback the callback
     */
    render.on = (name, callback) => callback ? event.on(name, callback) : event.on(name);

    return render;
}
