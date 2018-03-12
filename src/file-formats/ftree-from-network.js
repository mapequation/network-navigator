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

export function flowFormat(flow) {
    if (flow < 1e-4 && flow > Number.EPSILON) {
        let [significand, exponent] = flow
            .toExponential()
            .split('e');

        const abs = Math.abs(Number(exponent));
        if (abs < 10) {
            const sign = Math.sign(Number(exponent)) < 0 ? '-' : '+';
            exponent = `${sign}0${abs}`;
        }

        return [
            significand.substr(0, Math.min(significand.length + 2, 7)),
            exponent,
        ].join('e');
    } else if (flow < 10 && flow.toString().length > 11) {
        return flow.toFixed(9);
    }

    return flow.toString();
}

/**
 * Serialize Network to FTree string.
 *
 * @param {Network} network
 */
export default function ftreeFromNetwork(network) {
    let modules = '';
    let nodes = '';
    let links = '';

    for (let node of network.traverseBreadthFirst()) {
        if (node.hasChildren) {
            if (node.path.toString() !== 'root') {
                modules += `${node.path} ${flowFormat(node.flow)} "${node.name}" ${flowFormat(node.exitFlow)}\n`;
            }
        }
    }

    for (let node of network.traverseDepthFirst()) {
        if (!node.hasChildren) {
            nodes += `${node.path} ${flowFormat(node.flow)} "${node.name}" ${node.physicalId}\n`;
        } else {
            links += `*Links ${node.path} ${flowFormat(node.exitFlow)} ${node.links.length} ${node.nodes.length}\n`;
            for (let link of node.links.sort(byFlow)) {
                links += `${link.source.id} ${link.target.id} ${flowFormat(link.flow)}\n`;
            }
        }
    }

    return [
        '*Modules\n',
        '# path flow name exitFlow\n',
        modules,
        '*Nodes\n',
        '# path flow name node\n',
        nodes,
        `*Links ${network.directed ? 'directed' : 'undirected'}\n`,
        '#*Links path exitFlow numEdges numChildren\n',
        links,
    ].join('');
}
