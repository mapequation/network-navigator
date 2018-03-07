import * as d3 from 'd3';
import dat from 'dat.gui';
import Dropzone from 'dropzone';
import parseFile from 'parse';
import parseFTree from 'file-formats/ftree';
import parsePajek from 'file-formats/pajek';
import networkFromFTree from 'file-formats/network-from-ftree';
import networkFromPajek from 'file-formats/network-from-pajek';
import makeRenderFunction from 'render';
import makeRenderStyle from 'render-style';
import Observable from 'observable';
import CullVisitor from 'cullvisitor';
import FilterVisitor from 'filtervisitor';

function runApplication(network, linkType, file) {
    const state = {
        filename: file.name,
        nodeFlow: 1,
        linkFlow: 0.8,
        path: 'root',
        linkDistance: 300,
        charge: 500,
        search: '',
    };

    const renderNotifier = new Observable();
    const renderStyle = makeRenderStyle(network);
    const render = makeRenderFunction(renderNotifier, renderStyle, linkType);

    const setDirty = () => {
        const branch = network.getNodeByPath(state.path);
        branch.state.dirty = true;
    };

    const cullLargest = () => {
        const branch = network.getNodeByPath(state.path);
        branch.accept(new CullVisitor(state));
    };

    const filterFlow = () => {
        const branch = network.getNodeByPath(state.path);
        branch.accept(new FilterVisitor(state));
    };

    const renderBranch = () => {
        const branch = network.getNodeByPath(state.path);

        render(branch, state.charge, state.linkDistance);

        branch.state.dirty = false;
    };

    const search = (name) => {
        const re = new RegExp(name, 'i')

        const markMatches = name.length
            ? node => node.marked = re.test(node.name)
            : node => node.marked = false;

        network
            .flatten()
            .map(markMatches)
    }

    const observer = {
        update(message) {
            switch (message.type) {
            case 'PATH':
                state.path = message.payload.node.path;
                cullLargest();
                renderBranch();
                break;
            default:
                break;
            }
        },
    };

    renderNotifier.attach(observer);

    const gui = new dat.GUI();
    gui.add(state, 'filename');
    gui.add(state, 'linkDistance', 50, 500).step(25).onFinishChange(() => { setDirty(); renderBranch(); });
    gui.add(state, 'charge', 0, 2000).step(100).onFinishChange(() => { setDirty(); renderBranch(); });
    gui.add(state, 'nodeFlow', 0, 1).step(0.01).onFinishChange(() => { filterFlow(); setDirty(); renderBranch(); }).listen();
    gui.add(state, 'linkFlow', 0, 1).step(0.01).onFinishChange(() => { filterFlow(); setDirty(); renderBranch(); }).listen();
    gui.add(state, 'path').listen();
    gui.add(state, 'search').onChange(name => { search(name); renderBranch(); });

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
            const tree = parseFTree(parsed.data);
            const network = networkFromFTree(tree.data);
            d3.select('#my-dropzone').remove();
            d3.select('#loading').remove();
            runApplication(network, tree.meta.linkType, file);
        })
        .catch(err => console.error(err));
}

Dropzone.options.myDropzone = {
    maxFiles: 1,
    acceptedFiles: '.ftree,.net',
    accept: acceptFile,
};
