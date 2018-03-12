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
     *
     * @param {boolean} [directed=true] directedness of network
     */
    constructor(directed = true) {
        super('root');

        this.directed = directed;
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
        return Array.from(this.nodesAlongPath(path)).pop();
    }

    /**
     * Yield all nodes along path, starting with this.
     * Yields null if no node could be found.
     *
     * @param {string} path the path
     * @yields {?(Module|Node)} the nodes
     */
    * nodesAlongPath(path) {
        let pathNode = this;
        yield pathNode;

        if (path.toString() === this.path.toString()) {
            return;
        }

        for (let step of TreePath.toArray(path)) {
            // Nodes might not have the getNode method or might be null.
            yield pathNode = (pathNode && pathNode.getNode)
                ? pathNode.getNode(step)
                : null;
        }
    }

    /**
     * Get the max node flow of the network.
     *
     * @return {number} the flow
     */
    get maxNodeFlow() {
        let max = 0;
        for (let node of this.traverseDepthFirst()) {
            max = Math.max(max, node.flow);
        }
        return max;
    }

    /**
     * Get the max link flow of the network.
     *
     * @return {number} the flow
     */
    get maxLinkFlow() {
        let max = 0;
        for (let node of this.traverseDepthFirst()) {
            if (node.links) {
                max = Math.max(max, node.links.map(n => n.flow).reduce((a, b) => Math.max(a, b), 0));
            }
        }
        return max;
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

        for (let node of this.traverseDepthFirst()) {
            if (node.links) {
                node.links = node.links.map(link =>
                    new Link(node.getNode(link.source), node.getNode(link.target), link.flow));
            }
        }
    }
}
