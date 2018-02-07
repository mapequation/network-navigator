import * as d3 from 'd3';
import { halfLink, undirectedLink } from 'network-rendering';
import makeGraphStyle from 'graph-style';

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

function makeTickCallback({
    circle, text, link, linkSvgPath,
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

const ellipsis = (text, len = 13) => (text.length > len ? `${text.substr(0, len - 3)}...` : text);

const width = window.innerWidth;
const height = window.innerHeight;

let active = d3.select(null);

const svg = d3.select('body').append('svg')
    .attr('width', width)
    .attr('height', height);

const g = svg.append('g')
    .attr('id', 'id-root')
    .attr('class', 'graph');

const zoom = d3.zoom()
    .scaleExtent([0.1, 20])
    .on('zoom', () => g.attr('transform', d3.event.transform));

const reset = () => {
    active = d3.select(null);

    return svg
        .transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity);
};

svg.insert('rect', ':first-child')
    .attr('class', 'background')
    .attr('width', width)
    .attr('height', height)
    .on('click', reset);

svg.call(zoom).on('dblclick.zoom', null);

d3.select('body').on('keydown', () => {
    const key = d3.event.key || d3.event.keyCode;
    switch (key) {
    case 'Esc':
    case 'Escape':
    case 27:
        reset();
        break;
    default:
        break;
    }
});

export default function render({
    parent, nodes, links, charge, linkDistance, linkType,
}) {
    parent.selectAll('*').remove();

    const style = makeGraphStyle({ nodes, links });

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

    function nodeClicked(d) {
        if (active.node() === this) return reset();
        active = d3.select(this);

        const { x, y } = d;
        const r = style.node.radius(d);
        const dx = 2 * r;
        const scale = Math.max(1, Math.min(20, 0.9 / (dx / width)));
        const translate = [width / 2 - scale * x, height / 2 - scale * y];

        return svg
            .transition()
            .duration(750)
            .call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale));
    }

    const link = parent.append('g')
        .attr('class', 'links')
        .selectAll('.link')
        .data(links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .style('fill', style.link.fillColor)
        .style('opacity', style.link.opacity);

    const node = parent.append('g')
        .attr('class', 'nodes')
        .selectAll('.node')
        .data(nodes)
        .enter()
        .append('g')
        .attr('id', n => `id-${n.path}`)
        .attr('class', 'node')
        .on('dblclick', nodeClicked)
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

    const ticked = makeTickCallback({
        circle, text, link, linkSvgPath,
    });

    simulation
        .nodes(nodes)
        .on('tick', ticked);

    simulation
        .force('link')
        .links(links);
}
