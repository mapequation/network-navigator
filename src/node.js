import TreePath from 'treepath';

/**
 * Class to represent a node in a network
 *
 * @author Anton Eriksson
 */
export default class Node {
    constructor(id, name, flow, physicalId) {
        this.id = id;
        this.path = new TreePath(id);
        this.name = name;
        this.flow = flow;
        this.exitFlow = 0;
        this.parent = null;
        this.shouldRender = true;
        this.physicalId = physicalId;
        this.marked = false;
    }

    get hasChildren() {
        return false;
    }

    toString() {
        return this.name;
    }
}
