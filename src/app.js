import * as d3 from 'd3';
import dat from 'dat.gui';
import Dropzone from 'dropzone';
import FileSaver from 'file-saver';
import parseFile from 'parse';
import parseFTree from 'file-formats/ftree';
import networkFromFTree from 'file-formats/network-from-ftree';
import ftreeFromNetwork from 'file-formats/ftree-from-network';
import { traverseDepthFirst, makeGetNodeByPath } from 'network';
import { halfLink, undirectedLink } from 'network-rendering';
import NetworkSimulation from 'network-simulation';
import makeRenderStyle from 'render-style';
import { highlightNode, restoreNode } from 'highlight-node';
import {
    byFlow,
    sumFlow,
    takeLargest,
    accumulateLargest,
    connectedLinks,
} from 'filter';

function runApplication(network, file) {
    const state = {
        filename: file.name,
        nodeFlow: 1,
        linkFlow: 0.8,
        path: 'root',
        linkDistance: 300,
        charge: 500,
        search: '',
        selectedNode: null,
        selected: '',
        download: false,
    };

    const maxNodeFlow = Array.from(traverseDepthFirst(network))
        .map(node => node.flow)
        .reduce((max, curr) => Math.max(max, curr), -Infinity);

    const maxLinkFlow = Array.from(traverseDepthFirst(network))
        .filter(node => node.links)
        .map(node => node.links)
        .reduce((acc, curr) => acc.concat(curr), [])
        .map(link => link.flow)
        .reduce((max, curr) => Math.max(max, curr), -Infinity);

    const renderStyle = makeRenderStyle(maxNodeFlow, maxLinkFlow);
    const linkRenderer = (network.directed ? halfLink : undirectedLink)()
        .nodeRadius(renderStyle.nodeRadius)
        .width(renderStyle.linkWidth);
    const getNodeByPath = makeGetNodeByPath(network);

    const ZOOM_EXTENT_MIN = 0.1;
    const ZOOM_EXTENT_MAX = 50;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const screenCenter = {
        x: width / 2,
        y: height / 2,
    };

    const event = d3.dispatch('zoom', 'path', 'select');

    const svg = d3.select('svg')
        .attr('width', width)
        .attr('height', height);

    svg.append('rect')
        .attr('class', 'background')
        .attr('width', width)
        .attr('height', height);

    const root = svg.append('g')
        .attr('class', 'network');

    const labels = svg.append('g')
        .attr('class', 'network labels')

    const zoom = d3.zoom()
        .scaleExtent([ZOOM_EXTENT_MIN, ZOOM_EXTENT_MAX])
        .on('zoom', () => {
            event.call('zoom', null, d3.event.transform);
            root.attr('transform', d3.event.transform);
        });

    svg.call(zoom)
        .on('dblclick.zoom', null);

    const parentNodes = [];

    function returnToParent() {
        const parent = parentNodes.pop();

        // Do nothing if we're at the top
        if (!parent) return;

        event.call('path', null, parent.parent);

        const parentElem = d3.select(`#${parent.path.toId()}`);
        const { x, y } = parentElem ? parentElem.datum() : screenCenter;
        const scale = ZOOM_EXTENT_MAX;
        const translate = [screenCenter.x - scale * x, screenCenter.y - scale * y];

        svg.call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale));
        svg.transition()
            .duration(200)
            .call(zoom.transform, d3.zoomIdentity);
    }

    function enterChild(node) {
        // Do nothing if node has no child nodes
        if (!(node.nodes && node.nodes.length)) return;

        parentNodes.push(node);

        const scale = ZOOM_EXTENT_MAX;
        const translate = [screenCenter.x - scale * node.x, screenCenter.y - scale * node.y];

        svg.transition()
            .duration(400)
            .on('end', () => event.call('path', null, node))
            .call(zoom.transform, d3.zoomIdentity.translate(...translate).scale(scale))
            .transition()
            .duration(0)
            .call(zoom.transform, d3.zoomIdentity);
    }

    d3.select('body').on('keydown', () => {
        const translateAmount = 50;
        const translateDuration = 250;
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
        case 'ArrowUp':
        case 'w':
        case 'W':
            svg.transition()
                .duration(translateDuration)
                .call(zoom.translateBy, 0, translateAmount);
            break;
        case 'ArrowDown':
        case 's':
        case 'S':
            svg.transition()
                .duration(translateDuration)
                .call(zoom.translateBy, 0, -translateAmount);
            break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
            svg.transition()
                .duration(translateDuration)
                .call(zoom.translateBy, translateAmount, 0);
            break;
        case 'ArrowRight':
        case 'd':
        case 'D':
            svg.transition()
                .duration(translateDuration)
                .call(zoom.translateBy, -translateAmount, 0);
            break;
        default:
            break;
        }
    });

    const setDirty = () => {
        const branch = getNodeByPath(state.path);
        branch.state.dirty = true;
    };

    const cullLargest = () => {
        let { nodes, links } = getNodeByPath(state.path);
        const nodeFlow = sumFlow(nodes);

        nodes.forEach(node => node.shouldRender = false);
        links.forEach(link => link.shouldRender = false);

        nodes = takeLargest(nodes, 20);
        links = connectedLinks({ nodes, links });

        nodes.forEach(node => node.shouldRender = true);
        links.forEach(link => link.shouldRender = true);

        state.nodeFlow = nodeFlow ? sumFlow(nodes) / nodeFlow : 1;
    };

    const filterFlow = () => {
        let { nodes, links } = getNodeByPath(state.path);

        nodes.forEach(node => node.shouldRender = false);
        links.forEach(link => link.shouldRender = false);

        nodes = accumulateLargest(nodes, state.nodeFlow);
        links = accumulateLargest(links, state.linkFlow);
        links = connectedLinks({ nodes, links });

        nodes.forEach(node => node.shouldRender = true);
        links.forEach(link => link.shouldRender = true);
    };

    const simulations = new Map();
    event.on('zoom', transform =>
        simulations.forEach(s => s.applyTransform(transform)));

    const render = () => {
        const branch = getNodeByPath(state.path);

        const simulation = simulations.get(state.path) ||
            new NetworkSimulation(linkRenderer, renderStyle, screenCenter, root, labels, state);
        simulations.set(state.path, simulation);

        simulation.on('dblclick', function (node) {
            simulation.stop();
            enterChild(node);
        });
        simulation.on('click', function (node) { event.call('select', this, node) });
        simulation.on('mouseover', highlightNode);
        simulation.on('mouseout', restoreNode(renderStyle));

        simulation.init(branch);
    };

    const search = (name) => {
        try {
            const re = new RegExp(name, 'i');

            for (let node of traverseDepthFirst(network)) {
                if (!node.nodes) {
                    node.marked = name.length
                        ? re.test(node.name)
                        : false;
                }
            }
        } catch (e) {
            // No-op
        }
    };

    event.on('path', (node) => {
        state.path = node.path;
        state.selectedNode = null;
        state.selected = '';
        cullLargest();
        render();
    });

    event.on('select', (node) => {
        state.selectedNode = node;
        state.selected = node ? node.name || node.largest.map(n => n.name).join(', ') : '';
    });

    const gui = new dat.GUI();
    gui.add(state, 'filename');
    gui.add(state, 'linkDistance', 50, 500).step(25).onFinishChange(() => { setDirty(); render(); });
    gui.add(state, 'charge', 0, 2000).step(100).onFinishChange(() => { setDirty(); render(); });
    gui.add(state, 'nodeFlow', 0, 1).step(0.01).onFinishChange(() => { filterFlow(); setDirty(); render(); }).listen();
    gui.add(state, 'linkFlow', 0, 1).step(0.01).onFinishChange(() => { filterFlow(); setDirty(); render(); }).listen();
    gui.add(state, 'path').listen();
    gui.add(state, 'search').onChange((name) => { search(name); render(); });
    gui.add(state, 'selected').onFinishChange((name) => {
        if (state.selectedNode) state.selectedNode.name = name;
        render();
    }).listen();
    gui.add(state, 'download').onChange(() => {
        const ftree = ftreeFromNetwork(network);
        const blob = new Blob([ftree], { type: 'text/plain;charset=utf-8;' });
        FileSaver.saveAs(blob, state.filename);
        setTimeout(() => { state.download = false; }, 100);
    }).listen();

    cullLargest();
    render();
}

const svg = d3.select('svg')
    .attr('width', window.innerWidth)
    .attr('height', window.innerHeight);

function acceptFile(file) {
    svg.append('g')
        .attr('id', 'loading')
        .attr('transform', `translate(${window.innerWidth / 2}, ${window.innerHeight / 2}) rotate(-45)`)
        .append('path')
        .attr('class', 'move')
        .attr('d', 'M0,-25A25,25 0 0,1 25,0L20,0A20,20 0 0,0 0,-20Z')
        .style('fill', '#555555');

    parseFile(file)
        .then((parsed) => {
            const ftree = parseFTree(parsed.data);
            const network = networkFromFTree(ftree);
            d3.select('#my-dropzone').remove();
            d3.select('#loading').remove();
            runApplication(network, file);
        })
        .catch(err => console.error(err));
}

Dropzone.options.myDropzone = {
    maxFiles: 1,
    acceptedFiles: '.ftree,.net',
    accept: acceptFile,
};
