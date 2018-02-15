import PriorityQueue from 'priority-queue';
import { byFlow } from 'filter';

/**
 * Class to represent a network of nodes and links.
 *
 * @author Anton Eriksson
 */
export default class Network {
    /**
     * Construct a Network
     *
     * @param {number|string} id the id of the network
     */
    constructor(id) {
        this.id = id;
        this.path = null;
        this.parent = null;
        this._name = null;
        this.largest = new PriorityQueue(byFlow, 4);
        this.flow = 0;
        this.exitFlow = 0;
        this._nodes = new Map();
        this.links = [];
    }

    /**
     * Construct a new node
     *
     * @param {number|string} id the id that the newly constructed node should have
     * @return {Network} the constructed node
     */
    createNode(id) {
        const node = new Network(id);
        this.addNode(node);
        return node;
    }

    /**
     * Add a node to this network
     *
     * @param {Object} node the node to add
     */
    addNode(node) {
        node.parent = this;
        node.path = this.path === 'root' ? node.id.toString() : [this.path, node.id].join(':');
        this._nodes.set(node.id, node);
    }

    /**
     * Get the node with a certain id
     *
     * @param {number|string} id the id of the node
     * @return {?Network} the node
     */
    getNode(id) {
        return this._nodes.get(id);
    }

    /**
     * Recursively search network for the child node that matches the path.
     *
     * @param {string} path the path formatted like "1:2:3"
     * @return {?Network} the node
     */
    getNodeByPath(path) {
        if (path === this.path) {
            return this;
        }

        return path
            .split(':')
            .map(Number)
            .reduce((pathNode, childId) => (pathNode ? pathNode.getNode(childId) : null), this);
    }

    /**
     * Get an array of all nodes.
     *
     * @return {Object[]} the nodes
     */
    get nodes() {
        return Array.from(this._nodes.values());
    }

    /**
     * Replace all nodes in this network.
     *
     * @param {Object[]} nodes the nodes
     */
    set nodes(nodes) {
        this._nodes.clear();
        nodes.forEach(child => this.addNode(child));
    }

    /**
     * Get the name
     *
     * @return {string}
     */
    get name() {
        if (this._name) {
            return this._name;
        } else if (this.largest.length) {
            return this.largest
                .map(item => item.name)
                .join(', ');
        }
        return this.id;
    }

    /**
     * Set the name
     *
     * @param {string} name the name
     */
    set name(name) {
        this._name = name;
    }

    /**
     * Deep clone this Network
     *
     * @return {Network} the clone
     */
    clone() {
        const clone = new Network(this.id);

        clone.path = this.path;
        clone.parent = this.parent;
        clone.name = this.name;
        clone.largest = this.largest;
        clone.flow = this.flow;
        clone.exitFlow = this.exitFlow;

        this.nodes.forEach((childNode) => {
            clone.addNode(childNode.clone());
        });

        this.links.forEach((link) => {
            clone.links.push({
                source: link.source,
                target: link.target,
                flow: link.flow,
            });
        });

        return clone;
    }
}
