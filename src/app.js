import * as d3 from 'd3';
import dat from 'dat.gui';
import parseFile from 'parse';
import { parseFTree, createTree } from 'file-formats/ftree';
import render from 'render';
import {
    sumFlow,
    takeLargest,
    accumulateLargest,
    connectedNodes,
    connectedLinks,
} from 'filter';

function runApplication(ftree) {
    const tree = createTree({
        treeData: ftree.data.tree,
        linkData: ftree.data.links,
    });

    const filtering = {
        nodeFlow: 0.2,
        linkFlow: 0.8,
    };

    const path = {
        path: 'root',
    };

    const renderParams = {
        linkDistance: 200,
        charge: 500,
        linkType: ftree.meta.linkType,
    };

    const actions = {
        branch: tree.getNode(path.path).clone(),

        clone() {
            this.branch = tree.getNode(path.path).clone();
            return this;
        },

        filterGUI() {
            this.branch.nodes = accumulateLargest(this.branch.nodes, filtering.nodeFlow);
            this.branch.links = accumulateLargest(this.branch.links, filtering.linkFlow);
            this.branch.links = connectedLinks(this.branch);
            this.branch.nodes = connectedNodes(this.branch);
            return this;
        },

        filterNewPath() {
            const flowBefore = sumFlow(this.branch.nodes);
            this.branch.nodes = takeLargest(this.branch.nodes, 20);
            filtering.nodeFlow = sumFlow(this.branch.nodes) / flowBefore;

            this.branch.links = accumulateLargest(this.branch.links, filtering.linkFlow);
            this.branch.links = connectedLinks(this.branch);
            this.branch.nodes = connectedNodes(this.branch);
            return this;
        },

        renderBranch() {
            const parent = d3.select('#id-root');

            render({
                parent,
                nodes: this.branch.nodes,
                links: this.branch.links,
                charge: renderParams.charge,
                linkDistance: renderParams.linkDistance,
                linkType: renderParams.linkType,
            });
            return this;
        },
    };

    const gui = new dat.GUI();

    const renderFolder = gui.addFolder('Rendering / simulation');
    renderFolder.add(renderParams, 'linkDistance', 50, 500).step(25).onFinishChange(actions.renderBranch);
    renderFolder.add(renderParams, 'charge', 0, 2000).step(100).onFinishChange(actions.renderBranch);
    renderFolder.open();

    const filteringFolder = gui.addFolder('Filtering');
    filteringFolder.add(filtering, 'nodeFlow', 0, 1).step(0.01).onFinishChange(() => actions.clone().filterGUI().renderBranch()).listen();
    filteringFolder.add(filtering, 'linkFlow', 0, 1).step(0.01).onFinishChange(() => actions.clone().filterGUI().renderBranch()).listen();
    filteringFolder.open();

    gui.add(path, 'path').onFinishChange(() => actions.clone().filterNewPath().renderBranch());

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
