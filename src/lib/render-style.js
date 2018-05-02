/**
 * @file This file dictates the appearance of the rendered network.
 *
 * @author Anton Eriksson
 */

import {
    scaleSqrt,
    interpolateGreens,
    interpolateBlues,
} from 'd3';


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
 * @param {number} maxNodeExitFlow the max exit flow for nodes
 * @param {number} maxLinkFlow the max flow for links
 * @return {Object} an object with render style accessors
 */
export default function makeRenderStyle(maxNodeFlow, maxNodeExitFlow, maxLinkFlow) {
    const nodeFill = [interpolateGreens(2/9), interpolateGreens(3/9)];
    const nodeBorder = [interpolateGreens(3/9), interpolateGreens(6/9)];
    const linkFill = [interpolateBlues(2/9), interpolateBlues(6/9)];

    const nodeRadius = scaleSqrt().domain([0, maxNodeFlow]).range([10, 70]);
    const nodeFillColor = scaleSqrt().domain([0, maxNodeFlow]).range(nodeFill);
    const nodeBorderWidth = scaleSqrt().domain([0, maxNodeExitFlow]).range([1, 5]);
    const nodeBorderColor = scaleSqrt().domain([0, maxNodeExitFlow]).range(nodeBorder);

    const linkFillColor = scaleSqrt().domain([0, maxLinkFlow]).range(linkFill);
    const linkWidth = scaleSqrt().domain([0, maxLinkFlow]).range([2, 15]);

    const searchMarkRadius = scaleSqrt().domain([0, 10]).range([0, 10]).clamp(true);

    return {
        nodeRadius: node => nodeRadius(node.flow),
        nodeFillColor: node => nodeFillColor(node.flow),
        nodeBorderColor: node => nodeBorderColor(node.exitFlow),
        nodeBorderWidth: node => nodeBorderWidth(node.exitFlow),
        linkFillColor: link => linkFillColor(link.flow),
        linkWidth: link => linkWidth(link.flow),
        searchMarkRadius: node => node.visible ? 0 : searchMarkRadius(node.searchHits || 0),
    };
}
