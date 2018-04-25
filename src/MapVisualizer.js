import React, { Component } from 'react';
import * as d3 from 'd3';
import { maxBy, flatMap } from 'lodash';
import { halfLink, undirectedLink } from './lib/link-renderer';
import parseFile from './lib/parse-file';
import parseFTree from './lib/file-formats/ftree';
import networkFromFTree from './lib/file-formats/network-from-ftree';
import { traverseDepthFirst } from './lib/network';
import NetworkLayout from './lib/network-layout';
import Simulation from './lib/simulation';
import makeRenderStyle from './lib/render-style';
import Point from './lib/point';
import {
    takeLargest,
    connectedLinks,
} from './lib/filter';

const ZOOM_EXTENT_MIN = 0.1;
const ZOOM_EXTENT_MAX = 100000;

export default class MapVisualizer extends Component {
    state = {
        filename: 'data/data_merged_1_compressed_12958_no_modulenames_expanded.ftree',
        //filename: 'data/science2001.ftree',
        nodeFlowFactor: 1,
        path: 'root',
        linkDistance: 250,
        charge: 500,
        search: '',
        selected: null,
        name: '',
    }

    componentDidMount() {
        this.loadDefaultFile();
    }

    loadDefaultFile() {
        const { filename } = this.state;

        fetch(filename)
            .then(res => res.text())
            .then(parseFile)
            .then((parsed) => {
                const ftree = parseFTree(parsed.data);
                const network = networkFromFTree(ftree);
                this.run(network);
            })
            .catch(err => console.error(err));
    }

    run(network) {
        const { width, height } = this.props;

        const svg = d3.select(this.svgNode);
        const root = d3.select('#network');
        const labels = d3.select('#labelsContainer');

        const entireNetwork = Array.from(traverseDepthFirst(network));
        const maxNodeFlow = maxBy(entireNetwork, node => node.flow).flow;
        const maxLinkFlow = maxBy(flatMap(entireNetwork, node => node.links || []),
            link => link.flow).flow;

        const renderStyle = makeRenderStyle(maxNodeFlow, maxLinkFlow);

        const linkRenderer = (network.directed ? halfLink : undirectedLink)()
            .nodeRadius(renderStyle.nodeRadius)
            .width(renderStyle.linkWidth);

        const layouts = new Map();

        const zoom = d3.zoom()
            .scaleExtent([ZOOM_EXTENT_MIN, ZOOM_EXTENT_MAX])
            .on('zoom', () => {
                layouts.forEach(layout =>
                    layout.applyTransform(d3.event.transform).updateAttributes());
                root.attr('transform', d3.event.transform);
            });

        svg.call(zoom)
            .on('dblclick.zoom', null);

        layouts.set(this.state.path, NetworkLayout({
            linkRenderer,
            style: renderStyle,
            renderTarget: {
                parent: root.append('g').attr('class', 'network'),
                labels: labels.append('g').attr('class', 'network labels'),
            },
            localTransform: null,
            simulation: Simulation(new Point(width / 2, height / 2), this.state)
        }));

        const render = () => {
            const branch = network.getNodeByPath(this.state.path);
            let { nodes, links } = branch;

            nodes.forEach(node => node.shouldRender = false);
            links.forEach(link => link.shouldRender = false);

            nodes = takeLargest(nodes, 20);
            links = links.filter(link => link.flow > 0);
            links = connectedLinks({ nodes, links });

            nodes.forEach(node => node.shouldRender = true);
            links.forEach(link => link.shouldRender = true);

            const layout = layouts.get(this.state.path);

            layout.on('click', (node) => {
                console.log(node);
                this.props.selectedNode(node);
                //state.selected = node;
                //state.name = node ? node.name || node.largest.map(n => n.name).join(', ') : '';
            }).on('render', ({ network, localTransform, renderTarget }) => {
                this.setState({ path: network.path });

                layouts.set(network.path, NetworkLayout({
                    linkRenderer,
                    style: renderStyle,
                    localTransform,
                    renderTarget,
                    simulation: Simulation(Point.from(network), this.state),
                }));

                render();
            }).on('destroy', (path) => {
                const oldLayout = layouts.get(path);
                if (oldLayout) {
                    oldLayout.destroy();
                    layouts.delete(path);
                }
            }).init(branch);
        };

        this.props.loadingComplete();
        this.props.searchFunction((name) => {
            const hits = network.search(name);
            layouts.forEach(l => l.updateAttributes());
            return hits;
        });
        this.props.selectedNode(network);

        render();
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
