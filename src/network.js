import Module from 'module';
import Node from 'node';
import Link from 'link';
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

        this.connected = false;
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
     * Get the child node that matches the path.
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
     * Connect the network.
     *
     * This means that link sources and targets gets replaced
     * from node ids to node refs.
     *
     * This only makes sense as a single run operation that should
     * be performed after the network is populated with links and nodes.
     */
    connect() {
        if (this.connected) {
            return;
        }

        this.connected = true;

        for (let node of this.traverse()) {
            if (node.hasChildren) {
                node.links = node.links.map(link =>
                    new Link(node.getNode(link.source), node.getNode(link.target), link.flow));
            }
        }
    }
}
