/**
 * Class to represent a network of nodes and links.
 * The nodes in the network are Networks themselves,
 * allowing the class to represent multi-layer networks.
 *
 * @author Anton Eriksson
 */
export default class Network {
    /**
     * Construct a Network
     *
     * @param {number|string} id the id of the network
     */
    constructor(id) {
        this.id = id;
        this.path = null;
        this.parent = null;
        this.name = null;
        this.flow = 0;
        this.exitFlow = 0;
        this.children = new Map();
        this.links = [];
    }

    createNode(id) {
        const node = new Network(id);
        this.addNode(node);
        return node;
    }

    addNode(node) {
        node.parent = this;
        this.children.set(node.id, node);
    }

    getNode(id) {
        return this.children.get(id);
    }

    getNodeByPath(path) {
        if (path === this.path) {
            return this;
        }

        return path
            .split(':')
            .map(Number)
            .reduce((pathNode, childId) => (pathNode ? pathNode.getNode(childId) : null), this);
    }

    deleteNode(node) {
        const id = node.id || node;
        this.children.delete(id);
    }

    get nodes() {
        return Array.from(this.children.values());
    }

    set nodes(nodes) {
        this.children.clear();
        nodes.forEach(child => this.addNode(child));
    }


    clone() {
        const clone = new Network(this.id);

        clone.path = this.path;
        clone.parent = this.parent;
        clone.name = this.name;
        clone.flow = this.flow;
        clone.exitFlow = this.exitFlow;

        this.nodes.forEach((childNode) => {
            clone.addNode(childNode.clone());
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
}
