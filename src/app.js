import * as d3 from 'd3';
import dat from 'dat.gui';
import Dropzone from 'dropzone';
import FileSaver from 'file-saver';
import parseFile from 'parse';
import parseFTree from 'file-formats/ftree';
import networkFromFTree from 'file-formats/network-from-ftree';
import ftreeFromNetwork from 'file-formats/ftree-from-network';
import { traverseDepthFirst, makeGetNodeByPath } from 'network';
import makeRenderFunction from 'render';
import makeRenderStyle from 'render-style';
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
    const render = makeRenderFunction(renderStyle, network.directed);
    const getNodeByPath = makeGetNodeByPath(network);

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

    const renderBranch = () => {
        const branch = getNodeByPath(state.path);

        render(branch, state.charge, state.linkDistance);

        branch.state.dirty = false;
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

    render.on('path', (node) => {
        state.path = node.path;
        state.selectedNode = null;
        state.selected = '';
        cullLargest();
        renderBranch();
    });

    render.on('select', (node) => {
        state.selectedNode = node;
        state.selected = node ? node.name || node.largest.map(n => n.name).join(', ') : '';
    });

    const gui = new dat.GUI();
    gui.add(state, 'filename');
    gui.add(state, 'linkDistance', 50, 500).step(25).onFinishChange(() => { setDirty(); renderBranch(); });
    gui.add(state, 'charge', 0, 2000).step(100).onFinishChange(() => { setDirty(); renderBranch(); });
    gui.add(state, 'nodeFlow', 0, 1).step(0.01).onFinishChange(() => { filterFlow(); setDirty(); renderBranch(); }).listen();
    gui.add(state, 'linkFlow', 0, 1).step(0.01).onFinishChange(() => { filterFlow(); setDirty(); renderBranch(); }).listen();
    gui.add(state, 'search').onChange((name) => { search(name); renderBranch(); });
    gui.add(state, 'selected').onFinishChange((name) => {
        if (state.selectedNode) state.selectedNode.name = name;
        renderBranch();
    }).listen();
    gui.add(state, 'download').onChange(() => {
        const ftree = ftreeFromNetwork(network);
        const blob = new Blob([ftree], { type: 'text/plain;charset=utf-8;' });
        FileSaver.saveAs(blob, state.filename);
        setTimeout(() => { state.download = false; }, 100);
    }).listen();

    cullLargest();
    renderBranch();
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
