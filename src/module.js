import PriorityQueue from 'priority-queue';
import TreePath from 'treepath';
import { byFlow } from 'filter';
import State from 'state';


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
        this.state = new State();
        this.shouldRender = true;
    }

    accept(visitor) {
        visitor.visit(this);
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
     * Does this module have children?
     *
     * @return {boolean} true if there are children
     */
    get hasChildren() {
        return this.nodes.length;
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
     * @return {string}
     */
    toString() {
        return this.name;
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

    /**
     * Search network depth first, invoking callback for each node
     * that satisfies predicate.
     *
     * @see Module#traverse
     *
     * @param {Function} predicate
     * @param {Function} callback
     */
    search(predicate, callback) {
        this.traverse((node) => {
            if (predicate(node)) {
                callback(node);
            }
        });
    }

    /**
     * Return all nodes depth first which matches predicate.
     *
     * @param {Function} predicate
     * @return {Array} the matches
     */
    filter(predicate) {
        const matches = [];

        this.traverse((node) => {
            if (predicate(node)) {
                matches.push(node);
            }
        });

        return matches;
    }

    /**
     * Get all leaf nodes.
     *
     * @return {Node[]} the leaf nodes
     */
    flatten() {
        return this.filter(node => !node.hasChildren);
    }

    /**
     * Get adjacency matrix
     *
     * @return {number[][]} adjacency matrix
     */
    asMatrix() {
        const N = this.nodes.length;
        const matrix = [];
        for (let i = 0; i < N; i++)
            matrix.push(Array(N).fill(0));

        const index = node => this.nodes.indexOf(node);

        this.links.forEach((link) => {
            const row = index(link.source);
            const col = index(link.target);
            matrix[row][col] += link.flow;
        });

        return matrix;
    }
}
