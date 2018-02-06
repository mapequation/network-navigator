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

    let branch = tree.getNode(path.path).clone();

    const renderBranch = () => {
        render({
            nodes: branch.nodes,
            links: branch.links,
            charge: renderParams.charge,
            linkDistance: renderParams.linkDistance,
            linkType: renderParams.linkType,
        });
    };

    const filterRender = () => {
        branch = tree.getNode(path.path).clone();

        branch.nodes = accumulateLargest(branch.nodes, filtering.nodeFlow);
        branch.links = accumulateLargest(branch.links, filtering.linkFlow);
        branch.links = connectedLinks(branch);
        branch.nodes = connectedNodes(branch);

        renderBranch();
    };

    const gui = new dat.GUI();

    const renderFolder = gui.addFolder('Rendering / simulation');
    renderFolder.add(renderParams, 'linkDistance', 50, 500).step(25).onFinishChange(renderBranch);
    renderFolder.add(renderParams, 'charge', 0, 2000).step(100).onFinishChange(renderBranch);
    renderFolder.open();

    const filteringFolder = gui.addFolder('Filtering');
    filteringFolder.add(filtering, 'nodeFlow', 0, 1).step(0.01).onFinishChange(filterRender).listen();
    filteringFolder.add(filtering, 'linkFlow', 0, 1).step(0.01).onFinishChange(filterRender).listen();
    filteringFolder.open();

    gui.add(path, 'path').onFinishChange(() => {
        branch = tree.getNode(path.path).clone();

        const flowBefore = sumFlow(branch.nodes);
        branch.nodes = takeLargest(branch.nodes, 20);
        filtering.nodeFlow = sumFlow(branch.nodes) / flowBefore;

        branch.links = accumulateLargest(branch.links, filtering.linkFlow);
        branch.links = connectedLinks(branch);
        branch.nodes = connectedNodes(branch);

        renderBranch();
    });

    const flowBefore = sumFlow(branch.nodes);
    branch.nodes = takeLargest(branch.nodes, 20);
    filtering.nodeFlow = sumFlow(branch.nodes) / flowBefore;

    branch.links = accumulateLargest(branch.links, filtering.linkFlow);
    branch.links = connectedLinks(branch);
    branch.nodes = connectedNodes(branch);

    renderBranch();
}

fetch('data/stockholm.ftree')
//fetch('data/cities2011_3grams_directed.ftree')
//fetch('data/science2001.ftree')
    .then(res => res.text())
    .then(parseFile)
    .then(d => parseFTree(d.data))
    .then(runApplication)
    .catch(err => console.error(err));
