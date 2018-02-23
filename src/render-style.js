/**
 * @file This file dictates the appearance of the rendered network.
 * It defines a factory function that, given a set of nodes and links,
 * maps the defined ranges to the domain found in the data.
 *
 * @author Anton Eriksson
 */

import { scaleLinear, scaleSqrt } from 'd3-scale';


/**
 * Factory function to create style functions.
 *
 * @example
 *  const style = makeRenderStyle(network);
 *  const circle = svg.append('circle')
 *      .attr('r', style.nodeRadius)
 *      .style('fill', style.nodeFillColor)
 *      .style('stroke', style.nodeBorderColor)
 *      .style('stroke-width', style.nodeBorderWidth);
 *
 * @param {Network} network
 */
export default function makeRenderStyle(network) {
    const { nodes, links } = network;

    const maxFlow = array =>
        array.map(n => n.flow).reduce((a, b) => Math.max(a, b), 0);

    const maxNodeFlow = maxFlow(nodes);

    let maxLinkFlow = maxFlow(links);

    network.traverse((node) => {
        if (node.links) {
            maxLinkFlow = Math.max(maxLinkFlow, maxFlow(node.links));
        }
    });

    const nodeRadius = scaleSqrt().domain([0, maxNodeFlow]).range([10, 70]);
    const nodeFillColor = scaleLinear().domain([0, maxNodeFlow]).range(['#DFF1C1', '#C5D7A8']);
    const nodeBorderColor = scaleLinear().domain([0, maxNodeFlow]).range(['#ABD65B', '#95C056']);
    const nodeBorderWidth = scaleSqrt().domain([0, maxNodeFlow]).range([1, 10]);

    const linkFillColor = scaleLinear().domain([0, maxLinkFlow]).range(['#C0D3DF', '#064575']);
    const linkWidth = scaleLinear().domain([0, maxLinkFlow]).range([1, 10]);

    return {
        nodeRadius: node => nodeRadius(node.flow),
        nodeFillColor: node => nodeFillColor(node.flow),
        nodeBorderColor: node => nodeBorderColor(node.exitFlow),
        nodeBorderWidth: node => nodeBorderWidth(node.exitFlow),
        linkFillColor: link => linkFillColor(link.flow),
        linkWidth: link => linkWidth(link.flow),
    };
}
