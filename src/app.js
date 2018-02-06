import * as d3 from 'd3';
import dat from 'dat.gui';
import parseFile from 'parse';
import { parseFTree, createTree } from 'file-formats/ftree';
import { filterNodes, pruneLinks, filterDisconnectedNodes } from 'filter';

import { halfLink, undirectedLink } from 'network-rendering';
import { makeDragHandler, makeTickCallback } from 'render';
import makeGraphStyle from 'graph-style';

const ellipsis = text => (text.length > 13 ? `${text.substr(0, 10)}...` : text);

const width = window.innerWidth;
const height = window.innerHeight;

let active = d3.select(null);

const svg = d3.select('svg')
    .attr('width', width)
    .attr('height', height)
    .append('g');

const zoomed = () => {
    svg.attr('transform', d3.event.transform);
};

const zoom = d3.zoom()
    .scaleExtent([0.1, 20])
    .on('zoom', zoomed);

svg.call(zoom).on('dblclick.zoom', null);

const reset = () => {
    active = d3.select(null);
    svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
};

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

function runApplication(ftree) {
    const tree = createTree({
        treeData: ftree.data.tree,
        linkData: ftree.data.links,
    });

    console.log(tree);

    const filtering = {
        lumpFactor: 0.2,
        pruneFactor: 0.2,
    };

    const path = {
        path: 'root',
    };

    const renderParams = {
        linkDistance: 100,
        charge: 500,
        linkType: ftree.meta.linkType,
    };

    const renderBranch = () => {
        svg.selectAll('*').remove();

        const branch = tree.getNode(path.path).clone();

        filterNodes(branch, filtering.lumpFactor);
        pruneLinks(branch.links, filtering.pruneFactor);
        filterDisconnectedNodes(branch);

        const nodes = branch.children;
        const links = branch.links;

        const style = makeGraphStyle({ nodes, links });

        const linkSvgPath = (ftree.meta.linkType === 'directed' ? halfLink : undirectedLink)()
            .nodeRadius(style.node.radius)
            .width(style.link.width);

        const simulation = d3.forceSimulation()
            .force('collide', d3.forceCollide(20)
                .radius(style.node.radius))
            .force('link', d3.forceLink()
                .distance(renderParams.linkDistance)
                .id(d => d.id))
            .force('charge', d3.forceManyBody()
                .strength(-renderParams.charge)
                .distanceMax(400))
            .force('center', d3.forceCenter(width / 2, height / 2));

        const dragHandler = makeDragHandler(simulation);

        const link = svg.append('g')
            .attr('class', 'links')
            .selectAll('.link')
            .data(links)
            .enter()
            .append('path')
            .attr('class', 'link')
            .style('fill', style.link.fillColor)
            .style('opacity', style.link.opacity);

        function clicked(d) {
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

        const node = svg.append('g')
            .attr('class', 'nodes')
            .selectAll('.node')
            .data(nodes)
            .enter()
            .append('g')
            .attr('class', 'node')
            .on('dblclick', clicked)
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
    };

    const gui = new dat.GUI();

    const renderFolder = gui.addFolder('Rendering / simulation');
    renderFolder.add(renderParams, 'linkDistance', 50, 500).step(25).onFinishChange(renderBranch);
    renderFolder.add(renderParams, 'charge', 0, 2000).step(100).onFinishChange(renderBranch);
    renderFolder.open();

    const filteringFolder = gui.addFolder('Filtering');
    filteringFolder.add(filtering, 'lumpFactor', 0, 1).step(0.01).onFinishChange(renderBranch);
    filteringFolder.add(filtering, 'pruneFactor', 0, 1).step(0.01).onFinishChange(renderBranch);
    filteringFolder.open();

    gui.add(path, 'path').onFinishChange(() => {
        reset();
        renderBranch();
    });

    renderBranch();
}

fetch('data/stockholm.ftree')
//fetch('data/cities2011_3grams_directed.ftree')
    .then(res => res.text())
    .then(parseFile)
    .then(d => parseFTree(d.data))
    .then(runApplication)
    .catch(err => console.error(err));
