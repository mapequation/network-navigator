import * as d3 from 'd3';
import networkRendering from 'network-rendering/network-rendering';

const dragHandler = (simulation) => {
    const started = (node) => {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        node.fx = node.x;
        node.fy = node.y;
    };
    const drag = (node) => {
        node.fx = d3.event.x;
        node.fy = d3.event.y;
    };
    const ended = (node) => {
        if (!d3.event.active) simulation.alphaTarget(0);
        node.fx = null;
        node.fy = null;
    };

    return d3.drag()
        .on('start', started)
        .on('drag', drag)
        .on('end', ended);
};

const graphStyle = (graph) => {
    const nodeFillColor = d3.scaleLinear()
        .domain(d3.extent(graph.nodes, node => node.flow))
        .range(['#DFF1C1', '#C5D7A8']);
    const nodeBorderColor = d3.scaleLinear()
        .domain(d3.extent(graph.nodes, node => node.exitFlow))
        .range(['#ABD65B', '#95C056']);
    const nodeRadius = d3.scaleLinear()
        .domain(d3.extent(graph.nodes, node => node.flow))
        .range([30, 60]);
    const nodeBorderWidth = d3.scaleLinear()
        .domain(d3.extent(graph.nodes, node => node.exitFlow))
        .range([1, 5]);
    const linkFillColor = d3.scaleLinear()
        .domain(d3.extent(graph.links, link => link.flow))
        .range(['#71B2D7', '#418EC7']);
    const linkWidth = d3.scaleLinear()
        .domain(d3.extent(graph.links, link => link.flow))
        .range([5, 20]);
    const linkOpacity = d3.scaleLinear()
        .domain(d3.extent(graph.links, link => link.flow))
        .range([0.75, 1]);

    return {
        node: {
            fillColor: node => nodeFillColor(node.flow),
            borderColor: node => nodeBorderColor(node.exitFlow),
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

export default function render(graph, linkType = 'undirected') {
    const svg = d3.select('svg');
    const width = +svg.attr('width');
    const height = +svg.attr('height');

    const style = graphStyle(graph);

    const simulation = d3.forceSimulation()
        .force('link', d3.forceLink()
            .distance(200)
            .id(d => d.path[0]))
        .force('charge', d3.forceManyBody()
            .strength(() => -2000))
        .force('collide', d3.forceCollide(30)
            .radius(style.node.radius))
        .force('center', d3.forceCenter(width / 2, height / 2));

    const linkRenderer = networkRendering.halfLink()
        .nodeRadius(style.node.radius)
        .width(style.link.width);

    const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(graph.links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .style('fill', style.link.fillColor)
        .style('opacity', style.link.opacity);

    const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(graph.nodes)
        .enter()
        .append('circle')
        .attr('class', 'node')
        .attr('r', style.node.radius)
        .style('fill', style.node.fillColor)
        .style('stroke', style.node.borderColor)
        .style('stroke-width', style.node.borderWidth)
        .call(dragHandler(simulation));

    simulation
        .nodes(graph.nodes)
        .on('tick', () => {
            link.attr('d', linkRenderer);
            node.attr('cx', n => n.x)
                .attr('cy', n => n.y);
        });

    simulation
        .force('link')
        .links(graph.links);
}
