import {
    forceSimulation,
    forceCollide,
    forceLink,
    forceManyBody,
    forceCenter,
    scaleLinear
} from 'd3';

const maxFlow = items => items.reduce((max, item) => Math.max(max, item.flow), -Infinity);
const minFlow = items => items.reduce((min, item) => Math.min(min, item.flow), Infinity);

export default function Simulation({ x, y }, linkDistance = 250, charge = 500) {
    const simulation = forceSimulation()
        .force('collide', forceCollide(70))
        .force('link', forceLink())
        .force('charge', forceManyBody()
            .strength(-charge)
            .distanceMax(400))
        .force('center', forceCenter(x, y))
        .stop();

    const nIterations = 100;

    simulation.alphaDecay(1 - Math.pow(0.001, 1/nIterations));

    simulation.init = ({ nodes, links }) => {
        const maxLinkFlow = maxFlow(links);
        const minLinkFlow = minFlow(links);

        const distance = scaleLinear().domain([minLinkFlow, maxLinkFlow]).range([linkDistance, 100]);
        const linkStrength = scaleLinear().domain([minLinkFlow, maxLinkFlow]).range([0.5, 1]);
        const defaultStrength = simulation.force('link').strength();

        simulation
            .nodes(nodes)
            .force('link')
            .links(links)
            .distance(link => distance(link.flow))
            .strength(link => linkStrength(link.flow) * defaultStrength(link));

        if (nodes.nodes) {
            const mass = scaleLinear().domain([minFlow(nodes), maxFlow(nodes)]).range([0.5, 1]);

            simulation
                .force('charge')
                .strength(node => -charge * mass(node.flow));
        }

        const alpha = simulation.alpha();

        if (alpha < 1) {
            simulation.alpha(0.8);
        }

        for (let i = 0; i < 23; i++) {
            simulation.tick();
        }

        simulation.restart();
    };

    return simulation;
}
