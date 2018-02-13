/**
 * @file This file deals with creating a tree of Networks from FTree data.
 * The FTree data is typically generated from the function parseFTree.
 *
 * @see parseFTree
 *
 * @author Anton Eriksson
 */

import Network from 'network';


/**
 * Create tree of networks from FTree data.
 *
 * @param {Object} params
 * @param {Object[]} params.tree
 * @param {Object[]} params.link
 * @return {Network}
 */
export default function networkFromFTree({ tree, links }) {
    const root = new Network('root');
    root.path = 'root';

    // Create the tree structure
    links.forEach((node) => {
        // Get root node links
        if (node.path === 'root') {
            root.links = node.links;

        // For all other nodes
        } else {
            const childNode = node.path
                .split(':')
                .map(Number)
                .reduce((pathNode, childId) => pathNode.getNode(childId) || pathNode.createNode(childId), root);

            childNode.path = node.path;
            childNode.exitFlow = node.exitFlow;
            childNode.links = node.links;
        }
    });

    // Add the actual nodes
    tree.forEach((node) => {
        const childNode = node.path
            .split(':')
            .map(Number)
            .reduce((pathNode, childId) => {
                pathNode.flow += node.flow;
                pathNode.largest.push(node);
                return pathNode.getNode(childId) || pathNode.createNode(childId);
            }, root);

        childNode.path = node.path;
        childNode.flow = node.flow;
        childNode.name = node.name;
    });

    return root;
}
