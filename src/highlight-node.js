import { select, selectAll } from 'd3-selection';

export function highlightNode(node) {
    select(this).select('circle')
        .style('stroke', '#F48074');
    selectAll('.link').filter(d => d.target === node)
        .raise()
        .style('fill', '#ba6157');
    selectAll('.link').filter(d => d.source === node)
        .raise()
        .style('fill', '#F48074');
}

export function restoreNode({ nodeBorderColor, linkFillColor }) {
    return function () {
        select(this).select('circle')
            .style('stroke', nodeBorderColor);
        selectAll('.link')
            .sort((a, b) => a.flow - b.flow)
            .style('fill', linkFillColor);
    };
}
