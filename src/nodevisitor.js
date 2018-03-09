export default class NodeVisitor {
    visit(node) {
        if (node.hasChildren) {
            node.nodes.forEach(n => n.accept(this));
        }
    }
}
