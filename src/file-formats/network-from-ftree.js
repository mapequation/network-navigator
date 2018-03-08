/**
 * @file This file deals with creating a Network from FTree data.
 * The FTree data is typically generated from the function parseFTree.
 *
 * @see parseFTree
 * @see Network
 *
 * @author Anton Eriksson
 */

import { Network, Module, Node } from 'network';
import Link from 'link';
import TreePath from 'treepath';


/**
 * Create tree of networks from FTree data.
 *
 * @param {Object} params
 * @param {Object[]} params.modules
 * @param {Object[]} params.tree
 * @param {Object[]} params.link
 * @return {Network}
 */
export default function networkFromFTree({ modules, tree, links }) {
    const root = new Network();

    // Create the tree structure
    links.forEach((node) => {
        // Get root node links
        if (node.path === root.path.toString()) {
            root.links = node.links.map(Link.fromObject);

        // For all other nodes
        } else {
            const childNode = TreePath.toArray(node.path)
                .reduce((pathNode, childId) => {
                    let child = pathNode.getNode(childId);
                    if (!child) {
                        child = new Module(childId);
                        pathNode.addNode(child);
                    }
                    return child;
                }, root);

            childNode.exitFlow = node.exitFlow;
            childNode.links = node.links.map(Link.fromObject);
        }
    });

    // Add the actual nodes
    tree.forEach((node) => {
        const path = TreePath.toArray(node.path);

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

    // Add module names
    modules.forEach((mod) => {
        const node = root.getNodeByPath(mod.path);
        node.name = mod.name;
    });

    root.connect();

    return root;
}
