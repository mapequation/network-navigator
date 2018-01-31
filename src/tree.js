export class Node {
    constructor(id) {
        this.id = id;
        this.path = null;
        this.parent = null;
        this.name = null;
        this.flow = 0;
        this.exitFlow = 0;
        this.children = {};
        this.links = [];
    }

    clone() {
        const clone = new Node(this.id);
        clone.path = this.path;
        clone.parent = this.parent;
        clone.name = this.name;
        clone.flow = this.flow;
        clone.exitFlow = this.exitFlow;

        this.nodes.forEach((child) => {
            clone.addChild(child.clone());
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

    addChild(child) {
        this.children[child.id] = child;
        this.children[child.id].parent = this.path;
        return this;
    }

    getChild(id) {
        return this.children[id];
    }

    deleteChild(id) {
        delete this.children[id];
    }

    get numChildren() {
        return this.nodes.length;
    }

    get nodes() {
        return Object.values(this.children);
    }
}

export class Tree {
    constructor() {
        this.root = new Node('root');
        this.root.path = 'root';
    }

    /**
     * Get the Node at the end of the path.
     *
     * @param {string} path
     * @return {Node}
     */
    getNode(path) {
        if (path === 'root') {
            return this.root;
        }

        return path
            .split(':')
            .map(Number)
            .reduce((pathNode, childId) => pathNode.getChild(childId), this.root);
    }
}
