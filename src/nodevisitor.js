export default class NodeVisitor {
    visit(node) {
        if (node.hasChildren) {
            for (let child of node.nodes) {
                child.accept(this);
            }
        }
    }
}
