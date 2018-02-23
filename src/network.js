import Module from 'module';
import Node from 'node';
import TreePath from 'treepath';

export { Module, Node };

/**
 * Class to represent a network of links and nodes.
 * This is used as the top level in a multi-level network.
 *
 * @see Module
 * @see Node
 *
 * @author Anton Eriksson
 */
export class Network extends Module {
    /**
     * Construct a new Network
     */
    constructor() {
        super('root');
    }

    /**
     * Add a node
     *
     * @param {Module|Node} node the node
     */
    addNode(node) {
        node.parent = this;
        this._nodes.set(node.id, node);
    }

    /**
     * Recursively search for the child node that matches the path.
     *
     * @param {string} path the path formatted like "1:2:3"
     * @return {?(Module|Node)} the node
     */
    getNodeByPath(path) {
        if (path.toString() === this.path.toString()) {
            return this;
        }

        return TreePath.toArray(path)
            .reduce((pathNode, childId) => (pathNode ? pathNode.getNode(childId) : null), this);
    }

    /**
     * Traverse network depth first, invoking callback with each node.
     *
     * @param {*} callback the callback gets invoked with each node
     */
    traverse(callback) {
        const queue = [this];
        while (queue.length) {
            const node = queue.pop();
            callback(node);
            if (node.nodes) queue.push(...node.nodes);
        }
    }
}
