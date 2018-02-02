export class Node {
    constructor(id) {
        this.id = id;
        this.path = null;
        this.parent = null;
        this.name = null;
        this.visible = true;
        this.flow = 0;
        this.exitFlow = 0;
        this.children = {};
        this.links = [];
    }

    createChild(childId) {
        const childNode = new Node(childId);
        this.addChild(childNode);
        return childNode;
    }

    addChild(childNode) {
        this.children[childNode.id] = childNode;
        this.children[childNode.id].parent = this;
    }

    getChild(childId) {
        return this.children[childId];
    }

    deleteChild(childNode) {
        const id = childNode.id || childNode;
        delete this.children[id];
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
        clone.visible = this.visible;
        clone.flow = this.flow;
        clone.exitFlow = this.exitFlow;

        this.nodes.forEach((childNode) => {
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

    get nodes() {
        return Object.values(this.children);
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

    traverseDepthFirst(callback) {
        const stack = [this.root];

        while (stack.length) {
            const node = stack.pop();
            callback(node);
            stack.push(...node.nodes);
        }
    }

    traverseBreadthFirst(callback) {
        const queue = [this.root];

        while (queue.length) {
            const node = queue.shift();
            callback(node);
            queue.push(...node.nodes);
        }
    }
}

