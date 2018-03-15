import TreePath from 'treepath';


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

export const findById = (xs, id) => xs.find(x => x.id === id);

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
export function connectLinks(root) {
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
