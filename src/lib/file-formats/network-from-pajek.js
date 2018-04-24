/**
 * @file This file deals with creating a network from pajek data.
 *
 * @see parsePajek
 *
 * @author Christopher Blöcker
 */

import * as Network from '../network';
import TreePath from '../treepath';

export default function networkFromPajek(pajek) {
    const root = Network.createNetwork('root');
    root.directed = pajek.meta.linkType === 'directed';
    const { nodes, links } = pajek.data;

    nodes.forEach((node) => {
        const childNode = Network.createNode(node.id, node.label, node.flow, node.id);
        childNode.parent = root;
        childNode.path = new TreePath(node.id);
        Network.addNode(root, childNode);
    });

    root.links = links;

    Network.connectLinks(root);

    return root;
}
