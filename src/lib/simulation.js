import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  scaleLinear,
} from "d3";

const maxFlow = (items) =>
  items.reduce((max, item) => Math.max(max, item.flow), -Infinity);
const minFlow = (items) =>
  items.reduce((min, item) => Math.min(min, item.flow), Infinity);

const LINK_DISTANCE_MIN = 100;
const LINK_DISTANCE_MAX = 250;
const CHARGE = 500;
const DISTANCE_MAX = 400;
const LINK_STRENGTH_MIN = 0.5;
const LINK_STRENGTH_MAX = 1;
const NODE_MASS_MIN = 0.5;
const NODE_MASS_MAX = 1;
// const LINK_DISTANCE_MIN = 10;
// const LINK_DISTANCE_MAX = 25;
// const CHARGE = 5;
// const DISTANCE_MAX = 40;
// const LINK_STRENGTH_MIN = 5;
// const LINK_STRENGTH_MAX = 10;
// const NODE_MASS_MIN = 0.5;
// const NODE_MASS_MAX = 1;

export default function Simulation(
  { x, y },
  linkDistance = LINK_DISTANCE_MAX,
  charge = CHARGE,
) {
  const simulation = forceSimulation()
    .force("collide", forceCollide(70))
    .force("link", forceLink())
    .force(
      "charge",
      forceManyBody()
        .strength(-charge)
        .distanceMax(DISTANCE_MAX),
    )
    .force("center", forceCenter(x, y))
    .stop();

  const nIterations = 100;

  simulation.alphaDecay(1 - Math.pow(0.001, 1 / nIterations));

  simulation.init = ({ nodes, links }) => {
    const maxLinkFlow = maxFlow(links);
    const minLinkFlow = minFlow(links);

    const distance = scaleLinear()
      .domain([minLinkFlow, maxLinkFlow])
      .range([linkDistance, LINK_DISTANCE_MIN]);
    const linkStrength = scaleLinear()
      .domain([minLinkFlow, maxLinkFlow])
      .range([LINK_STRENGTH_MIN, LINK_STRENGTH_MAX]);
    const defaultStrength = simulation.force("link").strength();

    simulation
      .nodes(nodes)
      .force("link")
      .links(links)
      .distance((link) => distance(link.flow))
      .strength((link) => linkStrength(link.flow) * defaultStrength(link));

    if (nodes.nodes) {
      const mass = scaleLinear()
        .domain([minFlow(nodes), maxFlow(nodes)])
        .range([NODE_MASS_MIN, NODE_MASS_MAX]);

      simulation.force("charge").strength((node) => -charge * mass(node.flow));
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
