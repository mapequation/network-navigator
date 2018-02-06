import * as d3 from 'd3';
import { halfLink, undirectedLink } from 'network-rendering';

export function makeGraphStyle(nodes, links) {
    const nodeRadius = d3.scaleLog().domain(d3.extent(nodes, n => n.flow)).range([20, 60]);
    const nodeFillColor = d3.scaleLinear().domain(d3.extent(nodes, n => n.flow)).range(['#DFF1C1', '#C5D7A8']);
    const nodeBorderColor = d3.scaleLinear().domain(d3.extent(nodes, n => n.exitFlow)).range(['#ABD65B', '#95C056']);
    const nodeBorderWidth = d3.scaleLinear().domain(d3.extent(nodes, n => n.exitFlow)).range([2, 6]);

    const linkFillColor = d3.scaleLinear().domain(d3.extent(links, l => l.flow)).range(['#71B2D7', '#418EC7']);
    const linkWidth = d3.scaleLinear().domain(d3.extent(links, l => l.flow)).range([4, 10]);
    const linkOpacity = d3.scaleLinear().domain(d3.extent(links, l => l.flow)).range([0.8, 1]);

    const textFontSize = d3.scaleLog().domain(d3.extent(nodes, n => n.flow)).range([7, 18]);

    return {
        node: {
            radius: node => nodeRadius(node.flow),
            fillColor: node => nodeFillColor(node.flow),
            borderColor: node => nodeBorderColor(node.exitFlow),
            borderWidth: node => nodeBorderWidth(node.exitFlow),
        },
        link: {
            fillColor: link => linkFillColor(link.flow),
            width: link => linkWidth(link.flow),
            opacity: link => linkOpacity(link.flow),
        },
        text: {
            fontSize: node => textFontSize(node.flow),
        },
    };
}

export function makeDragHandler(simulation) {
    return {
        dragStarted: (node) => {
            if (!d3.event.active) simulation.alphaTarget(0.3).restart();
            node.fx = node.x;
            node.fy = node.y;
        },

        drag: (node) => {
            node.fx = d3.event.x;
            node.fy = d3.event.y;
        },

        dragEnded: (node) => {
            if (!d3.event.active) simulation.alphaTarget(0);
            node.fx = null;
            node.fy = null;
        },
    };
}

export function makeTickCallback({
    circle,
    text,
    link,
    linkSvgPath,
}) {
    return () => {
        circle
            .attr('cx', n => n.x)
            .attr('cy', n => n.y);
        text
            .attr('x', n => n.x)
            .attr('y', n => n.y);
        link
            .attr('d', linkSvgPath);
    };
}


/**
  * Render all direct children to a node.
  *
 * @param {Node[]} nodes
 * @param {Object[]} links
 * @param {Object} params
 */
export default function render(
    nodes,
    links,
    {
        charge = 500,
        linkDistance = 100,
        linkType = 'directed',
    } = {},
) {
    const width = window.innerWidth;
    const height = window.innerHeight;

    const style = makeGraphStyle(nodes, links);

    const linkSvgPath = (linkType === 'directed' ? halfLink : undirectedLink)()
        .nodeRadius(style.node.radius)
        .width(style.link.width);

    const simulation = d3.forceSimulation()
        .force('collide', d3.forceCollide(20)
            .radius(style.node.radius))
        .force('link', d3.forceLink()
            .distance(linkDistance)
            .id(d => d.id))
        .force('charge', d3.forceManyBody()
            .strength(-charge)
            .distanceMax(400))
        .force('center', d3.forceCenter(width / 2, height / 2));

    const dragHandler = makeDragHandler(simulation);

    const svg = d3.select('svg')
        .attr('width', width)
        .attr('height', height)
        .call(d3.zoom().on('zoom', () => svg.attr('transform', d3.event.transform)))
        .append('g');

    const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .style('fill', style.link.fillColor)
        .style('opacity', style.link.opacity)
        .on('click', d => console.log(d));

    const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('class', 'node')
        .on('click', d => console.log(d))
        .call(d3.drag()
            .on('start', dragHandler.dragStarted)
            .on('drag', dragHandler.drag)
            .on('end', dragHandler.dragEnded));

    const circle = node.append('circle')
        .attr('r', style.node.radius)
        .style('fill', style.node.fillColor)
        .style('stroke', style.node.borderColor)
        .style('stroke-width', style.node.borderWidth);

    const text = node.append('text')
        .text(n => n.name || n.id)
        .attr('text-anchor', 'middle')
        .attr('dy', '0.35em');

    const ticked = makeTickCallback({ circle, text, link }, linkSvgPath)

    simulation
        .nodes(nodes)
        .on('tick', ticked);

    simulation
        .force('link')
        .links(links);
}
