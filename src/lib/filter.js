/**
 * @file This file contains functions for filtering network data,
 * summing and sorting. Typically the functions work on arrays of
 * objects that has the 'flow' property.
 * The exception is the functions for filtering disconnected nodes
 * and links which both need a set of nodes and links to work.
 *
 * @author Anton Holmgren
 */

/**
 * Comparator for sorting objects by flow (descending).
 *
 * @param {Object} obj1
 * @param {Object} obj2
 * @return {number} negative when obj1 > obj2,
 *                  positive when obj1 < obj2,
 *                  zero otherwise
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
  return objects
    .map(obj => obj.flow)
    .reduce((total, flow) => total + flow, 0);
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
  return nodes.filter(node =>
    links.some(link => link.source === node || link.target === node));
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
  return links.filter(link =>
    nodes.includes(link.source) && nodes.includes(link.target));
}

/**
 * Return the num largest objects sorted by flow, or all objects
 * if amount is larger or equal to the number of objects.
 *
 * @param {Object[]} objects the objects
 * @param {number} amount the amount to take
 * @return {Object[]} the amount largest by flow
 */
export function takeLargest(objects, amount) {
  return [...objects]
    .sort(byFlow)
    .slice(0, amount);
}

/**
 * Return accumulated objects, sorted by flow, such that the sum
 * of their flow is at least flowFactor times the total flow.
 *
 * @param {Object[]} objects the objects
 * @param {number} flowFactor between 0 and 1
 * @return {Object[]} the accumulated objects
 */
export function accumulateLargest(objects, flowFactor) {
  const targetFlow = flowFactor * sumFlow(objects);

  let accumulated = 0;

  return [...objects]
    .sort(byFlow)
    .filter(node => (accumulated += node.flow) <= targetFlow);
}
