/**
 * A link in a network of nodes
 *
 * @author Anton Eriksson
 */
export default class Link {
    /**
     * Construct a new Link
     *
     * @param {*} source the source
     * @param {*} target the target
     * @param {number} [flow=1] the flow
     */
    constructor(source, target, flow = 1) {
        this.source = source;
        this.target = target;
        this.flow = flow;
        this.shouldRender = true;
    }

    toString() {
        const id = linkEnd => (linkEnd.id ? linkEnd.id : linkEnd);
        return `${id(this.source)} ${id(this.target)} ${this.flow}`;
    }
}
