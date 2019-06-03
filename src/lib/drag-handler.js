import { drag, event } from "d3";


export default function makeDragHandler(simulation) {
  const onDragStart = (node) => {
    if (!event.active) simulation.alphaTarget(0.3).restart();
    node.fx = node.x;
    node.fy = node.y;
  };

  const onDrag = (node) => {
    node.fx = event.x;
    node.fy = event.y;
  };

  const onDragEnd = (node) => {
    simulation.alphaTarget(0);
    node.fx = null;
    node.fy = null;
  };

  return drag()
    .on("start", onDragStart)
    .on("drag", onDrag)
    .on("end", onDragEnd);
}
