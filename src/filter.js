/**
 * Comparator for sorting objects by flow.
 *
 * @param {Object} obj1
 * @param {Object} obj2
 * @return {Boolean}
 */
export function byFlow(obj1, obj2) {
    return obj2.flow - obj1.flow;
}

/**
 * Return the total flow of the array of objects.
 *
 * @param {Object[]} objects
 * @return {Number} the total flow.
 */
export function sumFlow(objects) {
    return objects.reduce((total, obj) => total + obj.flow, 0);
}

/**
 * Return all connected nodes, given a set nodes and links.
 * That is; all the nodes which has at least one link pointing to it.
 *
 * @param {Object} param
 * @param {Node[]} param.nodes the nodes
 * @param {Object[]} param.links the links
 * @return {Node[]} the connected nodes
 */
export function connectedNodes({ nodes, links }) {
    const pointsTo = node => link => link.source === node.id || link.target === node.id;
    return nodes.filter(node => links.some(pointsTo(node)));
}

/**
 * Return all connected links, given a set of nodes and links.
 * A link is _not_ connected if either the source or target node does not exist.
 *
 * @param {Object} param
 * @param {Node[]} param.nodes the nodes
 * @param {Object[]} param.links the links
 * @return {Object[]} the connected links
 */
export function connectedLinks({ nodes, links }) {
    const isSourceTo = link => node => link.source === node.id;
    const isTargetTo = link => node => link.target === node.id;
    return links.filter(link => nodes.some(isSourceTo(link)) && nodes.some(isTargetTo(link)));
}

/**
 * Return the num largest objects sorted by flow,
 * or all objects if num is smaller or equal than the number of objects.
 *
 * @param {Object[]} objects the objects
 * @param {Number} amount the amount to take
 * @return {Object[]} the num largest by flow
 */
export function takeLargest(objects, amount) {
    if (objects.length <= amount) {
        return objects;
    }

    return objects
        .sort(byFlow)
        .slice(0, amount);
}

/**
 * Return accumulated objects, sorted by flow, such that the sum
 * of their flow is at least flowFactor times the total flow.
 *
 * @param {Object[]} objects the objects
 * @param {Number} flowFactor between 0 and 1
 * @return {Object[]} the accumulated objects
 */
export function accumulateLargest(objects, flowFactor) {
    const sorted = objects.sort(byFlow);
    const flowTotal = sumFlow(objects);
    const targetFlow = flowFactor * flowTotal;

    const largest = [];

    while (sumFlow(largest) < targetFlow && sorted.length) {
        largest.push(sorted.shift());
    }

    return largest;
}
