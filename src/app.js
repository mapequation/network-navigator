import * as d3 from 'd3';
import dat from 'dat.gui';
import parseFile from 'parse';
import { parseFTree, createTree } from 'file-formats/ftree';
import render from 'render';
import {
    autoFilter,
    filterNodes,
    filterLinks,
    filterDisconnectedNodes,
    filterDanglingLinks,
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
            nodes: branch.children,
            links: branch.links,
            charge: renderParams.charge,
            linkDistance: renderParams.linkDistance,
            linkType: renderParams.linkType,
        });
    };

    const filterRender = () => {
        branch = tree.getNode(path.path).clone();

        filterNodes(branch, filtering.nodeFlow);
        filterLinks(branch.links, filtering.linkFlow);

        filterDisconnectedNodes(branch);
        filterDanglingLinks(branch);

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

        filtering.nodeFlow = autoFilter(branch, 20);
        filterLinks(branch.links, filtering.linkFlow);
        filterDisconnectedNodes(branch);

        renderBranch();
    });

    filtering.nodeFlow = autoFilter(branch, 20);
    filterLinks(branch.links, filtering.linkFlow);
    filterDisconnectedNodes(branch);

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
