export function byFlow(obj1, obj2) {
    return obj2.flow - obj1.flow;
}

/**
 *
 * @param {Node} rootNode the node of which children are considered for filtering
 * @param {Number} factor between 0 and 1
 */
export function filterNodes(rootNode, factor) {
    const children = rootNode.children.sort(byFlow);
    const flowTotal = children.reduce((total, node) => total + node.flow, 0);
    const flowTarget = (1 - factor) * flowTotal;

    const notLinkToNode = node => link => link.source !== node.id && link.target !== node.id;

    let accumulatedFlow = 0;

    while (accumulatedFlow < flowTarget && children.length) {
        const node = children.pop();
        accumulatedFlow += node.flow;
        rootNode.links = rootNode.links.filter(notLinkToNode(node));
        rootNode.deleteChild(node);
    }
}

/**
 *
 * @param {Object[]} links an array of links
 * @param {Number} factor a number between 0 and 1
 */
export function filterLinks(links, factor) {
    const linksByFlow = links.sort(byFlow);
    const flowTotal = linksByFlow.reduce((total, link) => total + link.flow, 0);
    const flowTarget = (1 - factor) * flowTotal;

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
    const linkToNode = node => link => link.source === node.id || link.target === node.id;
    const hasLink = node => rootNode.links.some(linkToNode(node));

    const { children } = rootNode;

    while (children.length) {
        const node = children.pop();

        if (!hasLink(node)) {
            rootNode.deleteChild(node);
        }
    }
}

/**
 * Remove all links under root node which point to a non-existing node.
 *
 * @param {Node} rootNode
 */
export function filterDanglingLinks(rootNode) {
    const { links, children } = rootNode;

    rootNode.links = links
        .filter(link =>
            children.some(node => link.source === node.id) &&
            children.some(node => link.target === node.id));
}

/**
 *
 * @param {Node} rootNode
 * @param {Number} numNodes
 * @return {Number}
 */
export function autoFilter(rootNode, numNodes) {
    const children = rootNode.children.sort(byFlow);
    const nodeFlowTotal = children.reduce((total, node) => total + node.flow, 0);


    if (children.length > numNodes) {
        rootNode.children = children.splice(0, numNodes);
    }

    filterDanglingLinks(rootNode);

    const nodeFlow = rootNode.children.reduce((total, node) => total + node.flow, 0);

    return nodeFlow / nodeFlowTotal;
}
