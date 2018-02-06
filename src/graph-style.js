import { scaleLinear, scaleLog } from 'd3-scale';
import { extent } from 'd3-array';

/**
 * Factory function to create graph style functions.
 *
 * @example
 *  const style = makeGraphStyle({ nodes, links });
 *  const circle = svg.append('circle')
 *      .attr('r', style.node.radius)
 *      .style('fill', style.node.fillColor)
 *      .style('stroke', style.node.borderColor)
 *      .style('stroke-width', style.node.borderWidth);
 *
 * @param {Object} opts
 * @param {Node[]} opts.nodes
 * @param {Object[]} opts.links
 */
export default function makeGraphStyle({ nodes, links }) {
    const nodeRadius = scaleLog().domain(extent(nodes, n => n.flow)).range([20, 60]);
    const nodeFillColor = scaleLinear().domain(extent(nodes, n => n.flow)).range(['#DFF1C1', '#C5D7A8']);
    const nodeBorderColor = scaleLinear().domain(extent(nodes, n => n.exitFlow)).range(['#ABD65B', '#95C056']);
    const nodeBorderWidth = scaleLinear().domain(extent(nodes, n => n.exitFlow)).range([2, 6]);

    const linkFillColor = scaleLinear().domain(extent(links, l => l.flow)).range(['#71B2D7', '#418EC7']);
    const linkWidth = scaleLinear().domain(extent(links, l => l.flow)).range([4, 10]);
    const linkOpacity = scaleLinear().domain(extent(links, l => l.flow)).range([0.8, 1]);

    const textFontSize = scaleLog().domain(extent(nodes, n => n.flow)).range([7, 18]);

    return {
        node: {
            radius: node => nodeRadius(node.flow),
            fillColor: node => nodeFillColor(node.flow),
            borderColor: node => nodeBorderColor(node.exitFlow),
            borderWidth: node => nodeBorderWidth(node.exitFlow),
        },

        link: {
            fillColor: link => linkFillColor(link.flow),
            width: link => linkWidth(link.flow),
            opacity: link => linkOpacity(link.flow),
        },

        text: {
            fontSize: node => textFontSize(node.flow),
        },
    };
}
