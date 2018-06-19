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
        root: PropTypes.any.isRequired,
        width: PropTypes.number,
        height: PropTypes.number,
        setSelectedNode: PropTypes.func,
        setSearchFunction: PropTypes.func,
        nodeSizeBasedOn: PropTypes.string,
        nodeSizeScale: PropTypes.string,
        linkWidthScale: PropTypes.string,
        simulationEnabled: PropTypes.bool,
    };

    static defaultProps = {
        width: window.innerWidth,
        height: window.innerHeight,
        setSelectedNode: () => null,
        setSearchFunction: () => null,
        nodeSizeBasedOn: 'flow',
        nodeSizeScale: 'root',
        linkWidthScale: 'root',
        simulationEnabled: true,
    };

    constructor(props) {
        super(props);
        this.layouts = new Map();

        const { root, setSearchFunction } = props;

        setSearchFunction((name) => {
            const hits = this.props.root.search(name);
            this.layouts.forEach(l => l.updateAttributes())
            return hits;
        });

        this.renderStyle = makeRenderStyle(root.maxNodeFlow, root.maxNodeExitFlow, root.maxLinkFlow);

        if (root.directed) {
            this.linkRenderer = halfLink()
                .nodeRadius(node => this.renderStyle.nodeRadius(node))
                .width(link => this.renderStyle.linkWidth(link))
                .oppositeLink(link => link.oppositeLink)
                .bend((link, distance) => this.renderStyle.linkBend(distance));
        } else {
            this.linkRenderer = undirectedLink()
                .nodeRadius(node => this.renderStyle.nodeRadius(node))
                .width(link => this.renderStyle.linkWidth(link))
                .bend((link, distance) => this.renderStyle.linkBend(distance));
        }
    }

    componentDidUpdate(prevProps) {
        const {
            root,
            nodeSizeBasedOn,
            nodeSizeScale,
            linkWidthScale,
            labelsVisible,
            simulationEnabled,
        } = this.props;

        if (nodeSizeBasedOn !== prevProps.nodeSizeBasedOn || nodeSizeScale !== prevProps.nodeSizeScale) {
            const scale = nodeSizeScale === 'linear' ? d3.scaleLinear : d3.scaleSqrt;

            if (nodeSizeBasedOn === 'flow') {
                const nodeRadius = scale().domain([0, root.maxNodeFlow]).range([10, 70]);
                const nodeFillColor = scale().domain([0, root.maxNodeFlow]).range(this.renderStyle.nodeFill);
                this.renderStyle.nodeRadius = node => nodeRadius(node.flow);
                this.renderStyle.nodeFillColor = node => nodeFillColor(node.flow);
            } else if (nodeSizeBasedOn === 'nodes') {
                const nodeRadius = scale().domain([0, root.totalChildren]).range([10, 70]);
                const nodeFillColor = scale().domain([0, root.totalChildren]).range(this.renderStyle.nodeFill);
                this.renderStyle.nodeRadius = node => node.totalChildren ? nodeRadius(node.totalChildren) : nodeRadius(1);
                this.renderStyle.nodeFillColor = node => node.totalChildren ? nodeFillColor(node.totalChildren) : nodeFillColor(1);
            }

            this.layouts.forEach(layout => layout.renderStyle = this.renderStyle);
        }

        if (linkWidthScale !== prevProps.linkWidthScale) {
            const scale = linkWidthScale === 'linear' ? d3.scaleLinear : d3.scaleSqrt;

            const linkWidth = scale().domain([0, root.maxLinkFlow]).range([2, 15]);
            const linkFillColor = scale().domain([0, root.maxLinkFlow]).range(this.renderStyle.linkFill);
            this.renderStyle.linkWidth = link => linkWidth(link.flow);
            this.renderStyle.linkFillColor = link => linkFillColor(link.flow);

            this.layouts.forEach(layout => layout.renderStyle = this.renderStyle);
        }

        if (this.props.occurrences) {
            root.clearOccurrences();
            this.props.occurrences.forEach(o => root.markOccurrences(o));
        }

        if (labelsVisible != null) {
            this.layouts.forEach(layout => layout.labelsVisible = labelsVisible);
        }

        if (simulationEnabled !== prevProps.simulationEnabled) {
            this.layouts.forEach(layout => layout.simulationEnabled = simulationEnabled);
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
        const { root } = this.props;

        const treeNode = root.getNodeByPath(currentPath);

        this.takeLargest(treeNode, 20);

        const layout = this.layouts.get(currentPath);

        layout.on('click', (node) => {
            console.log(node);
            this.props.setSelectedNode(node);
            this.layouts.forEach(l => l.clearSelectedNodes());
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
        const { root, width, height } = this.props;

        const zoom = d3.zoom()
            .scaleExtent([0.1, 100000]);

        const svg = d3.select(this.svgNode)
            .call(zoom);

        const network = svg.select('#network');

        zoom.on('zoom', () => {
                this.layouts.forEach(layout =>
                    layout.applyTransform(d3.event.transform).updateAttributes());
                network.attr('transform', d3.event.transform);
            });

        svg.select('.background')
            .on('click', () => {
                console.log(root);
                this.props.setSelectedNode(root);
                this.layouts.forEach(l => l.clearSelectedNodes());
            });

        const rootPath = root.path.toString();

        this.layouts.set(rootPath, new NetworkLayout({
            linkRenderer: this.linkRenderer,
            renderStyle: this.renderStyle,
            renderTarget: {
                parent: network.append('g').attr('class', 'network'),
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
