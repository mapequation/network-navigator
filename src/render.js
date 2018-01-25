import * as d3 from 'd3';
import LinkRenderer from 'linkrenderer';

export default function render(graph) {
    const svg = d3.select('svg');
    const width = +svg.attr('width');
    const height = +svg.attr('height');

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
        .range([3, 8]);
    const linkFillColor = d3.scaleLinear()
        .domain(d3.extent(graph.links, link => link.flow))
        .range(['#71B2D7', '#418EC7']);
    const linkWidth = d3.scaleLinear()
        .domain(d3.extent(graph.links, link => link.flow))
        .range([3, 20]);
    const linkOpacity = d3.scaleLinear()
        .domain(d3.extent(graph.links, link => link.flow))
        .range([0.7, 1]);

    const simulation = d3.forceSimulation()
        .force('link', d3.forceLink()
            .distance(300)
            .id(d => d.path[0]))
        .force('charge', d3.forceManyBody()
            .strength(() => -2000))
        .force('collide', d3.forceCollide(30).radius(d => nodeRadius(d.flow)))
        .force('center', d3.forceCenter(width / 2, height / 2));

    function dragstarted(d) {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
    }

    function dragged(d) {
        d.fx = d3.event.x;
        d.fy = d3.event.y;
    }

    function dragended(d) {
        if (!d3.event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    }

    const linkRenderer = new LinkRenderer();
    linkRenderer.nodeRadius = node => nodeRadius(node.flow);
    linkRenderer.width = link => linkWidth(link.flow);
    //linkRenderer.oppositeLink = link => graph.links[link.oppositeLink];

    const link = svg.append('g')
        .attr('class', 'links')
        .selectAll('line')
        .data(graph.links)
        .enter()
        .append('path')
        .attr('class', 'link')
        .style('fill', d => linkFillColor(d.flow))
        .style('stroke', 'none')
        .style('opacity', d => linkOpacity(d.flow))
        .attr('stroke-width', '1.5px')
        .attr('d', linkRenderer.svgPath);

    const node = svg.append('g')
        .attr('class', 'nodes')
        .selectAll('circle')
        .data(graph.nodes)
        .enter()
        .append('circle')
        .attr('class', 'node')
        .style('fill', d => nodeFillColor(d.flow))
        .style('stroke', d => nodeBorderColor(d.exitFlow))
        .style('stroke-width', d => nodeBorderWidth(d.exitFlow))
        .attr('r', d => nodeRadius(d.flow))
        .call(d3.drag()
            .on('start', dragstarted)
            .on('drag', dragged)
            .on('end', dragended));

    function ticked() {
        link.attr('d', linkRenderer.svgPath);

        node.attr('cx', d => d.x)
            .attr('cy', d => d.y);
    }

    simulation
        .nodes(graph.nodes)
        .on('tick', ticked);

    simulation
        .force('link')
        .links(graph.links);
}
