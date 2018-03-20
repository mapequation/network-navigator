import * as d3 from 'd3';

export default function makeDragHandler(simulation) {
    const dragStarted = (node) => {
        if (!d3.event.active) simulation.alphaTarget(0.3).restart();
        node.fx = node.x;
        node.fy = node.y;
    };

    const onDrag = (node) => {
        node.fx = event.x;
        node.fy = event.y;
    };

    const dragEnded = (node) => {
        if (!d3.event.active) simulation.alphaTarget(0);
        node.fx = null;
        node.fy = null;
    };

    return d3.drag()
        .on('start', dragStarted)
        .on('drag', onDrag)
        .on('end', dragEnded);
}
