import * as d3 from 'd3';
import { maxBy, flatMap } from 'lodash';
import dat from 'dat.gui';
import Dropzone from 'dropzone';
import FileSaver from 'file-saver';
import { halfLink, undirectedLink } from './link-renderer';
import parseFile from './parse-file';
import parseFTree from './file-formats/ftree';
import networkFromFTree from './file-formats/network-from-ftree';
import ftreeFromNetwork from './file-formats/ftree-from-network';
import { traverseDepthFirst, makeGetNodeByPath, searchName } from './network';
import NetworkLayout from './network-layout';
import Simulation from './simulation';
import makeRenderStyle from './render-style';
import zoomButtons from './zoom-buttons';
import Point from './point';
import {
    sumFlow,
    takeLargest,
    connectedLinks,
} from './filter';

function runApplication(network, file) {
    const state = {
        filename: file.name,
        nodeFlowFactor: 1,
        path: 'root',
        linkDistance: 250,
        charge: 500,
        search: '',
        selected: null,
        name: '',
        downloadData: false,
        downloadSvg: false,
    };

    const { maxNodeFlow, maxLinkFlow } = (() => {
        const entireNetwork = Array.from(traverseDepthFirst(network));

        return {
            maxNodeFlow: maxBy(entireNetwork, node => node.flow).flow,
            maxLinkFlow: maxBy(flatMap(entireNetwork, node => node.links || []),
                link => link.flow).flow,
        };
    })();

    const renderStyle = makeRenderStyle(maxNodeFlow, maxLinkFlow);
    const linkRenderer = (network.directed ? halfLink : undirectedLink)()
        .nodeRadius(renderStyle.nodeRadius)
        .width(renderStyle.linkWidth);
    const getNodeByPath = makeGetNodeByPath(network);

    const ZOOM_EXTENT_MIN = 0.1;
    const ZOOM_EXTENT_MAX = 100000;

    const width = window.innerWidth;
    const height = window.innerHeight;

    const svg = d3.select('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('xmlns', 'http://www.w3.org/2000/svg');

    svg.append('rect')
        .attr('class', 'background')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', '#fff');

    const root = svg.append('g')
        .attr('id', 'network');

    const labels = svg.append('g')
        .attr('id', 'labelsContainer');

    let translateAmount = 100;

    const layouts = new Map();

    const zoom = d3.zoom()
        .scaleExtent([ZOOM_EXTENT_MIN, ZOOM_EXTENT_MAX])
        .on('zoom', () => {
            translateAmount = 100 / d3.event.transform.k;
            layouts.forEach(layout =>
                layout.applyTransform(d3.event.transform).updateAttributes());
            root.attr('transform', d3.event.transform);
        });

    svg.call(zoom)
        .on('dblclick.zoom', null);

    zoomButtons(svg, [width - 50, height - 80])
        .onPlusClick(() =>
            svg.transition()
                .duration(300)
                .call(zoom.scaleBy, 2))
        .onMinusClick(() =>
            svg.transition()
                .duration(300)
                .call(zoom.scaleBy, 0.5));

    const onKeydown = () => {
        const translateDuration = 250;
        const key = d3.event.key || d3.event.keyCode;
        switch (key) {
        case 'Space':
        case ' ':
            svg.transition()
                .duration(300)
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
    };

    d3.select('body').on('keydown', onKeydown);

    layouts.set(state.path, NetworkLayout({
        linkRenderer,
        style: renderStyle,
        renderTarget: {
            parent: root.append('g').attr('class', 'network'),
            labels: labels.append('g').attr('class', 'network labels'),
        },
        localTransform: null,
        simulation: Simulation(new Point(width / 2, height / 2), state)
    }));

    const render = () => {
        const branch = getNodeByPath(state.path);
        let { nodes, links } = branch;

        const initialFlow = sumFlow(nodes);

        nodes.forEach(node => node.shouldRender = false);
        links.forEach(link => link.shouldRender = false);

        nodes = takeLargest(nodes, 20);
        links = connectedLinks({ nodes, links });

        nodes.forEach(node => node.shouldRender = true);
        links.forEach(link => link.shouldRender = true);

        state.nodeFlowFactor = initialFlow ? sumFlow(nodes) / initialFlow : 1;

        const layout = layouts.get(state.path);

        layout.on('click', (node) => {
            console.log(node);
            state.selectedNode = node;
            state.selected = node ? node.name || node.largest.map(n => n.name).join(', ') : '';
        }).on('render', ({ network, localTransform, renderTarget }) => {
            state.path = network.path;

            layouts.set(state.path, NetworkLayout({
                linkRenderer,
                style: renderStyle,
                localTransform,
                renderTarget,
                simulation: Simulation(Point.from(network), state),
            }));

            render();
        }).on('destroy', (path) => {
            const oldLayout = layouts.get(path);
            if (oldLayout) {
                oldLayout.destroy();
                layouts.delete(path);
            }
        }).init(branch);
    };

    const gui = new dat.GUI();
    gui.add(state, 'filename');
    gui.add(state, 'nodeFlowFactor', 0, 1).step(0.01).listen();
    gui.add(state, 'search')
        .onChange((name) => {
            d3.select('body').on('keydown', null);
            searchName(network, name);
            layouts.forEach(l => l.update());
        })
        .onFinishChange(() => d3.select('body').on('keydown', onKeydown));
    gui.add(state, 'name')
        .onChange(() => d3.select('body').on('keydown', null))
        .onFinishChange((name) => {
            if (state.selected) state.selected.name = name;
            layouts.forEach(l => l.update());
            d3.select('body').on('keydown', onKeydown);
        }).listen();
    gui.add(state, 'downloadData').onChange(() => {
        const ftree = ftreeFromNetwork(network);
        const blob = new Blob([ftree], { type: 'text/plain;charset=utf-8;' });
        FileSaver.saveAs(blob, state.filename);
        setTimeout(() => { state.downloadData = false; }, 100);
    }).listen();
    gui.add(state, 'downloadSvg').onChange(() => {
        const svgContent = d3.select('svg')
            .node().outerHTML;
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        FileSaver.saveAs(blob, `${state.filename}.svg`);
        setTimeout(() => { state.downloadSvg = false; }, 100);
    }).listen();

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
        .attr('d', 'M0-25A25 25 0 0 1 25 0h-5A20 20 0 0 0 0-20z')
        .style('animation', 'spinning 1.5s ease-in-out infinite')
        .style('fill', '#555');

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
