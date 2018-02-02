function byFlow(obj1, obj2) {
    return obj2.flow - obj1.flow;
}

function linkToNode(node) {
    return link => link.source === node.id || link.target === node.id;
}

/**
 * Filter nodes beneath root node so that a factor of the flow
 * are removed.
 * This _will_ modify the children and links of the root node.
 *
 * @param {Node} rootNode the node of which children are considered for filtering
 * @param {number} factor between 0 and 1
 */
export function filterNodes(rootNode, factor) {
    const children = rootNode.nodes.sort(byFlow);
    const flowTotal = children.reduce((total, node) => total + node.flow, 0);
    const flowTarget = factor * flowTotal;

    let accumulatedFlow = 0;

    const notLinkToNode = node => link => !linkToNode(node)(link);

    while (accumulatedFlow < flowTarget && children.length) {
        const node = children.pop();
        accumulatedFlow += node.flow;
        rootNode.links = rootNode.links.filter(notLinkToNode(node));
        rootNode.deleteChild(node);
    }
}

/**
 * Prune links such that the remaining links represents a factor
 * of the total initial flow.
 *
 * @param {Object[]} links an array of links
 * @param {number} factor a number between 0 and 1
 */
export function pruneLinks(links, factor) {
    const linksByFlow = links.sort(byFlow);
    const flowTotal = linksByFlow.reduce((total, link) => total + link.flow, 0);
    const flowTarget = factor * flowTotal;

    let accumulatedFlow = 0;

    while (accumulatedFlow < flowTarget && linksByFlow.length) {
        const link = linksByFlow.pop();
        accumulatedFlow += link.flow;
    }
}

/**
 * Remove all disconnected nodes under root node.
 *
 * @param {Node} rootNode
 */
export function filterDisconnectedNodes(rootNode) {
    const hasLink = node => rootNode.links.filter(linkToNode(node)).length > 0;

    const children = rootNode.nodes;

    while (children.length) {
        const node = children.pop();

        if (!hasLink(node)) {
            rootNode.deleteChild(node);
        }
    }
}
