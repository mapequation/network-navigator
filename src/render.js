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
import { isTreePath } from 'file-formats/ftree';


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

const ellipsis = (text, len = 13) => (text.length > len ? `${text.substr(0, len - 3)}...` : text);

const nodeLabel = (node) => {
    if (node.name) {
        return ellipsis(node.name);
    } else if (node.largest.length) {
        return ellipsis(
            node.largest
                .map(item => item.name)
                .join(', '),
            25);
    } else {
        return node.id;
    }
};

const pathToId = path => isTreePath(path) ? `id-${path.replace(/:/g, '-')}` : `id-${path}`;

/**
 * Factory function to set up svg canvas and return
 * a render function to render a network to this canvas.
 *
 * @param {Observable} notifier network layer changes are broadcasted here
 * @return {makeRenderFunction~render} the render function
 */
export default function makeRenderFunction(notifier) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select('svg')
        .attr('width', width)
        .attr('height', height);

    const background = svg.append('rect')
        .attr('class', 'background')
        .style('fill', 'none')
        .attr('width', width)
        .attr('height', height)
        .on('dblclick', backgroundClicked);

    const network = svg.append('g')
        .attr('class', 'network');

    const zoom = d3.zoom()
        .scaleExtent([0.1, 50])
        .on('zoom', () => network.attr('transform', d3.event.transform));

    svg.call(zoom)
        .on('dblclick.zoom', null);

    const simulation = d3.forceSimulation()
        .alphaDecay(0.06)
        .stop();

    const dragHandler = makeDragHandler(simulation);

    const treePath = [];

    function backgroundClicked() {
        const parent = treePath.pop();

        if (!parent) return;

        notifier.notify('parent');

        for (let i = 0; i < 30; i++) {
            simulation.tick();
        }

        const { x, y } = d3.select(`#${parent}`).select('circle').datum();
        const scale = 50;
        const translate = [width / 2 - scale * x, height / 2 - scale * y];

        svg.call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale));

        svg.transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity);
    }

    function nodeClicked(node) {
        // Do nothing if node has no child nodes
        if (!node.nodes.length) return;

        treePath.push(pathToId(node.path));

        simulation.stop();

        const { x, y } = node;
        const scale = 50;
        const translate = [width / 2 - scale * x, height / 2 - scale * y];

        svg.transition()
            .duration(750)
            .on('end', () => {
                notifier.notify(node);

                for (let i = 0; i < 20; i++) {
                    simulation.tick();
                }
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
            backgroundClicked();
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
     * @param {Object} params
     * @param {Node[]} params.nodes the nodes
     * @param {Object[]} params.links the links
     * @param {number} params.charge the charge strength between nodes
     * @param {number} params.linkDistance the rest length between nodes
     * @param {string} params.linkType directed or undirected links, affects link appearance
     */
    const render = ({ nodes, links, style, charge, linkDistance, linkType }) => {
        network.selectAll('*').remove();

        const link = network.append('g')
            .attr('class', 'links')
            .selectAll('.link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .style('fill', style.linkFillColor);

        const node = network.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('id', n => pathToId(n.path))
            .attr('class', 'node')
            .on('dblclick', nodeClicked)
            .call(dragHandler);

        const circle = node.append('circle')
            .attr('r', style.nodeRadius)
            .style('fill', style.nodeFillColor)
            .style('stroke', style.nodeBorderColor)
            .style('stroke-width', style.nodeBorderWidth);

        const text = node.append('text')
            .text(nodeLabel)
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('fill', 'white')
            .style('font-size', style.fontSize)
            .style('paint-order', 'stroke')
            .style('stroke', 'black')
            .style('stroke-width', '3px')
            .style('stroke-linecap', 'square')
            .style('stroke-linejoin', 'round');

        const linkSvgPath = (linkType === 'directed' ? halfLink : undirectedLink)()
            .nodeRadius(style.nodeRadius)
            .width(style.linkWidth);

        // The simulation object is reused between render calls.
        // Set the new forces and restart with alpha = 1 (which is the default)
        simulation
            .force('collide', d3.forceCollide(20)
                .radius(style.nodeRadius))
            .force('link', d3.forceLink()
                .distance(linkDistance)
                .id(d => d.id))
            .force('charge', d3.forceManyBody()
                .strength(-charge)
                .distanceMax(400))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .alpha(1)
            .restart();

        simulation
            .nodes(nodes)
            .on('tick', () => {
                circle
                    .attr('cx', n => n.x)
                    .attr('cy', n => n.y);
                text
                    .attr('x', n => n.x)
                    .attr('y', n => n.y);
                link
                    .attr('d', linkSvgPath);
            });

        simulation
            .force('link')
            .links(links);
    };

    return render;
}
