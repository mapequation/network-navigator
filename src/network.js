import Module from 'module';
import Node from 'node';
import TreePath from 'treepath';

/**
 * Class to represent a network of links and nodes.
 *
 * @see NetworkBuilder
 * @see Module
 * @see Node
 *
 * @author Anton Eriksson
 */
export class Network {
    /**
     * Construct a new Network
     *
     * @param {boolean} [directed=true] directedness of network
     */
    constructor(directed = true) {
        this.root = new Module('root');
        this.directed = directed;
    }

    /**
     * Get the child node that matches the path.
     *
     * @param {string} path the path formatted like "1:2:3"
     * @return {?(Module|Node)} the node
     */
    getNodeByPath(path) {
        if (path.toString() === this.root.path.toString()) {
            return this.root;
        }

        return TreePath.toArray(path)
            .reduce((pathNode, id) => (pathNode ? pathNode.getNode(id) : null), this.root);
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
     * Traverse Network depth first.
     *
     * @see Module#traverseDepthFirst
     */
    traverseDepthFirst() {
        return this.root.traverseDepthFirst();
    }

    /**
     * Traverse Network breadth first.
     *
     * @see Module#traverseBreadthFirst
     */
    traverseBreadthFirst() {
        return this.root.traverseBreadthFirst();
    }
}


/**
 * Helper class to construct Networks
 *
 * @see Network
 */
export default class NetworkBuilder {
    /**
     * Construct a NetworkBuilder
     *
     * @param {boolean} [directed=true] directedness of returned Network
     */
    constructor(directed = true) {
        this.network = new Network(directed);
        this.connected = false;
    }

    /**
     * Construct a network from ftree data
     *
     * @see parseFTree
     *
     * @param {Object} ftree
     * @return {Network} the constructed network
     */
    static fromFTree(ftree) {
        const { tree, links } = ftree.data;
        const builder = new NetworkBuilder(ftree.meta.directed);

        // Create the tree structure
        links.forEach(node => builder.addModule(node));

        // Add the actual nodes
        tree.forEach(node => builder.addNode(node));

        return builder.getNetwork();
    }

    /**
     * Add a Module to the Network
     *
     * @param {Object} node the node representing the module
     * @param {number|string} node.path the path
     * @param {number} node.exitFlow the exit flow
     * @param {string} [node.name] the node name
     * @param {Object[]} node.links the links
     */
    addModule(node) {
        if (node.path === 'root') {
            this.network.root.links = node.links;
            return;
        }

        const childNode = TreePath.toArray(node.path)
            .reduce((pathNode, childId) => {
                let child = pathNode.getNode(childId);
                if (!child) {
                    child = new Module(childId);
                    pathNode.addNode(child);
                }
                return child;
            }, this.network.root);

        if (node.name) {
            childNode.name = node.name;
        }
        childNode.exitFlow = node.exitFlow;
        childNode.links = node.links;
    }

    /**
     * Add a Node to the Network
     *
     * @param {Object} node the node
     * @param {number|string} node.path the path
     * @param {number} node.flow the flow
     * @param {string} node.name the name
     * @param {number} node.node the physical id
     *
     */
    addNode(node) {
        const path = TreePath.toArray(node.path);
        const childNode = new Node(path.pop(), node.name, node.flow, node.node);

        const parent = path
            .reduce((pathNode, childId) => {
                pathNode.flow += node.flow;
                pathNode.largest.push(childNode);
                return pathNode.getNode(childId);
            }, this.network.root);

        parent.flow += node.flow;
        parent.largest.push(childNode);
        parent.addNode(childNode);
    }

    /**
     * Get the constructed Network
     *
     * @return {Network} the network
     */
    getNetwork() {
        if (!this.connected) {
            this.connected = true;

            for (let node of this.network.traverseDepthFirst()) {
                if (node.links) {
                    node.links = node.links.map(link => ({
                        source: node.getNode(link.source),
                        target: node.getNode(link.target),
                        flow: link.flow
                    }));

                    node.links.forEach((link) => {
                        link.source.outLinks.push(link);
                        link.target.inLinks.push(link);
                    });
                }
            }
        }

        return this.network;
    }
}
