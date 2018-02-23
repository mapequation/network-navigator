import {
    accumulateLargest,
    connectedLinks,
} from 'filter';

export default class FilterVisitor {
    constructor(state) {
        this.state = state;
    }

    visit(network) {
        let { nodes, links } = network;

        nodes.forEach(node => node.shouldRender = false);
        links.forEach(link => link.shouldRender = false);

        nodes = accumulateLargest(nodes, this.state.nodeFlow);
        links = accumulateLargest(links, this.state.linkFlow);
        links = connectedLinks({ nodes, links });

        nodes.forEach(node => node.shouldRender = true);
        links.forEach(link => link.shouldRender = true);
    }
}
