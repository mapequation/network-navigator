/**
 * @file This file deals with creating a tree of Networks from FTree data.
 * The FTree data is typically generated from the function parseFTree.
 *
 * @see parseFTree
 *
 * @author Anton Eriksson
 */

import Network from 'network';
import Module from 'module';
import Node from 'node';


/**
 * Create tree of networks from FTree data.
 *
 * @param {Object} params
 * @param {Object[]} params.tree
 * @param {Object[]} params.link
 * @return {Network}
 */
export default function networkFromFTree({ tree, links }) {
    const root = new Network();

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
                .reduce((pathNode, childId) => {
                    let child = pathNode.getNode(childId);
                    if (!child) {
                        child = new Module(childId);
                        pathNode.addNode(child);
                    }
                    return child;
                }, root);

            childNode.exitFlow = node.exitFlow;
            childNode.links = node.links;
        }
    });

    // Add the actual nodes
    tree.forEach((node) => {
        const path = node.path
            .split(':')
            .map(Number);

        const parent = path
            .slice(0, -1)
            .reduce((pathNode, childId) => {
                pathNode.flow += node.flow;
                pathNode.largest.push(node);
                return pathNode.getNode(childId);
            }, root);

        parent.flow += node.flow;
        parent.largest.push(node);

        parent.addNode(new Node(path.pop(), node.name, node.flow));
    });

    return root;
}
