import PromiseFileReader from 'promise-file-reader';
import * as d3 from 'd3';
import log from 'utils';
import { TreeParser } from 'parser';
import LinkRenderer from 'linkrenderer';

function printFileList(files) {
    const output = [];
    files.forEach((f) => {
        output.push(`<li><strong>${encodeURIComponent(f.name)}</strong> (${f.type || 'n/a'}) - ${f.size} bytes</li>`);
    });
    document.getElementById('list').innerHTML = `<ul>${output.join('')}</ul>`;
}

function processFile(file) {
    const pre = document.createElement('pre');
    pre.innerHTML = file;
    document.getElementById('list').insertBefore(pre, null);

    log(TreeParser.lines.tryParse(file));
}

function handleFiles(event) {
    const files = [...event.target.files];

    printFileList(files);

    files.forEach((file) => {
        PromiseFileReader.readAsText(file)
            .then(processFile)
            .catch(err => console.error(err));
    });
}

document.getElementById('files').addEventListener('change', handleFiles, false);

const data = {
    nodes: [
        {
            x: 110,
            y: 110,
            flow: 0.6,
            outFlow: 0.1,
        },
        {
            x: 400,
            y: 250,
            flow: 0.4,
            outFlow: 0.2,
        },
        {
            x: 700,
            y: 100,
            flow: 0.2,
            outFlow: 0.1,
        },
        {
            x: 300,
            y: 500,
            flow: 0.5,
            outFlow: 0.2,
        },
    ],
    links: [
        {
            source: 0,
            target: 1,
            flow: 0.1,
            oppositeLink: 1,
        },
        {
            source: 1,
            target: 0,
            flow: 0.6,
            oppositeLink: 0,
        },
        {
            source: 2,
            target: 1,
            flow: 0.5,
            oppositeLink: 1,
        },
        {
            source: 1,
            target: 2,
            flow: 0.2,
            oppositeLink: 2,
        },
        {
            source: 3,
            target: 1,
            flow: 0.5,
            oppositeLink: 1,
        },
        {
            source: 1,
            target: 3,
            flow: 0.1,
            oppositeLink: 3,
        },
    ],
};

// Connect network
data.links.forEach((link) => {
    link.source = data.nodes[link.source];
    link.target = data.nodes[link.target];
});

const nodeFillColor = d3.scaleLinear()
    .domain(d3.extent(data.nodes, node => node.flow))
    .range(['#EF7518', '#D75908']);
const nodeBorderColor = d3.scaleLinear()
    .domain(d3.extent(data.nodes, node => node.outFlow))
    .range(['#FFAE38', '#f9a327']);
const nodeRadius = d3.scaleLinear()
    .domain(d3.extent(data.nodes, node => node.flow))
    .range([50, 100]);
const nodeBorderWidth = d3.scaleLinear()
    .domain(d3.extent(data.nodes, node => node.outFlow))
    .range([3, 6]);
const linkFillColor = d3.scaleLinear()
    .domain(d3.extent(data.links, link => link.flow))
    .range(['#71B2D7', '#418EC7']);
const linkWidth = d3.scaleLinear()
    .domain(d3.extent(data.links, link => link.flow))
    .range([7, 13]);

const linkRenderer = new LinkRenderer();
linkRenderer.nodeRadius = node => nodeRadius(node.flow);
linkRenderer.width = link => linkWidth(link.flow);
linkRenderer.oppositeLink = link => data.links[link.oppositeLink];

const svg = d3.select('svg');

// Links
svg.append('g')
    .selectAll('.link')
    .data(data.links)
    .enter()
    .append('path')
    .attr('class', 'link')
    .style('fill', link => linkFillColor(link.flow))
    .style('stroke', 'none')
    .style('stroke-width', '1.5px')
    .attr('d', linkRenderer.svgPath);

// Nodes
svg.append('g')
    .selectAll('.node')
    .data(data.nodes)
    .enter()
    .append('circle')
    .attr('class', 'node')
    .style('fill', node => nodeFillColor(node.flow))
    .style('stroke', node => nodeBorderColor(node.outFlow))
    .style('stroke-width', node => nodeBorderWidth(node.outFlow))
    .attr('cx', node => node.x)
    .attr('cy', node => node.y)
    .attr('r', node => nodeRadius(node.flow));
