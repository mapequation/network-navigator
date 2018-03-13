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
import TreePath from 'treepath';


/**
 * Create tree of networks from FTree data.
 *
 * @param {Object} ftree
 * @param {Object[]} ftree.modules
 * @param {Object[]} ftree.tree
 * @param {Object[]} ftree.links
 * @return {Network}
 */
export default function networkFromFTree(ftree) {
    const { modules, tree, links } = ftree.data;
    const root = new Network(ftree.meta.directed);

    // Create the tree structure
    links.forEach((node) => {
        // Get root node links
        if (node.path === root.path.toString()) {
            root.links = node.links;

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
            childNode.links = node.links;
        }
    });

    // Add the actual nodes
    tree.forEach((node) => {
        const path = TreePath.toArray(node.path);
        const childNode = new Node(path.pop(), node.name, node.flow, node.node);

        const parent = path
            .reduce((pathNode, childId) => {
                pathNode.flow += node.flow;
                pathNode.largest.push(childNode);
                return pathNode.getNode(childId);
            }, root);

        parent.flow += node.flow;
        parent.largest.push(childNode);
        parent.addNode(childNode);
    });

    // Add module names
    modules.forEach((mod) => {
        const node = root.getNodeByPath(mod.path);
        node.name = mod.name;
    });

    root.connect();

    return root;
}
