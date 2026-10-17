/**
 * A raw network's preliminary flow until Infomap runs: each node's weighted
 * degree over the total, the stationary flow of the network read as
 * undirected. A self-link counts once, as in Infomap
 * (`sumWeightedDegree = 2 · sumLinkWeight − sumSelfLinkWeight`). All zeros
 * without link weight. O(nodes + links).
 */
export function degreeFlow(
  nodeCount: number,
  source: ArrayLike<number>,
  target: ArrayLike<number>,
  weight?: ArrayLike<number> | null,
): Float32Array {
  const degree = new Float64Array(nodeCount);
  let total = 0;
  for (let e = 0; e < source.length; e++) {
    const w = weight ? (weight[e] ?? 0) : 1;
    const s = source[e] ?? -1;
    const t = target[e] ?? -1;
    degree[s] += w;
    total += w;
    if (t !== s) {
      degree[t] += w;
      total += w;
    }
  }
  const flow = new Float32Array(nodeCount);
  if (total > 0)
    for (let i = 0; i < nodeCount; i++) flow[i] = degree[i] / total;
  return flow;
}
