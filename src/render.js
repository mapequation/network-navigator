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
import makeNetworkStyle from 'network-style';


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

    let active = d3.select(null);

    const svg = d3.select('body').append('svg')
        .attr('width', width)
        .attr('height', height);

    const g = svg.append('g')
        .attr('class', 'graph');

    const zoom = d3.zoom()
        .scaleExtent([0.1, 50])
        .on('zoom', () => g.attr('transform', d3.event.transform));

    const simulation = d3.forceSimulation()
        .alphaDecay(0.06)
        .stop();

    const dragHandler = makeDragHandler(simulation);

    function reset(duration = 750) {
        active.call(dragHandler);
        active = d3.select(null);
        simulation.restart();

        return svg
            .transition()
            .duration(duration)
            .call(zoom.transform, d3.zoomIdentity);
    }

    function makeNodeClicked(radiusFunction) {
        // Use function keyword to get correct 'this'
        return function nodeClicked(node) {
            if (active.node() === this) return reset();

            // Do nothing if node has no child nodes
            if (!node.nodes.length) return;

            active = d3.select(this);
            active.on('.drag', null);
            simulation.stop();

            const { x, y } = node;
            const r = radiusFunction(node);
            const dx = 2 * r;
            const scale = Math.max(1, Math.min(50, 2 / (dx / width)));
            const translate = [width / 2 - scale * x, height / 2 - scale * y];

            setTimeout(() => notifier.notify(node), 750);

            const zoomIn = svg.transition()
                .duration(750)
                .on('end', () => reset(0))
                .call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale))
        }
    }

    svg.insert('rect', ':first-child')
        .attr('class', 'background')
        .attr('width', width)
        .attr('height', height)
        .on('click', reset);

    svg.call(zoom)
        .on('dblclick.zoom', null);

    d3.select('body').on('keydown', () => {
        const key = d3.event.key || d3.event.keyCode;
        switch (key) {
        case 'Esc':
        case 'Escape':
        case 27:
            notifier.notify('parent');
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
    const render = ({ nodes, links, charge, linkDistance, linkType }) => {
        const style = makeNetworkStyle({ nodes, links });

        g.selectAll('*').remove();

        const link = g.append('g')
            .attr('class', 'links')
            .selectAll('.link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .style('fill', style.link.fillColor)
            .style('opacity', style.link.opacity);

        const node = g.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('id', n => `id-${n.path}`)
            .attr('class', 'node')
            .on('dblclick', makeNodeClicked(style.node.radius))
            .call(dragHandler);

        const circle = node.append('circle')
            .attr('r', style.node.radius)
            .style('fill', style.node.fillColor)
            .style('stroke', style.node.borderColor)
            .style('stroke-width', style.node.borderWidth);

        const text = node.append('text')
            .text(n => (n.name ? ellipsis(n.name) : n.id))
            .attr('text-anchor', 'middle')
            .attr('dy', '0.35em')
            .style('font-size', style.text.fontSize);

        const linkSvgPath = (linkType === 'directed' ? halfLink : undirectedLink)()
            .nodeRadius(style.node.radius)
            .width(style.link.width);

        // The simulation object is reused between render calls.
        // Set the new forces and restart with alpha = 1 (which is the default)
        simulation
            .force('collide', d3.forceCollide(20)
                .radius(style.node.radius))
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

