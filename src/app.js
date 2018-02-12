import * as d3 from 'd3';
import dat from 'dat.gui';
import parseFile from 'parse';
import parseFTree, { treePathToArray } from 'file-formats/ftree';
import networkFromFTree from 'file-formats/network-from-ftree';
import makeRenderFunction from 'render';
import makeNetworkStyle from 'network-style';
import Observable from 'observable';
import {
    sumFlow,
    takeLargest,
    accumulateLargest,
    connectedNodes,
    connectedLinks,
} from 'filter';


function runApplication(ftree) {
    const network = networkFromFTree(ftree.data);

    const state = {
        nodeFlow: 0.2,
        linkFlow: 0.8,
        path: 'root',
        linkDistance: 200,
        charge: 500,
        linkType: ftree.meta.linkType,
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
                links: this.branch.links,
                style: this.style || makeNetworkStyle(this.branch),
                charge: state.charge,
                linkDistance: state.linkDistance,
                linkType: state.linkType,
            });
            return this;
        },

        update(node) {
            if (node === 'parent' && state.path === 'root')
                return;

            if (node === 'parent') {
                const p = treePathToArray(state.path);
                if (p.length === 1) {
                    state.path = 'root';
                } else {
                    p.pop()
                    state.path = p.join(':');
                }
            } else {
                state.path = node.path;
            }

            this.clone().filterNewPath().renderBranch();
        },
    };

    renderNotifier.attach(actions);

    const gui = new dat.GUI();

    const renderFolder = gui.addFolder('Rendering / simulation');
    renderFolder.add(state, 'linkDistance', 50, 500).step(25).onFinishChange(() => actions.renderBranch());
    renderFolder.add(state, 'charge', 0, 2000).step(100).onFinishChange(() => actions.renderBranch());
    renderFolder.open();

    const filteringFolder = gui.addFolder('Filtering');
    filteringFolder.add(state, 'nodeFlow', 0, 1).step(0.01).onFinishChange(() => actions.clone().filterGUI().renderBranch()).listen();
    filteringFolder.add(state, 'linkFlow', 0, 1).step(0.01).onFinishChange(() => actions.clone().filterGUI().renderBranch()).listen();
    filteringFolder.open();

    gui.add(state, 'path').onFinishChange(() => actions.clone().filterNewPath().renderBranch()).listen();

    actions.filterNewPath().renderBranch();
}

fetch('data/stockholm.ftree')
//fetch('data/cities2011_3grams_directed.ftree')
//fetch('data/science2001.ftree')
    .then(res => res.text())
    .then(parseFile)
    .then(d => parseFTree(d.data))
    .then(runApplication)
    .catch(err => console.error(err));
