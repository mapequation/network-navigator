import { processFile, partitionSections } from 'parser';
import render from 'render';

function gatherRootLevel(data) {
    const rootLevel = {
        nodes: [],
        links: [],
    };

    data.links.forEach((link) => {
        if (link.path === 'root') {
            rootLevel.links = link.links;
        } else if (link.path.length === 1) {
            link.flow = 0;
            link.links.forEach((subLink) => {
                link.flow += subLink.flow;
            });
            rootLevel.nodes.push(link);
        }
    });

    const NUM = 8;

    const largest = {
        nodes: [],
        links: [],
    };

    const byFlow = (n1, n2) => n2.flow - n1.flow;

    // Collect the NUM nodes with largest flow
    rootLevel.nodes.forEach((node) => {
        largest.nodes.push(node);
        largest.nodes.sort(byFlow);

        if (largest.nodes.length > NUM) {
            largest.nodes.pop();
        }
    });

    // Only add links between the largest nodes
    rootLevel.links.forEach((link) => {
        let source = false;
        let target = false;

        largest.nodes.forEach((node) => {
            if (!source && link.source === node.path[0]) {
                source = true;
            }
            if (!target && link.target === node.path[0]) {
                target = true;
            }
        });

        if (source && target) {
            largest.links.push(link);
        }
    });

    return largest;
}

fetch('data/stockholm.ftree')
    .then(res => res.text())
    .then(processFile)
    .then(d => partitionSections(d.data))
    .then(d => gatherRootLevel(d.data))
    .then(render)
    .catch(err => console.error(err));
