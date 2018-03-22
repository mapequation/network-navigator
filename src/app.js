import * as d3 from 'd3';
import dat from 'dat.gui';
import Dropzone from 'dropzone';
import FileSaver from 'file-saver';
import parseFile from 'parse-file';
import parseFTree from 'file-formats/ftree';
import networkFromFTree from 'file-formats/network-from-ftree';
import ftreeFromNetwork from 'file-formats/ftree-from-network';
import { traverseDepthFirst, makeGetNodeByPath } from 'network';
import { halfLink, undirectedLink } from 'network-rendering';
import NetworkLayout from 'network-layout';
import Simulation from 'simulation';
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
    const linkRenderer = (network.directed ? halfLink : undirectedLink)()
        .nodeRadius(renderStyle.nodeRadius)
        .width(renderStyle.linkWidth);
    const getNodeByPath = makeGetNodeByPath(network);

    const ZOOM_EXTENT_MIN = 0.1;
    const ZOOM_EXTENT_MAX = 200;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const screenCenter = {
        x: width / 2,
        y: height / 2,
    };

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

    let translateAmount = 100;

    const dispatch = d3.dispatch('zoom');

    const zoom = d3.zoom()
        .scaleExtent([ZOOM_EXTENT_MIN, ZOOM_EXTENT_MAX])
        .on('zoom', () => {
            translateAmount = 100 / d3.event.transform.k;
            dispatch.call('zoom', null, d3.event.transform);
            root.attr('transform', d3.event.transform);
        });

    svg.call(zoom)
        .on('dblclick.zoom', null);

    d3.select('body').on('keydown', () => {
        const translateDuration = 250;
        const key = d3.event.key || d3.event.keyCode;
        switch (key) {
        case 'Space':
        case ' ':
            svg.transition()
                .duration(200)
                .call(zoom.transform, d3.zoomIdentity);
            break;
        case 'ArrowUp':
            svg.transition()
                .duration(translateDuration)
                .call(zoom.translateBy, 0, translateAmount);
            break;
        case 'ArrowDown':
            svg.transition()
                .duration(translateDuration)
                .call(zoom.translateBy, 0, -translateAmount);
            break;
        case 'ArrowLeft':
            svg.transition()
                .duration(translateDuration)
                .call(zoom.translateBy, translateAmount, 0);
            break;
        case 'ArrowRight':
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

    const rootLayout = NetworkLayout({
        linkRenderer,
        style: renderStyle,
        renderTarget: { parent: root, labels },
        localTransform: null,
        simulation: Simulation(screenCenter, state)
    });

    const layouts = new Map();
    layouts.set(state.path, rootLayout);

    dispatch.on('zoom', transform => layouts.forEach(s => s.applyTransform(transform)));

    const render = () => {
        const branch = getNodeByPath(state.path);
        const layout = layouts.get(state.path);

        layout.on('click', function (node) {
            console.log(node);
            state.selectedNode = node;
            state.selected = node ? node.name || node.largest.map(n => n.name).join(', ') : '';
        });

        layout.on('render', ({ network, localTransform, renderTarget }) => {
            state.path = network.path;

            layouts.set(state.path, NetworkLayout({
                linkRenderer,
                style: renderStyle,
                localTransform,
                renderTarget,
                simulation: Simulation({ x: network.x, y: network.y }, { charge: 500, linkDistance: 300}),
            }));

            cullLargest();
            render();
        });

        layout.on('destroy', (path) => {
            const oldLayout = layouts.get(path);
            if (oldLayout) {
                oldLayout.destroy();
                layouts.delete(path);
            }
        });

        layout.init(branch);
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

            layouts.forEach(l => l.update());
        } catch (e) {
            // No-op
        }
    };

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
