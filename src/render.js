import * as d3 from 'd3';
import { halfLink } from 'network-rendering/network-rendering';

const graphStyle = (graph) => {
    const scaleLinear = (array, accessor, range) =>
        d3.scaleLinear()
            .domain(d3.extent(array, accessor))
            .range(range);

    const lumpFillColor = scaleLinear(graph.nodes, node => node.flow, ['#EF7518', '#D75908']);
    const lumpBorderColor = scaleLinear(graph.nodes, node => node.exitFlow, ['#FFAE38', '#f9a327']);

    const nodeFillColor = scaleLinear(graph.nodes, node => node.flow, ['#DFF1C1', '#C5D7A8']);
    const nodeBorderColor = scaleLinear(graph.nodes, node => node.exitFlow, ['#ABD65B', '#95C056']);
    const nodeRadius = scaleLinear(graph.nodes, node => node.flow, [10, 60]);
    const nodeBorderWidth = scaleLinear(graph.nodes, node => node.exitFlow, [1, 5]);

    const linkFillColor = scaleLinear(graph.links, link => link.flow, ['#71B2D7', '#418EC7']);
    const linkWidth = scaleLinear(graph.links, link => link.flow, [3, 9]);
    const linkOpacity = scaleLinear(graph.links, link => link.flow, [1, 1]);

    return {
        node: {
            fillColor: node => (node.id === 'lump' ? lumpFillColor(node.flow) : nodeFillColor(node.flow)),
            borderColor: node => (node.id === 'lump' ? lumpBorderColor(node.flow) : nodeBorderColor(node.exitFlow)),
            radius: node => nodeRadius(node.flow),
            borderWidth: node => nodeBorderWidth(node.exitFlow),
        },
        link: {
            fillColor: link => linkFillColor(link.flow),
            width: link => linkWidth(link.flow),
            opacity: link => linkOpacity(link.flow),
        },
    };
};

/**
  * Render all direct children to a node.
  *
 * @param {Node} rootNode
 * @param {Object} params
 */
export default function render(rootNode, { renderLump = false, charge = 1000, linkDistance = 100 } = {}) {
    const svg = d3.select('svg');
    const width = window.innerWidth;
    const height = 900;

    svg.attr('width', width).attr('height', height);

    const lumpNode = node => node.id === 'lump';
    const linkToLump = link => link.source === 'lump' || link.target === 'lump';

    const linkData = renderLump ? rootNode.links : rootNode.links.filter(l => !linkToLump(l));
    const nodeData = renderLump ? rootNode.nodes : rootNode.nodes.filter(n => !lumpNode(n));

    const style = graphStyle({
        nodes: nodeData,
        links: linkData,
    });

    const force = {
        link: d3.forceLink()
            .distance(linkDistance)
            .id(d => d.id),
        charge: d3.forceManyBody()
            .strength(-charge),
        collide: d3.forceCollide(20)
            .radius(style.node.radius),
        center: d3.forceCenter(width / 2, height / 2),
    };

    const simulation = d3.forceSimulation()
        .force('link', force.link)
        .force('charge', force.charge)
        .force('collide', force.collide)
        .force('center', force.center);

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

    const onClick = (id) => {
        console.log(id);
    };

    const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(linkData)
        .enter()
        .append('path')
        .attr('class', 'link')
        .style('fill', style.link.fillColor)
        .style('opacity', style.link.opacity)
        .on('click', onClick);

    const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(nodeData)
        .enter()
        .append('circle')
        .attr('class', 'node')
        .attr('r', style.node.radius)
        .style('fill', style.node.fillColor)
        .style('stroke', style.node.borderColor)
        .style('stroke-width', style.node.borderWidth)
        .on('click', onClick)
        .call(d3.drag()
            .on('start', dragStarted)
            .on('drag', drag)
            .on('end', dragEnded));

    const linkSvgPath = halfLink()
        .nodeRadius(style.node.radius)
        .width(style.link.width);

    const ticked = () => {
        link.attr('d', linkSvgPath);
        node.attr('cx', n => n.x)
            .attr('cy', n => n.y);
    };

    simulation
        .nodes(nodeData)
        .on('tick', ticked);

    simulation
        .force('link')
        .links(linkData);
}
