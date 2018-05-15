import React from 'react';
import PropTypes from 'prop-types';
import * as d3 from 'd3';
import { halfLink, undirectedLink } from './lib/link-renderer';
import NetworkLayout from './lib/network-layout';
import makeRenderStyle from './lib/render-style';
import Point from './lib/point';
import { takeLargest, connectedLinks } from './lib/filter';

export default class NetworkNavigator extends React.Component {
    static propTypes = {
        network: PropTypes.any.isRequired,
        width: PropTypes.number,
        height: PropTypes.number,
        setSelectedNode: PropTypes.func,
        setSearchFunction: PropTypes.func,
        sizeBasedOn: PropTypes.string,
    };

    static defaultProps = {
        width: window.innerWidth,
        height: window.innerHeight,
        setSelectedNode: () => null,
        setSearchFunction: () => null,
        sizeBasedOn: 'flow',
    };

    constructor(props) {
        super(props);
        this.layouts = new Map();

        const { network, setSearchFunction } = props;

        setSearchFunction((name) => {
            const hits = this.props.network.search(name);
            this.layouts.forEach(l => l.updateAttributes())
            return hits;
        });

        this.renderStyle = makeRenderStyle(network.maxNodeFlow, network.maxNodeExitFlow, network.maxLinkFlow);

        this.linkRenderer = (network.directed ? halfLink : undirectedLink)()
            .nodeRadius(node => this.renderStyle.nodeRadius(node))
            .width(link => this.renderStyle.linkWidth(link))
            .bend((link, distance) => this.renderStyle.linkBend(distance));
    }

    componentDidUpdate(prevProps) {
        const { network } = this.props;

        if (this.props.sizeBasedOn !== prevProps.sizeBasedOn) {
            if (this.props.sizeBasedOn === 'flow') {
                const nodeRadius = d3.scaleSqrt().domain([0, network.maxNodeFlow]).range([10, 70]);
                this.renderStyle.nodeRadius = node => nodeRadius(node.flow);
            } else if (this.props.sizeBasedOn === 'nodes') {
                const nodeRadius = d3.scaleSqrt().domain([0, network.maxNodeCount]).range([5, 70]);
                this.renderStyle.nodeRadius = node => node.nodes ? nodeRadius(node.nodes.length) : nodeRadius(1);
            }

            this.layouts.forEach(layout => {
                layout.renderStyle = this.renderStyle;
            });
        }

        this.layouts.forEach(layout => layout.updateAttributes());
    }

    takeLargest(network, amount) {
        let { nodes, links } = network;

        nodes.forEach(node => node.shouldRender = false);
        links.forEach(link => link.shouldRender = false);

        nodes = takeLargest(nodes, amount);
        links = links.filter(link => link.flow > 0);
        links = connectedLinks({ nodes, links });

        nodes.forEach(node => node.shouldRender = true);
        links.forEach(link => link.shouldRender = true);
    };

    renderPath(currentPath) {
        const { network } = this.props;

        const treeNode = network.getNodeByPath(currentPath);

        this.takeLargest(treeNode, 20);

        const layout = this.layouts.get(currentPath);

        layout.on('click', (node) => {
            console.log(node);
            this.props.setSelectedNode(node);
        });

        layout.on('render', ({ path, layout }) => {
            this.layouts.set(path, layout);
            this.renderPath(path);
        });

        layout.on('destroy', (path) => {
            const layoutToDelete = this.layouts.get(path);
            if (layoutToDelete) {
                layoutToDelete.destroy();
                this.layouts.delete(path);
            }
        });

        layout.init(treeNode);
    }

    componentDidMount() {
        const { network, width, height } = this.props;

        const zoom = d3.zoom()
            .scaleExtent([0.1, 100000]);

        const svg = d3.select(this.svgNode)
            .call(zoom);

        const root = svg.select('#network');

        zoom.on('zoom', () => {
                this.layouts.forEach(layout =>
                    layout.applyTransform(d3.event.transform).updateAttributes());
                root.attr('transform', d3.event.transform);
            });

        svg.select('.background')
            .on('click', () => {
                console.log(network);
                this.props.setSelectedNode(network);
            });

        const rootPath = network.path.toString();

        this.layouts.set(rootPath, new NetworkLayout({
            linkRenderer: this.linkRenderer,
            renderStyle: this.renderStyle,
            renderTarget: {
                parent: root.append('g').attr('class', 'network'),
                labels: svg.select('#labelsContainer').append('g')
                    .attr('class', 'network labels'),
            },
            position: new Point(width / 2, height / 2),
        }));

        this.renderPath(rootPath);
    }

    render() {
        const { width, height } = this.props;

        return (
            <svg ref={node => this.svgNode = node}
                width={width}
                height={height}
                xmlns='http://www.w3.org/2000/svg'>
                <rect className='background' width={width} height={height} fill='#fff'></rect>
                <g id='network'></g>
                <g id='labelsContainer'></g>
            </svg>
        );
    }
}
