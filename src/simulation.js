import {
    forceSimulation,
    forceCollide,
    forceLink,
    forceManyBody,
    forceCenter
} from 'd3';


export default function Simulation({ x, y }, { charge, linkDistance }) {
    const simulation = forceSimulation()
        .force('collide', forceCollide(20))
        .force('link', forceLink()
            .distance(linkDistance))
        .force('charge', forceManyBody()
            .strength(-charge)
            .distanceMax(400))
        .force('center', forceCenter(x, y))
        .stop();

    simulation.init = ({ nodes, links }) => {
        simulation
            .nodes(nodes)
            .force('link')
            .links(links);

        const alpha = simulation.alpha();

        if (alpha < 1) {
            simulation.alpha(0.8);
        }

        if (alpha === 1) {
            for (let i = 0; i < 30; i++) {
                simulation.tick();
            }
        }

        simulation.restart();
    };

    return simulation;
}
