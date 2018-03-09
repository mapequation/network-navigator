/**
 * @file This file deals with converting a Network to the
 * [FTree format]{@link http://www.mapequation.org/code.html#FTree-format}
 * as a string.
 *
 * The format is extended to allow for module names.
 *
 * @see parseFTree
 * @see Network
 * @see networkFromFTree
 *
 * @author Anton Eriksson
 */

import { byFlow } from '../filter';

/**
 * Serialize Network to FTree string.
 *
 * @param {Network} network
 * @param {boolean} directed
 */
export default function ftreeFromNetwork(network, directed = true) {
    const modules = [
        ['*Modules', 0],
        '# path flow name exitFlow',
        '',
    ];
    const nodes = [
        ['*Nodes', 0],
        '# path flow name node',
        '',
    ];
    const links = [
        `*Links ${directed ? 'directed' : 'undirected'}`,
        '#*Links path exitFlow numEdges numChildren',
        '',
    ];

    const serializeModule = node =>
        `${node.path} ${node.flow} "${node.name}" ${node.exitFlow}\n`;

    const serializeLinks = (node) => {
        const { path, exitFlow } = node;
        let result = `*Links ${path} ${exitFlow} ${node.links.length} ${node.nodes.length}\n`;
        result += node.links
            .sort(byFlow)
            .reduce((str, link) => `${str}${link.toString()}\n`, '');
        return result;
    };

    const unorderedModules = [];

    // Get all modules
    network.traverse((node) => {
        if (node.hasChildren) {
            modules[0][1]++;
            unorderedModules.push(node);
        }
    });

    unorderedModules
        .sort(byFlow)
        .forEach((node) => {
            if (node.path.toString() !== 'root') {
                modules[2] += serializeModule(node);
            }
            links[2] += serializeLinks(node);
        });

    // Get all nodes
    nodes[2] = network
        .flatten()
        .sort(byFlow)
        .reduce((str, node) => {
            nodes[0][1]++;
            return `${str}${node.path} ${node.flow} "${node.name}" ${node.id}\n`;
        }, '');

    modules[0] = modules[0].join(' ');
    nodes[0] = nodes[0].join(' ');

    return [
        modules.join('\n'),
        nodes.join('\n'),
        links.join('\n'),
    ].join('');
}
