import escapeRegExp from 'lodash';
import TreePath from './treepath';
import { sumFlow } from './filter';

/******************************************
 * Common properties for Network and Node *
 ******************************************/
const hasFlow = (flow = 0) => ({
    flow,
    exitFlow: 0,
});

const isRenderable = {
    shouldRender: true,
};

const treeNode = (id) => ({
    id,
    path: new TreePath(id),
    parent: null,
});

const node = () => ({
    kin: 0,
    kout: 0,
    inLinks: [],
    outLinks: [],
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
    static create(id, name, flow, physicalId) {
        return Object.assign(new Node(name, physicalId), treeNode(id), node(),  hasFlow(flow), isRenderable);
    }
}

export const createNode = Node.create;

/**
 * A link in a network
 *
 * Internal use only.
 */
class Link {
    constructor(source, target, flow) {
        this.source = source;
        this.target = target;
        this.flow = flow;
        this.shouldRender = true;
    }
}

/**
 * A network of nodes and links
 *
 * Internal use only, @see createNetwork
 */
class Network {
    constructor() {
        this._name = undefined;
        this._nodes = new Map();
        this.links = [];
        this.largest = [];
        this.visible = false;
        this.connected = false;
    }

    /**
     * Create a Network of nodes and links.
     *
     * @param {number|string} id the id
     */
    static create(id) {
        return Object.assign(new Network(), treeNode(id), node(),  hasFlow(), isRenderable);
    }

    addNode(child) {
        this._nodes.set(child.id, child);
    }

    getNode(childId) {
        return this._nodes.get(childId);
    }

    get nodes() {
        if (!this._nodesArray) {
            this._nodesArray = Array.from(this._nodes.values());
        }
        return this._nodesArray;
    }

    get name() {
        return this._name || this.largest.map(node => node.name).join(', ');
    }

    set name(name) {
        this._name = name;
    }

    /**
     * Get the child node that matches the path.
     *
     * @param {string} path the path formatted like "1:2:3"
     * @return {?(Network|Node)} the node
     */
    getNodeByPath(path) {
        if (path.toString() === this.path.toString()) {
            return this;
        }

        return TreePath.toArray(path)
            .reduce((parent, id) => parent.getNode(id), this);
    }

    connect() {
        if (this.connected) return;
        this.connected = true;

        this.links = this.links.map(l => {
            const source = this.getNode(l.source);
            const target = this.getNode(l.target);
            const link = new Link(source, target, l.flow);
            source.outLinks.push(link);
            target.inLinks.push(link);
            source.kout++;
            target.kin++;
            return link;
        });
    }

    search(name) {
        const entireNetwork = Array.from(traverseDepthFirst(this));

        entireNetwork.forEach(node => node.searchHits = 0);

        if (!name.length) return;

        try {
            const re = new RegExp(escapeRegExp(name), 'i');

            entireNetwork
                .filter(node => !node.nodes)
                .forEach((node) => {
                    node.searchHits = +re.test(node.name);

                    if (node.searchHits > 0) {
                        let parent = node.parent;
                        while (parent) {
                            parent.searchHits += node.searchHits;
                            parent = parent.parent;
                        }
                    }
                });

        } catch (e) {
            // Do nothing
        }
    }
}


export const createNetwork = Network.create;


/**
 * Factory function for creating node search functions.
 *
 * @param {Network} root the root
 * @return {Function} getNodeByPath
 */
export const makeGetNodeByPath = root => root.getNodeByPath.bind(root);


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
            node.connect();
        }
    }
}


/**
 * Search Network name fields for string matching `name`.
 *
 * @param {Network} root the root of the network
 * @param {string} name the name to search for
 */
export const searchName = (root, name) => root.search(name);

