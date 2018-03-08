/**
 * @file This file deals with creating a network from pajek data.
 *
 * @see parsePajek
 *
 * @author Christopher Blöcker
 */

import { Network, Node } from 'network';
import Link from 'link';

export default function networkFromPajek({ nodes, links }) {
    const root = new Network();

    nodes.forEach(node => root.addNode(new Node(node.id, node.label, node.flow)));

    root.links = links.map(Link.fromObject);

    links.forEach((link) => {
        link.source = root.getNode(link.source);
        link.target = root.getNode(link.target);
    });

    return root;
}
