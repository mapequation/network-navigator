import * as d3 from 'd3';
import TreePath from 'treepath';
import PriorityQueue from 'priority-queue';
import { byFlow } from 'filter';


const common = (id, flow = 0) => ({
    id,
    path: new TreePath(id),
    flow,
    exitFlow: 0,
    shouldRender: true,
});

/**
 * Create a Node
 *
 * @param {number} id the id
 * @param {string} name the name
 * @param {number} flow the flow
 * @param {number} physicalId the physical id
 */
export function Node(id, name, flow, physicalId) {
    let node = {
        name,
        physicalId,
        marked: false,
    };

    return Object.assign(node, common(id, flow));
}

/**
 * Create a Network of nodes and links.
 *
 * @see NetworkBuilder
 * @see Node
 *
 * @param {number|string} id the id
 */
export function Network(id) {
    let network = {
        nodes: [],
        links: [],
        largest: new PriorityQueue(byFlow, 4),
        state: {
            simulation: d3.forceSimulation()
                .alphaDecay(0.06)
                .stop(),

            dirty: false,
        },

        /**
         * Add a node
         *
         * @param {Network|Node} node the node to add
         */
        addNode(node) {
            node.parent = this;
            if (this.path.toString() !== 'root') {
                node.path = TreePath.join(this.path, node.id);
            }
            this.nodes.push(node);
        },

        /**
         * Get the node with a certain id
         *
         * @param {number|string} id the id of the node
         * @return {?(Network|Node)} the node
         */
        getNode(id) {
            return this.nodes.find(node => node.id === id);
        },
    };

    return Object.assign(network, common(id));
}

/**
 * Get the child node that matches the path.
 *
 * @param {Network} root the root node
 * @param {string} path the path formatted like "1:2:3"
 * @return {?(Network|Node)} the node
 */
export const makeGetNodeByPath = root => path => {
    if (path.toString() === root.path.toString()) {
        return root;
    }

    return TreePath.toArray(path)
        .reduce((pathNode, id) => (pathNode ? pathNode.getNode(id) : null), root);
};


/**
 * Pre-order traverse all nodes below.
 *
 * @param {Network} root the root node
 * @yields {Network|Node} the nodes
 */
export function* traverseDepthFirst(root) {
    const queue = [root];
    while (queue.length) {
        const node = queue.pop();
        yield node;
        if (node.nodes) {
            queue.push(...[...node.nodes].reverse());
        }
    }
}

/**
 * Breadth first traverse all nodes below.
 *
 * @param {Network} root the root node
 * @yields {Network|Node} the nodes
 */
export function* traverseBreadthFirst(root) {
    const queue = [root];
    while (queue.length) {
        const node = queue.shift();
        yield node;
        if (node.nodes) {
            queue.push(...node.nodes);
        }
    }
}

/**
 * Connect all links in network
 *
 * @param {Network} root the root of the network
 */
function connectLinks(root) {
    for (let node of traverseDepthFirst(root)) {
        if (node.links) {
            node.links = node.links.map(link => ({
                source: node.getNode(link.source),
                target: node.getNode(link.target),
                flow: link.flow
            }));
        }
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
        this.network = Network('root');
        this.network.directed = directed;
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
     * Add a module to the Network
     *
     * @param {Object} node the node representing the module
     * @param {number|string} node.path the path
     * @param {number} node.exitFlow the exit flow
     * @param {string} [node.name] the node name
     * @param {Object[]} node.links the links
     */
    addModule(node) {
        if (node.path === 'root') {
            this.network.links = node.links;
            return;
        }

        const childNode = TreePath.toArray(node.path)
            .reduce((pathNode, childId) => {
                let child = pathNode.getNode(childId);
                if (!child) {
                    child = Network(childId);
                    pathNode.addNode(child);
                }
                return child;
            }, this.network);

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
        const childNode = Node(path.pop(), node.name, node.flow, node.node);

        const parent = path
            .reduce((pathNode, childId) => {
                pathNode.flow += node.flow;
                pathNode.largest.push(childNode);
                return pathNode.getNode(childId);
            }, this.network);

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
            connectLinks(this.network);
        }

        return this.network;
    }
}
