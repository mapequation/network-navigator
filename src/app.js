import { parseFile, partitionSections } from 'parser';
import render from 'render';

/**
 *
 * @param {Object} graph
 * @param {string|number[]} path
 * @return {Object}
 */
function getLevel(graph, path) {
    const subGraph = {
        nodes: [],
        links: [],
    };

    // TODO
    // Cases: path = 'root' or path == [1,1,...]

    graph.links.forEach((link) => {
        if (link.path === path) {
            subGraph.links = link.links;
        } else if (link.path.length === 1) {
            link.flow = 0;
            link.links.forEach((subLink) => {
                link.flow += subLink.flow;
            });
            subGraph.nodes.push(link);
        }
    });

    return subGraph;
}

function selectLargest(graph, num) {
    const selected = {
        nodes: [],
        links: [],
    };

    const byFlow = (n1, n2) => n2.flow - n1.flow;

    graph.nodes.forEach((node) => {
        selected.nodes.push(node);
        selected.nodes.sort(byFlow);

        if (selected.nodes.length > num) {
            selected.nodes.pop();
        }
    });

    // Only add links between the selected nodes
    graph.links.forEach((link) => {
        let source = false;
        let target = false;

        selected.nodes.forEach((node) => {
            if (!source && link.source === node.path[0]) {
                source = true;
            }
            if (!target && link.target === node.path[0]) {
                target = true;
            }
        });

        if (source && target) {
            selected.links.push(link);
        }
    });

    return selected;
}

function renderLargest(data, num) {
    const level = getLevel(data.data, 'root');
    const largest = selectLargest(level, num);
    render(largest, data.meta.linkType);
}

fetch('data/cities2011_3grams_directed.ftree')
    .then(res => res.text())
    .then(parseFile)
    .then(d => partitionSections(d.data))
    .then(d => renderLargest(d, 20))
    .catch(err => console.error(err));
