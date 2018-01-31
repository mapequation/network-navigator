import * as d3 from 'd3';
import dat from 'dat.gui';
import render from 'render';
import { parseFile, parseFTree, createTree } from 'parser';
import { lumpNodes, pruneLinks } from 'transform';


function renderTree(tree) {
    console.log(tree);

    const filtering = {
        lumpFactor: 0.2,
        pruneFactor: 0.2,
    };

    const path = {
        path: 'root',
    };

    const renderParams = {
        renderLump: false,
        linkDistance: 100,
        charge: 500,
    };

    const renderBranch = () => {
        d3.select('svg').selectAll('*').remove();
        const branch = tree.getNode(path.path).clone();
        lumpNodes(branch, filtering.lumpFactor);
        pruneLinks(branch.links, filtering.pruneFactor);
        render(branch, renderParams);
    };

    const gui = new dat.GUI();

    const renderFolder = gui.addFolder('Rendering / simulation');
    renderFolder.add(renderParams, 'linkDistance', 50, 500).step(25).onFinishChange(renderBranch);
    renderFolder.add(renderParams, 'charge', 0, 2000).step(100).onFinishChange(renderBranch);
    renderFolder.open();

    const filteringFolder = gui.addFolder('Filtering');
    filteringFolder.add(renderParams, 'renderLump').onChange(renderBranch);
    filteringFolder.add(filtering, 'lumpFactor', 0, 1).step(0.05).onFinishChange(renderBranch);
    filteringFolder.add(filtering, 'pruneFactor', 0, 1).step(0.05).onFinishChange(renderBranch);
    filteringFolder.open();

    gui.add(path, 'path').onFinishChange(renderBranch);

    renderBranch();
}

fetch('data/stockholm.ftree')
    .then(res => res.text())
    .then(parseFile)
    .then(d => parseFTree(d.data))
    .then(d => createTree(d.data.tree, d.data.links))
    .then(renderTree)
    .catch(err => console.error(err));
