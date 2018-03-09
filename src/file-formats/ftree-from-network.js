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

import SerializeVisitor from 'serializevisitor';
import { byFlow } from '../filter';

/**
 * Serialize Network to FTree string.
 *
 * @param {Network} network
 * @param {boolean} directed
 */
export default function ftreeFromNetwork(network, directed = true) {
    const moduleSerializer = new SerializeVisitor(node =>
        (node.hasChildren && node.path.toString() !== 'root'
            ? `${node.path} ${node.flow} "${node.name}" ${node.exitFlow}\n`
            : ''));

    const nodeSerializer = new SerializeVisitor(node =>
        (!node.hasChildren
            ? `${node.path} ${node.flow} "${node.name}" ${node.id}\n`
            : ''));

    const linkSerializer = new SerializeVisitor((node) => {
        if (!node.hasChildren) return '';
        let result = `*Links ${node.path} ${node.exitFlow} ${node.links.length} ${node.nodes.length}\n`;
        result += node.links
            .sort(byFlow)
            .reduce((str, link) => `${str}${link}\n`, '');
        return result;
    });

    network.accept(moduleSerializer);
    network.accept(nodeSerializer);
    network.accept(linkSerializer);

    return [
        '*Modules\n',
        '# path flow name exitFlow\n',
        moduleSerializer,
        '*Nodes\n',
        '# path flow name node\n',
        nodeSerializer,
        `*Links ${directed ? 'directed' : 'undirected'}\n`,
        '#*Links path exitFlow numEdges numChildren\n',
        linkSerializer,
    ].join('');
}
