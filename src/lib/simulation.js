import {
    forceSimulation,
    forceCollide,
    forceLink,
    forceManyBody,
    forceCenter,
    scaleLinear
} from 'd3';


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
        const maxLinkFlow = links.reduce((max, link) => Math.max(max, link.flow), -Infinity);
        const minLinkFlow = links.reduce((min, link) => Math.min(min, link.flow), Infinity);
        const minDistance = 100;
        const maxDistance = linkDistance;

        const distance = scaleLinear().domain([minLinkFlow, maxLinkFlow]).range([maxDistance, minDistance]);

        const force = scaleLinear().domain([minLinkFlow, maxLinkFlow]).range([0.5, 1]);

        const defaultStrength = simulation.force('link').strength();

        const linkStrength = link => force(link.flow) * defaultStrength(link);

        simulation
            .nodes(nodes)
            .force('link')
            .links(links)
            .distance(l => distance(l.flow))
            .strength(linkStrength)

        const alpha = simulation.alpha();

        if (alpha < 1) {
            simulation.alpha(0.8);
        }

        for (let i = 0; i < 80; i++) {
            simulation.tick();
        }

        simulation.restart();
    };

    return simulation;
}
