/**
 * Class to represent a node in a network
 *
 * @author Anton Eriksson
 */
export default class Node {
    constructor(id, name, flow) {
        this.id = id;
        this.path = null;
        this.parent = null;
        this.name = name;
        this.flow = flow;
        this.exitFlow = 0;
    }

    clone() {
        return this;
    }
}
