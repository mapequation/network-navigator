import { select } from 'd3';

export function highlightNode(node) {
    if (node.visible) return;

    const outColor = '#f48074';
    const inColor = '#ba6157';

    select(this).select('circle')
        .style('stroke', outColor);

    const links = select(this.parentElement.parentElement)
          .select('.links')
          .selectAll('.link');

    links.filter(d => d.target === node)
        .raise()
        .style('fill', inColor);
    links.filter(d => d.source === node)
        .raise()
        .style('fill', outColor);
}

export function restoreNode({ nodeBorderColor, linkFillColor }) {
    return function () {
        select(this).select('circle')
            .style('stroke', nodeBorderColor);

        select(this.parentElement.parentElement)
            .select('.links').selectAll('.link')
            .sort((a, b) => a.flow - b.flow)
            .style('fill', linkFillColor);
    };
}
