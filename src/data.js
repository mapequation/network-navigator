const data = {
    nodes: [
        {
            x: 150,
            y: 110,
            flow: 0.6,
            outFlow: 0.1,
        },
        {
            x: 400,
            y: 250,
            flow: 0.4,
            outFlow: 0.2,
        },
        {
            x: 550,
            y: 100,
            flow: 0.2,
            outFlow: 0.4,
        },
        {
            x: 300,
            y: 470,
            flow: 0.5,
            outFlow: 0.2,
        },
    ],
    links: [
        {
            source: 0,
            target: 1,
            flow: 0.1,
            oppositeLink: 1,
        },
        {
            source: 1,
            target: 0,
            flow: 0.6,
            oppositeLink: 0,
        },
        {
            source: 2,
            target: 1,
            flow: 0.5,
            oppositeLink: 1,
        },
        {
            source: 1,
            target: 2,
            flow: 0.2,
            oppositeLink: 2,
        },
        {
            source: 3,
            target: 1,
            flow: 0.5,
            oppositeLink: 1,
        },
        {
            source: 1,
            target: 3,
            flow: 0.1,
            oppositeLink: 3,
        },
    ],
};

// Connect network
data.links.forEach((link) => {
    link.source = data.nodes[link.source];
    link.target = data.nodes[link.target];
});

export default data;
