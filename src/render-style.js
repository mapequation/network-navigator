/**
 * @file This file dictates the appearance of the rendered network.
 *
 * @author Anton Eriksson
 */

import { scaleLinear, scaleSqrt } from 'd3-scale';


/**
 * Factory function to create style functions.
 *
 * @example
 *  const style = makeRenderStyle(maxNodeFlow, maxLinkFlow);
 *  const circle = svg.append('circle')
 *      .attr('r', style.nodeRadius)
 *      .style('fill', style.nodeFillColor)
 *      .style('stroke', style.nodeBorderColor)
 *      .style('stroke-width', style.nodeBorderWidth);
 *
 * @param {number} maxNodeFlow the max flow for nodes
 * @param {number} maxLinkFlow the max flow for links
 * @return {Object} an object with render style accessors
 */
export default function makeRenderStyle(maxNodeFlow, maxLinkFlow) {
    const nodeRadius = scaleSqrt().domain([0, maxNodeFlow]).range([10, 70]);
    const nodeFillColor = scaleLinear().domain([0, maxNodeFlow]).range(['#DFF1C1', '#C5D7A8']);
    const nodeBorderColor = scaleLinear().domain([0, maxNodeFlow]).range(['#ABD65B', '#95C056']);
    const nodeBorderWidth = scaleSqrt().domain([0, maxNodeFlow]).range([1, 10]);

    const linkFillColor = scaleLinear().domain([0, maxLinkFlow]).range(['#C0D3DF', '#064575']);
    const linkWidth = scaleLinear().domain([0, maxLinkFlow]).range([1, 10]);

    const searchMarkRadius = scaleSqrt().domain([0, 10]).range([0, 10]).clamp(true);

    return {
        nodeRadius: node => nodeRadius(node.flow),
        nodeFillColor: node => nodeFillColor(node.flow),
        nodeBorderColor: node => nodeBorderColor(node.exitFlow),
        nodeBorderWidth: node => nodeBorderWidth(node.exitFlow),
        linkFillColor: link => linkFillColor(link.flow),
        linkWidth: link => linkWidth(link.flow),
        searchMarkRadius,
    };
}

export function makeLinkLod(links) {
    const len = links.length || 1;
    const visible = scaleSqrt().domain([0.2, 2.5]).range([1 / len, 1]).clamp(true);
    return k => l => 1 - l.index / len <= visible(k);
};

export function makeNodeLod(nodes) {
    const visible = scaleLinear().domain([0.2, 0.8]).range([1, nodes.length]).clamp(true);
    return k => n => n.id <= visible(k);
};
