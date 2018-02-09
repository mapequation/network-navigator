import { expect } from 'chai';
import Network from '../src/network';

describe('Network', function () {
    let network;

    beforeEach(function () {
        network = new Network();
    });

    it('should be able to get a node by id', function () {
        const node = { id: 1 };
        network.addNode(node);
        expect(network.getNode(node.id)).to.equal(node);
    });

    it('should be able to delete nodes', function () {
        const node = { id: 1 };
        network.addNode(node);
        network.deleteNode(node);
        expect(network.getNode(node.id)).to.equal(undefined);
    });

    it('should be able to get a node by path', function () {
        const node1 = new Network(1);
        const node2 = new Network(2);
        const node3 = new Network(3);
        node2.addNode(node3);
        node1.addNode(node2);
        network.addNode(node1);
        expect(network.getNodeByPath('1:2:3')).to.equal(node3);
    });

    it('should set itself as parent of nodes', function () {
        const node = { id: 1 }
        network.addNode(node);
        expect(node.parent).to.equal(network);
    });

    it('should be able to get all nodes', function () {
        const node1 = { id: 1 };
        const node2 = { id: 2 };
        const node3 = { id: 3 };
        network.addNode(node1);
        network.addNode(node2);
        network.addNode(node3);
        expect(network.nodes).to.deep.equal([node1, node2, node3]);
    });
});
