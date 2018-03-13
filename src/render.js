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
import PriorityQueue from 'priority-queue';


const ellipsis = (text, len = 25) => (text.length > len ? `${text.substr(0, len - 3)}...` : text);

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

    const queue = new PriorityQueue(byFlow, 12, node.nodes);

    let dy = 0;
    queue.items.forEach((item) => {
        info.append('text')
            .text(ellipsis(item.name, 30))
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

/**
 * Factory function to set up svg and return
 * a render function to render a network.
 *
 * @param {Observable} notifier network layer changes are broadcasted here
 * @param {Object} style renderStyle object
 * @param {boolean} [directed=true] directed or undirected links, affects link appearance
 * @return {makeRenderFunction~render} the render function
 */
export default function makeRenderFunction(notifier, style, directed = true) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select('svg')
        .attr('width', width)
        .attr('height', height);

    svg.append('rect')
        .attr('class', 'background')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g')
        .attr('class', 'network');

    const labels = svg.append('g')
        .attr('class', 'network labels')

    const zoom = d3.zoom()
        .scaleExtent([0.1, 50])
        .on('zoom', () => {
            notifier.notify({
                type: 'ZOOM',
                payload: d3.event.transform,
            });

            g.attr('transform', d3.event.transform);
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

        notifier.notify({
            type: 'PATH',
            payload: {
                node: parent.parent,
            },
        });

        const { x, y } = (() => {
            const parentElem = d3.select(`#${parent.path.toId()}`);
            if (parentElem) {
                return parentElem.datum();
            }
            return { x: width / 2, y: height / 2 };
        })();
        const scale = 50;
        const translate = [width / 2 - scale * x, height / 2 - scale * y];

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

        const { x, y } = node;
        const scale = 50;
        const translate = [width / 2 - scale * x, height / 2 - scale * y];

        svg.transition()
            .duration(400)
            .on('end', () => {
                notifier.notify({
                    type: 'PATH',
                    payload: {
                        node,
                    },
                });
            })
            .call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale))
            .transition()
            .duration(0)
            .call(zoom.transform, d3.zoomIdentity);
    }

    d3.select('body').on('keydown', () => {
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
        const { state } = network;
        const { simulation } = network.state;

        svg.selectAll('.network').selectAll('*').remove();

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

        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('.link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .style('fill', style.linkFillColor);

        // Used to distinguish between single and double clicks
        let clickTimeout = null;

        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('id', n => n.path.toId())
            .on('dblclick', (n) => {
                clearTimeout(clickTimeout);
                enterChild(n);
            })
            .on('click', (n) => {
                clearTimeout(clickTimeout);
                clickTimeout = setTimeout(() => {
                    notifier.notify({
                        type: 'SELECT',
                        payload: {
                            node: n,
                        },
                    });
                }, 200);
            })
            .on('mouseover', function (n) {
                showInfoBox(n);
                d3.select(this).select('circle')
                    .style('stroke', '#F48074');
                d3.selectAll('.link').filter(d => d.target === n)
                    .raise()
                    .style('fill', '#ba6157');
                d3.selectAll('.link').filter(d => d.source === n)
                    .raise()
                    .style('fill', '#F48074');
            })
            .on('mouseout', function (n) {
                hideInfoBox();
                d3.select(this).select('circle')
                    .style('stroke', style.nodeBorderColor);
                d3.selectAll('.link')
                    .sort((a, b) => a.flow - b.flow)
                    .style('fill', style.linkFillColor);
            })
            .call(d3.drag()
                .on('start', dragStarted)
                .on('drag', drag)
                .on('end', dragEnded));

        const circle = node.append('circle')
            .attr('r', style.nodeRadius)
            .style('fill', style.nodeFillColor)
            .style('stroke', style.nodeBorderColor)
            .style('stroke-width', style.nodeBorderWidth)

        const mark = node.append('circle')
            .attr('r', (n) => {
                let hits = n.marked ? 1 : 0;
                if (hits === 0 && n.hasChildren) {
                    for (let child of n.traverseDepthFirst()) {
                        if (child.marked) {
                            hits++;
                        }
                    }
                }
                return style.searchMarkRadius(hits);
            })
            .style('fill', '#F48074');

        const text = labels.selectAll('.label')
            .data(nodes)
            .enter()
            .append('text')
            .attr('class', 'label')
            .text(n => ellipsis(n.name))
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
        };

        const linkAttr = {
            visibility: l => 'visible',
        };

        const tick = () => {
            circle
                .attr('cx', n => n.x)
                .attr('cy', n => n.y);
            mark
                .attr('cx', n => n.x)
                .attr('cy', n => n.y);
            text
                .attr('x', labelAttr.x)
                .attr('y', labelAttr.y)
                .attr('dx', labelAttr.dx)
                .attr('visibility', labelAttr.visibility);
            link
                .attr('d', linkSvgPath)
                .attr('visibility', linkAttr.visibility);
        };

        nodes.forEach((n) => {
            const len = nodes.length;
            const k = (len - 1)/(1 - 0.1); // dy/dx
            const m = 1 - 0.1*k; // y(0.1) = 1
            n.visible = x => n.id <= k*x + m;
        });

        links.forEach((l, i) => {
            // Links are in increasing flow order so the highest flow link is rendered on top.
            const relativeIndex = (links.length - i) / links.length;
            l.visible = k => relativeIndex < k;
        });

        const zoomObserver = {
            update(message) {
                if (message.type === 'ZOOM') {
                    const { x, y, k } = message.payload;
                    labelAttr.x = n => x + k * n.x;
                    labelAttr.y = n => y + k * n.y;
                    labelAttr.dx = n => k * 1.1 * style.nodeRadius(n);
                    labelAttr.visibility = n => n.visible(k) ? 'visible' : 'hidden';
                    linkAttr.visibility = l => l.visible(k) ? 'visible' : 'hidden';

                    tick();
                }
            }
        };

        notifier.attach(zoomObserver);

        simulation
            .force('collide', d3.forceCollide(20)
                .radius(style.nodeRadius))
            .force('link', d3.forceLink()
                .distance(linkDistance))
            .force('charge', d3.forceManyBody()
                .strength(-charge)
                .distanceMax(400))
            .force('center', d3.forceCenter(width / 2, height / 2));

        simulation
            .nodes(nodes)
            .on('tick', tick);

        simulation
            .force('link')
            .links(links);

        if (state.charge !== charge || state.linkDistance !== linkDistance) {
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

    return render;
}
