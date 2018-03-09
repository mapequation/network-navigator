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
     * @param {number} flow the flow, default 1
     */
    constructor(source, target, flow = 1) {
        this.source = source;
        this.target = target;
        this.flow = flow;
        this.shouldRender = true;
    }

    /**
     * Construct a new Link
     *
     * @param {Object} obj
     * @param {*} obj.source the source
     * @param {*} obj.target the target
     * @param {number} obj.flow the flow
     * @return {Link} the link
     */
    static fromObject(obj) {
        return new Link(obj.source, obj.target, obj.flow);
    }

    toString() {
        const id = linkEnd => (linkEnd.id ? linkEnd.id : linkEnd);
        return `${id(this.source)} ${id(this.target)} ${this.flow}`;
    }
}
