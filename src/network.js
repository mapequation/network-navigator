import TreePath from 'treepath';

/************************************************
 * Common properties for Network, Node and Link *
 ************************************************/
const hasFlow = (flow = 0) => ({
    flow,
});

const hasExitFlow = {
    exitFlow: 0,
};

const isRenderable = {
    shouldRender: true,
    visible: false,
};

const treeNode = (id) => ({
    id,
    path: new TreePath(id),
    parent: null,
});

/**
 * A node in a network
 *
 * Internal use only, @see createNode
 */
class Node {
    constructor(name, physicalId) {
        this.name = name;
        this.physicalId = physicalId;
        this.marked = false;
    }
}

/**
 * Create a Node
 *
 * @param {number} id the id
 * @param {string} name the name
 * @param {number} flow the flow
 * @param {number} physicalId the physical id
 * @return {Node} the node
 */
export function createNode(id, name, flow, physicalId) {
    return Object.assign(new Node(name, physicalId), treeNode(id), hasFlow(flow), hasExitFlow, isRenderable);
}

/**
 * A link in a network
 *
 * Internal use only, @see createLink
 */
class Link {
    constructor(source, target) {
        this.source = source;
        this.target = target;
    }
}

/**
 * Create a Link
 *
 * @param {Node} source the source
 * @param {Node} target the target
 * @param {number} [flow=1] the flow
 * @return {Link} the link
 */
export function createLink(source, target, flow = 1) {
    return Object.assign(new Link(source, target), hasFlow(flow), isRenderable);
}

/**
 * A network of nodes and links
 *
 * Internal use only, @see createNetwork
 */
class Network {
    constructor() {
        this.nodes = [];
        this.links = [];
        this.largest = [];
    }
}

/**
 * Create a Network of nodes and links.
 *
 * @param {number|string} id the id
 */
export function createNetwork(id) {
    return Object.assign(new Network(), treeNode(id), hasFlow(), hasExitFlow, isRenderable);
}

export const findById = (xs, id) => xs.find(x => x.id === id);

/**
 * Factory function for creating node search functions.
 *
 * @param {Network} root the root
 * @return {Function} getNodeByPath
 */
export function makeGetNodeByPath(root) {
    /**
     * Get the child node that matches the path.
     *
     * @param {string} path the path formatted like "1:2:3"
     * @return {?(Network|Node)} the node
     */
    return function getNodeByPath(path) {
        if (path.toString() === root.path.toString()) {
            return root;
        }

        return TreePath.toArray(path)
            .reduce((parent, id) => findById(parent.nodes, id), root);
    }
}

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
export function connectLinks(root) {
    for (let node of traverseDepthFirst(root)) {
        if (node.links) {
            node.links = node.links.map(link =>
                createLink(findById(node.nodes, link.source), findById(node.nodes, link.target), link.flow));
        }
    }
}
