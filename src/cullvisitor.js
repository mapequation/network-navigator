import NodeVisitor from 'nodevisitor';
import {
    sumFlow,
    takeLargest,
    connectedLinks,
} from 'filter';

export default class CullVisitor extends NodeVisitor {
    constructor(state) {
        super();
        this.state = state;
    }

    visit(network) {
        let { nodes, links } = network;

        const nodeFlow = sumFlow(nodes);

        nodes.forEach(node => node.shouldRender = false);
        links.forEach(link => link.shouldRender = false);

        nodes = takeLargest(nodes, 20);
        links = connectedLinks({ nodes, links });

        nodes.forEach(node => node.shouldRender = true);
        links.forEach(link => link.shouldRender = true);

        this.state.nodeFlow = nodeFlow ? sumFlow(nodes) / nodeFlow : 1;

        return this;
    }
}
