/**
 * @file This file contains functions for filtering network data,
 * summing and sorting. Typically the functions work on arrays of
 * objects that has the 'flow' property.
 * The exception is the functions for filtering disconnected nodes
 * and links which both need a set of nodes and links to work.
 *
 * @author Anton Eriksson
 */

/**
 * Comparator for sorting objects by flow (descending).
 *
 * @param {Object} obj1
 * @param {Object} obj2
 * @return {boolean}
 */
export function byFlow(obj1, obj2) {
    return obj2.flow - obj1.flow;
}

/**
 * Return the total flow of the array of objects.
 *
 * @param {Object[]} objects
 * @return {number} the total flow.
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
 * As a side effect, input objects are sorted in place.
 *
 * @param {Object[]} objects the objects
 * @param {number} amount the amount to take
 * @return {Object[]} the num largest by flow
 */
export function takeLargest(objects, amount) {
    if (objects.length < amount) {
        return objects;
    }

    return objects
        .sort(byFlow)
        .slice(0, amount);
}

/**
 * Return accumulated objects, sorted by flow, such that the sum
 * of their flow is at least flowFactor times the total flow.
 * As a side effect, input objects are sorted in place.
 *
 * @param {Object[]} objects the objects
 * @param {number} flowFactor between 0 and 1
 * @return {Object[]} the accumulated objects
 */
export function accumulateLargest(objects, flowFactor) {
    const sorted = objects.sort(byFlow);
    const flowTotal = sumFlow(objects);
    const targetFlow = flowFactor * flowTotal;

    const largest = [];
    let accumulated = 0;
    let i = 0;

    while (accumulated < targetFlow && i < sorted.length) {
        const node = sorted[i];
        largest.push(node);
        accumulated += node.flow;
        i++;
    }

    return largest;
}
