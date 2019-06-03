import { scaleLinear } from "d3";


export function linkByIndex(links) {
  const nAlwaysShow = 5;
  const len = links.length || 1;
  const alwaysVisibleFraction = nAlwaysShow / len;
  const visibleIndices =
    scaleLinear().domain([0.55, 1.7]).range([1 / len, 1]).clamp(true);

  if (len < nAlwaysShow) {
    // k => l => true
    return () => () => true;
  }

  return (k = 1) => l => 1 - l.index / len - alwaysVisibleFraction <= visibleIndices(k);
}

export function nodeByIndex(nodes) {
  const visibleIndices =
    scaleLinear().domain([0.65, 1]).range([1, nodes.length]).clamp(true);
  return (k = 1) => n => n.id <= visibleIndices(k);
}
