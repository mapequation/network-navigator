import { Node } from 'tree';

/**
 * Lump nodes beneath root node so that a factor of the flow
 * are contained in a lumped node.
 * This _will_ modify the children and links of the root node.
 *
 * @param {Node} rootNode the node of which children are considered for lumping
 * @param {number} factor between 0 and 1
 */
export default function lumpNodes(rootNode, factor) {
    const byFlow = (n1, n2) => n2.flow - n1.flow;
    const children = rootNode.nodes.sort(byFlow);
    const numChildren = children.length;
    const flowTotal = children.reduce((tot, node) => tot + node.flow, 0);
    const flowTarget = factor * flowTotal;

    const lumpNode = new Node('lump');
    lumpNode.path = (rootNode.path === 'root') ? lumpNode.id : [rootNode.path, lumpNode.id].join(':');

    while (lumpNode.flow < flowTarget && children.length) {
        const node = children.pop();
        lumpNode.flow += node.flow;
        lumpNode.exitFlow += node.exitFlow;
        node.nodes.forEach(child => lumpNode.addChild(child));
        rootNode.links.forEach((link) => {
            if (link.source === node.id) link.source = lumpNode.id;
            if (link.target === node.id) link.target = lumpNode.id;
        });
        rootNode.deleteChild(node.id);
    }

    if (rootNode.numChildren === numChildren) {
        return;
    }

    rootNode.addChild(lumpNode);

    const { links } = rootNode;

    const isDuplicate = (l1, l2) => l1.source === l2.source && l1.target === l2.target;
    const isCircular = link => link.source === link.target;

    // Search for duplicate and circular links
    for (let i = 0; i < links.length; i++) {
        const link = links[i];

        if (isCircular(link)) {
            link.circular = true;
            continue;
        }

        for (let j = i + 1; j < links.length; j++) {
            const candidateLink = links[j];
            if (isDuplicate(link, candidateLink)) {
                link.flow += candidateLink.flow;
                candidateLink.duplicate = true;
            }
        }
    }

    rootNode.links = links.filter(link => !link.duplicate && !link.circular);
}
