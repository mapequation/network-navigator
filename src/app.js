import render from 'render';
import { parseFile, parseFTree, createTree } from 'parser';

fetch('data/cities2011_3grams_directed.ftree')
    .then(res => res.text())
    .then(parseFile)
    .then(d => parseFTree(d.data))
    .then(d => createTree(d.data.tree, d.data.links))
    .then(tree => render(tree.root.getChild(2)))
    .catch(err => console.error(err));
