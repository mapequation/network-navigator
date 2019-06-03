import { select } from "d3";


export function highlightLinks(node) {
  if (node.visible) return;

  const outColor = "#f48074";
  const inColor = "#ba6157";

  const links = select(this.parentElement.parentElement)
    .select(".links")
    .selectAll(".link");

  links.filter(d => d.target === node)
    .raise()
    .style("fill", inColor);
  links.filter(d => d.source === node)
    .raise()
    .style("fill", outColor);
}

export function restoreLinks({ nodeBorderColor, linkFillColor }) {
  return function() {
    select(this.parentElement.parentElement)
      .select(".links").selectAll(".link")
      .sort((a, b) => a.flow - b.flow)
      .style("fill", linkFillColor);
  };
}
