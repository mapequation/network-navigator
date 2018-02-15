import Module from 'module';

/**
 * Class to represent a network of links and nodes
 *
 * @author Anton Eriksson
 */
export default class Network extends Module {
    /**
     * Construct a new Network
     */
    constructor() {
        super('root');
        this.path = 'root';
    }

    /**
     * Add a node
     *
     * @param {Module|Node} node the node
     */
    addNode(node) {
        node.parent = this;
        node.path = node.id.toString();
        this._nodes.set(node.id, node);
    }

    /**
     * Recursively search for the child node that matches the path.
     *
     * @param {string} path the path formatted like "1:2:3"
     * @return {?(Module|Node)} the node
     */
    getNodeByPath(path) {
        if (path === this.path) {
            return this;
        }

        return path
            .split(':')
            .map(Number)
            .reduce((pathNode, childId) => (pathNode ? pathNode.getNode(childId) : null), this);
    }

    /**
     * Deep clone
     *
     * @return {Network} the clone
     */
    clone() {
        const clone = new Network();

        clone.name = this.name;
        clone.largest = this.largest;
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
