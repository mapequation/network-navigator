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

    getDefault(id) {
        let child = this.getChild(id);

        if (!child) {
            child = new Node(id);
            this.addChild(child);
        }

        return child;
    }

    /**
     * Getter for d3
     */
    get nodes() {
        return Object.values(this.children);
    }
}

export class Tree {
    constructor() {
        this.root = new Node('root');
        this.root.path = 'root';
    }
}
