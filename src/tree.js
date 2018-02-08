export class Node {
    constructor(id) {
        this.id = id;
        this.path = null;
        this.parent = null;
        this.name = null;
        this.flow = 0;
        this.exitFlow = 0;
        this._children = new Map();
        this.links = [];
    }

    createChild(childId) {
        const childNode = new Node(childId);
        this.addChild(childNode);
        return childNode;
    }

    addChild(childNode) {
        childNode.parent = this;
        this._children.set(childNode.id, childNode);
    }

    getChild(childId) {
        return this._children.get(childId);
    }

    deleteChild(childNode) {
        const id = childNode.id || childNode;
        this._children.delete(id);
    }

    get children() {
        return Array.from(this._children.values());
    }

    set children(children) {
        this._children.clear();
        children.forEach(child => this.addChild(child));
    }

    get nodes() {
        return this.children;
    }

    set nodes(nodes) {
        this.children = nodes;
    }

    equal(other) {
        const id = other.id || other;
        return this.id === id;
    }

    clone() {
        const clone = new Node(this.id);

        clone.path = this.path;
        clone.parent = this.parent;
        clone.name = this.name;
        clone.flow = this.flow;
        clone.exitFlow = this.exitFlow;

        this.children.forEach((childNode) => {
            clone.addChild(childNode.clone());
        });

        this.links.forEach((link) => {
            clone.links.push({
                source: typeof link.source === 'object' ? link.source.clone() : link.source,
                target: typeof link.target === 'object' ? link.target.clone() : link.target,
                flow: link.flow,
            });
        });

        return clone;
    }
}

export class Tree {
    constructor() {
        this.root = new Node('root');
        this.root.path = this.root.id;
    }

    clone() {
        const clone = new Tree();
        clone.root = this.root.clone();
        return clone;
    }

    getNode(path) {
        if (path === this.root.path) {
            return this.root;
        }

        return path
            .split(':')
            .map(Number)
            .reduce((pathNode, childId) => (pathNode ? pathNode.getChild(childId) : null), this.root);
    }
}

/**
 * Create tree from ftree data
 *
 * @param {Object} opts
 * @param {Object[]} opts.treeData
 * @param {Object[]} opts.linkData
 * @return {Tree}
 */
export function createTree({ treeData, linkData }) {
    const tree = new Tree();

    linkData.forEach((node) => {
        // Get root node links
        if (node.path === 'root') {
            tree.root.links = node.links;

        // For all other nodes
        } else {
            const childNode = node.path
                .reduce((pathNode, childId) => pathNode.getChild(childId) || pathNode.createChild(childId), tree.root);

            childNode.path = node.path.join(':');
            childNode.exitFlow = node.exitFlow;
            childNode.links = node.links;
        }
    });

    treeData.forEach((node) => {
        const childNode = node.path
            .reduce((pathNode, childId) => {
                pathNode.flow += node.flow;
                return pathNode.getChild(childId) || pathNode.createChild(childId);
            }, tree.root);

        childNode.path = node.path.join(':');
        childNode.flow = node.flow;
        childNode.name = node.name;
    });

    return tree;
}
