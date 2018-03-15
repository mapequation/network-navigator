import * as d3 from 'd3';
import TreePath from 'treepath';
import { byFlow } from 'filter';


const common = (id, flow = 0) => ({
    id,
    flow,
    exitFlow: 0,
    path: new TreePath(id),
    parent: null,
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
    const node = {
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
    const network = {
        nodes: [],
        links: [],
        largest: [],
        state: {
            dirty: false,
        },
    };

    return Object.assign(network, common(id));
}

const findById = (xs, id) => xs.find(x => x.id === id);

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
        .reduce((pathNode, id) => (pathNode ? findById(pathNode.nodes, id) : null), root);
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
                source: findById(node.nodes, link.source),
                target: findById(node.nodes, link.target),
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
                let child = findById(pathNode.nodes, childId);
                if (!child) {
                    child = Network(childId);
                    child.parent = pathNode;
                    child.path = TreePath.join(pathNode.path, child.id)
                    pathNode.nodes.push(child);
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
                pathNode.largest.sort(byFlow);
                if (pathNode.largest.length > 4) {
                    pathNode.largest.pop();
                }
                return findById(pathNode.nodes, childId);
            }, this.network);

        parent.flow += node.flow;
        parent.largest.push(childNode);
        parent.largest.sort(byFlow);
        if (parent.largest.length > 4) {
            parent.largest.pop();
        }
        childNode.parent = parent;
        childNode.path = TreePath.join(parent.path, childNode.id)
        parent.nodes.push(childNode);
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
