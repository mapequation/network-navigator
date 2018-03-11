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
    let modules = '';
    let nodes = '';
    let links = '';

    for (let node of network.traverse()) {
        if (node.hasChildren) {
            if (node.path.toString() !== 'root') {
                modules += `${node.path} ${node.flow} "${node.name}" ${node.exitFlow}\n`;
            }
            links += `*Links ${node.path} ${node.exitFlow} ${node.links.length} ${node.nodes.length}\n`;
            links += node.links
                .sort(byFlow)
                .reduce((str, link) => `${str}${link}\n`, '');
        } else {
            nodes += `${node.path} ${node.flow} "${node.name}" ${node.id}\n`;
        }
    }

    return [
        '*Modules\n',
        '# path flow name exitFlow\n',
        modules,
        '*Nodes\n',
        '# path flow name node\n',
        nodes,
        `*Links ${directed ? 'directed' : 'undirected'}\n`,
        '#*Links path exitFlow numEdges numChildren\n',
        links,
    ].join('');
}
