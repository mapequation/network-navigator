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
 * @param {Object} opts
 * @param {Object[]} opts.treeData
 * @param {Object[]} opts.linkData
 * @return {Network}
 */
export default function networkFromFTree({ treeData, linkData }) {
    const root = new Network('root');
    root.path = 'root';

    linkData.forEach((node) => {
        // Get root node links
        if (node.path === 'root') {
            root.links = node.links;

        // For all other nodes
        } else {
            const childNode = node.path
                .reduce((pathNode, childId) => pathNode.getNode(childId) || pathNode.createNode(childId), root);

            childNode.path = node.path.join(':');
            childNode.exitFlow = node.exitFlow;
            childNode.links = node.links;
        }
    });

    treeData.forEach((node) => {
        const childNode = node.path
            .reduce((pathNode, childId) => {
                pathNode.flow += node.flow;
                return pathNode.getNode(childId) || pathNode.createNode(childId);
            }, root);

        childNode.path = node.path.join(':');
        childNode.flow = node.flow;
        childNode.name = node.name;
    });

    return root;
}
