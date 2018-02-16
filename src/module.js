import PriorityQueue from 'priority-queue';
import TreePath from 'treepath';
import { byFlow } from 'filter';

/**
 * Class to represent a Module of nodes and links.
 *
 * @author Anton Eriksson
 */
export default class Module {
    /**
     * Construct a Module
     *
     * @param {number|string} id the id
     */
    constructor(id) {
        this.id = id;
        this.path = new TreePath(id);
        this.parent = null;
        this._name = null;
        this.largest = new PriorityQueue(byFlow, 4);
        this.flow = 0;
        this.exitFlow = 0;
        this._nodes = new Map();
        this.links = [];
    }

    /**
     * Add a node
     *
     * @param {Module|Node} node the node to add
     */
    addNode(node) {
        node.parent = this;
        node.path = TreePath.join(this.path, node.id);
        this._nodes.set(node.id, node);
    }

    /**
     * Get the node with a certain id
     *
     * @param {number|string} id the id of the node
     * @return {?(Module|Node)} the node
     */
    getNode(id) {
        return this._nodes.get(id);
    }

    /**
     * Get an array of all nodes.
     *
     * @return {Module[]|Node[]} the nodes
     */
    get nodes() {
        return Array.from(this._nodes.values());
    }

    /**
     * Replace all nodes
     *
     * @param {Module[]|Node[]} nodes the nodes
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
     * Deep clone
     *
     * @return {Module} the clone
     */
    clone() {
        const clone = new Module(this.id);

        clone.path = this.path;
        clone.parent = this.parent;
        clone.name = this.name;
        clone.largest = this.largest;
        clone.flow = this.flow;
        clone.exitFlow = this.exitFlow;

        this.nodes.forEach(node => clone.addNode(node.clone()));

        this.links.forEach(link => clone.links.push({
            source: link.source,
            target: link.target,
            flow: link.flow,
        }));

        return clone;
    }
}
