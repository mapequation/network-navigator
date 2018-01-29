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

    addChild(child) {
        this.children[child.id] = child;
        this.children[child.id].parent = this.path;
        return this;
    }

    getChild(id) {
        return this.children[id];
    }

    getDefault(id) {
        let child = this.getChild(id);

        if (!child) {
            child = new Node(id);
            this.addChild(child);
        }

        return child;
    }

    get nodes() {
        return Object.values(this.children);
    }

    toString() {
        return `[Node ${this.id} {parent: ${this.parent}, flow: ${this.flow}, exitFlow: ${this.exitFlow}, children: ${this.children}, links: ${this.links}}]`;
    }
}

export class Tree {
    constructor() {
        this.root = new Node('root');
        this.root.path = 'root';
    }
}
