import { expect } from 'chai';
import Module from '../src/module';

describe('Module', function () {
    let mod;

    beforeEach(function () {
        mod = new Module(1);
    });

    it('should be able to get a node by id', function () {
        const node = { id: 1 };
        mod.addNode(node);
        expect(mod.getNode(node.id)).to.equal(node);
    });

    it('should set itself as parent of nodes', function () {
        const node = { id: 1 }
        mod.addNode(node);
        expect(node.parent).to.equal(mod);
    });

    it('should be able to get all nodes', function () {
        const node1 = { id: 1 };
        const node2 = { id: 2 };
        const node3 = { id: 3 };
        mod.addNode(node1);
        mod.addNode(node2);
        mod.addNode(node3);
        expect(mod.nodes).to.deep.equal([node1, node2, node3]);
    });
});
