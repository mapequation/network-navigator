import * as d3 from 'd3';
import dat from 'dat.gui';
import Dropzone from 'dropzone';
import parseFile from 'parse';
import parseFTree from 'file-formats/ftree';
import parsePajek from 'file-formats/pajek';
import networkFromFTree from 'file-formats/network-from-ftree';
import networkFromPajek from 'file-formats/network-from-pajek';
import makeRenderFunction from 'render';
import makeNetworkStyle from 'network-style';
import Observable from 'observable';
import {
    byFlow,
    sumFlow,
    takeLargest,
    accumulateLargest,
    connectedNodes,
    connectedLinks,
} from 'filter';

const svg = d3.select('svg')
    .attr('width', window.innerWidth)
    .attr('height', window.innerHeight);

function runApplication(parsed, file) {
    const filetype = file.name.match(/\.(ftree|net)$/i);
    const extension = filetype[1];

    let tree = null;
    let network = null;

    if (extension === 'ftree') {
        tree = parseFTree(parsed.data);
        network = networkFromFTree(tree.data);
    } else if (extension === 'net') {
        tree = parsePajek(parsed.data);
        network = networkFromPajek(tree.data);
    }

    svg.selectAll('*').remove();

    const state = {
        filename: file.name,
        nodeFlow: 0.2,
        linkFlow: 0.8,
        path: 'root',
        linkDistance: 300,
        charge: 500,
        linkType: tree.meta.linkType,
    };

    const renderNotifier = new Observable();
    const render = makeRenderFunction(renderNotifier);

    const actions = {
        branch: network.getNodeByPath(state.path).clone(),
        style: null,

        clone() {
            this.branch = network.getNodeByPath(state.path).clone();
            this.style = makeNetworkStyle(this.branch);
            return this;
        },

        filterGUI() {
            this.branch.nodes = accumulateLargest(this.branch.nodes, state.nodeFlow);
            this.branch.links = accumulateLargest(this.branch.links, state.linkFlow);
            this.branch.links = connectedLinks(this.branch);
            this.branch.nodes = connectedNodes(this.branch);
            return this;
        },

        filterNewPath() {
            const flowBefore = sumFlow(this.branch.nodes);
            this.branch.nodes = takeLargest(this.branch.nodes, 20);
            state.nodeFlow = sumFlow(this.branch.nodes) / flowBefore;

            this.branch.links = accumulateLargest(this.branch.links, state.linkFlow);
            this.branch.links = connectedLinks(this.branch);
            this.branch.nodes = connectedNodes(this.branch);

            // Increase linkFlow if we filtered out all nodes.
            if (this.branch.nodes.length < 2 && state.linkFlow < 1) {
                state.linkFlow += 0.1 * (1 - state.linkFlow);
                this.clone().filterNewPath();
            }

            return this;
        },

        renderBranch() {
            render({
                nodes: this.branch.nodes,
                links: this.branch.links.sort(byFlow).reverse(),
                style: this.style,
                charge: state.charge,
                linkDistance: state.linkDistance,
                linkType: state.linkType,
            });
            return this;
        },

        update(path) {
            state.path = path;
            this.clone().filterNewPath().renderBranch();
        },
    };

    renderNotifier.attach(actions);

    const gui = new dat.GUI();
    gui.add(state, 'filename');

    const renderFolder = gui.addFolder('Rendering / simulation');
    renderFolder.add(state, 'linkDistance', 50, 500).step(25).onFinishChange(() => actions.renderBranch());
    renderFolder.add(state, 'charge', 0, 2000).step(100).onFinishChange(() => actions.renderBranch());
    renderFolder.open();

    const filteringFolder = gui.addFolder('Filtering');
    filteringFolder.add(state, 'nodeFlow', 0, 1).step(0.01).onFinishChange(() => actions.clone().filterGUI().renderBranch()).listen();
    filteringFolder.add(state, 'linkFlow', 0, 1).step(0.01).onFinishChange(() => actions.clone().filterGUI().renderBranch()).listen();
    filteringFolder.open();

    gui.add(state, 'path').onFinishChange(() => actions.clone().filterNewPath().renderBranch()).listen();

    actions.clone().filterNewPath().renderBranch();
}

Dropzone.options.myDropzone = {
    maxFiles: 1,
    acceptedFiles: '.ftree,.net',

    accept: (file) => {
        svg.append('g')
            .attr('transform', `translate(${window.innerWidth / 2}, ${window.innerHeight / 2}) rotate(-45)`)
            .append('path')
            .attr('class', 'move')
            .attr('d', 'M0,-25A25,25 0 0,1 25,0L20,0A20,20 0 0,0 0,-20Z')
            .style('fill', '#555555');

        d3.select('#my-dropzone').remove();

        parseFile(file)
            .then(parsed => runApplication(parsed, file))
            .catch(err => console.error(err));
    },
};
