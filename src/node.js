import TreePath from 'treepath';

/**
 * Class to represent a node in a network
 *
 * @author Anton Eriksson
 */
export default class Node {
    constructor(id, name, flow) {
        this.id = id;
        this.path = new TreePath(id);
        this.parent = null;
        this.name = name;
        this.flow = flow;
        this.exitFlow = 0;
    }

    clone() {
        return new Node(this.id, this.name, this.flow);
    }
}
