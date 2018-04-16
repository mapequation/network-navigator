import {
    scaleLinear,
    scaleSqrt
} from 'd3';

export function linkByIndex(links) {
    const nAlwaysShow = 5;
    const len = links.length || 1;
    const alwaysVisibleFraction = nAlwaysShow / len;
    const visibleIndices =
        scaleLinear().domain([0.65, 1.7]).range([1 / len, 1]).clamp(true);

    if (len < nAlwaysShow) {
        return k => l => true;
    }

    return (k = 1) => l => 1 - l.index / len - alwaysVisibleFraction <= visibleIndices(k);
}

export function backbone(links) {
    const pValues = links
        .map(link => ({ n: link.flowNormalized, kout: link.source.kout }))
        .map(({ n, kout }) => Math.pow(1 - n, Math.max(kout, 2) - 1))
    const pMin = pValues.reduce((min, p) => Math.min(min, p), Infinity);
    const pMax = pValues.reduce((max, p) => Math.max(max, p), -Infinity);

    const zoomScaleToPvalue =
        scaleSqrt().domain([0.1, 1.5]).range([0.05, 1]).clamp(true);

    return (k = 1) => l => {
        const p = zoomScaleToPvalue(k);
        const n = l.flowNormalized;
        const kout = Math.max(l.source.kout, 2);
        return 1 - n < Math.pow(p, 1/(kout - 1));
    };
}

export function nodeByIndex(nodes) {
    const visibleIndices =
        scaleLinear().domain([0.65, 1]).range([1, nodes.length]).clamp(true);
    return (k = 1) => n => n.id <= visibleIndices(k);
}
