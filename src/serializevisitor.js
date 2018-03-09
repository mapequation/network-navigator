import NodeVisitor from 'nodevisitor';

export default class SerializeVisitor extends NodeVisitor {
    constructor(serializer) {
        super();
        this.serializer = serializer;
        this.result = '';
    }

    visit(node) {
        this.result += this.serializer(node);
        super.visit(node);
    }

    toString() {
        return this.result;
    }
}
