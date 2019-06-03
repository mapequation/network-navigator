import * as d3 from "d3";
import PropTypes from "prop-types";
import React from "react";
import { connectedLinks, takeLargest as largestNodes } from "../lib/filter";
import { halfLink, undirectedLink } from "../lib/link-renderer";
import NetworkLayout from "../lib/network-layout";
import Point from "../lib/point";
import makeRenderStyle from "../lib/render-style";


function takeLargest(network, amount) {
  let { nodes, links } = network;

  nodes.forEach(node => node.shouldRender = false);
  links.forEach(link => link.shouldRender = false);

  nodes = largestNodes(nodes, amount);
  links = links.filter(link => link.flow > 0);
  links = connectedLinks({ nodes, links });

  nodes.forEach(node => node.shouldRender = true);
  links.forEach(link => link.shouldRender = true);
}

export default class NetworkNavigator extends React.Component {
  static propTypes = {
    root: PropTypes.any.isRequired,
    width: PropTypes.number.isRequired,
    height: PropTypes.number.isRequired,
    setSelectedNode: PropTypes.func,
    setSearchFunction: PropTypes.func,
    nodeSizeBasedOn: PropTypes.string,
    nodeSizeScale: PropTypes.string,
    linkWidthScale: PropTypes.string,
    simulationEnabled: PropTypes.bool
  };

  static defaultProps = {
    setSelectedNode: () => null,
    setSearchFunction: () => null,
    nodeSizeBasedOn: "flow",
    nodeSizeScale: "root",
    linkWidthScale: "root",
    simulationEnabled: true
  };

  layouts = new Map();

  constructor(props) {
    super(props);
    const { root, setSearchFunction } = props;
    const { layouts } = this;

    setSearchFunction((name) => {
      const hits = props.root.search(name);
      layouts.forEach(l => l.updateAttributes());
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
      occurrences
    } = this.props;
    const { layouts, renderStyle } = this;

    if (nodeSizeBasedOn !== prevProps.nodeSizeBasedOn || nodeSizeScale !== prevProps.nodeSizeScale) {
      const scale = nodeSizeScale === "linear" ? d3.scaleLinear : d3.scaleSqrt;

      if (nodeSizeBasedOn === "flow") {
        const nodeRadius = scale().domain([0, root.maxNodeFlow]).range([10, 70]);
        const nodeFillColor = scale().domain([0, root.maxNodeFlow]).range(renderStyle.nodeFill);
        renderStyle.nodeRadius = node => nodeRadius(node.flow);
        renderStyle.nodeFillColor = node => nodeFillColor(node.flow);
      } else if (nodeSizeBasedOn === "nodes") {
        const nodeRadius = scale().domain([0, root.totalChildren]).range([10, 70]);
        const nodeFillColor = scale().domain([0, root.totalChildren]).range(renderStyle.nodeFill);
        renderStyle.nodeRadius =
          node => node.totalChildren ? nodeRadius(node.totalChildren) : nodeRadius(1);
        renderStyle.nodeFillColor =
          node => node.totalChildren ? nodeFillColor(node.totalChildren) : nodeFillColor(1);
      }

      layouts.forEach(layout => layout.renderStyle = renderStyle);
    }

    if (linkWidthScale !== prevProps.linkWidthScale) {
      const scale = linkWidthScale === "linear" ? d3.scaleLinear : d3.scaleSqrt;

      const linkWidth = scale().domain([0, root.maxLinkFlow]).range([2, 15]);
      const linkFillColor = scale().domain([0, root.maxLinkFlow]).range(renderStyle.linkFill);
      renderStyle.linkWidth = link => linkWidth(link.flow);
      renderStyle.linkFillColor = link => linkFillColor(link.flow);

      layouts.forEach(layout => layout.renderStyle = renderStyle);
    }

    if (occurrences) {
      root.clearOccurrences();
      occurrences.forEach(o => root.markOccurrences(o));
    }

    if (labelsVisible != null) {
      layouts.forEach(layout => layout.labelsVisible = labelsVisible);
    }

    if (simulationEnabled !== prevProps.simulationEnabled) {
      layouts.forEach(layout => layout.simulationEnabled = simulationEnabled);
    }

    layouts.forEach(layout => layout.updateAttributes());
  }

  renderPath(currentPath) {
    const { root, setSelectedNode } = this.props;
    const { layouts } = this;

    const treeNode = root.getNodeByPath(currentPath);

    takeLargest(treeNode, 20);

    const layout = layouts.get(currentPath);

    layout.on("click", (node) => {
      console.log(node);
      setSelectedNode(node);
      layouts.forEach(l => l.clearSelectedNodes());
    });

    layout.on("render", ({ path, layout }) => {
      layouts.set(path, layout);
      this.renderPath(path);
    });

    layout.on("destroy", (path) => {
      const layoutToDelete = layouts.get(path);
      if (layoutToDelete) {
        layoutToDelete.destroy();
        layouts.delete(path);
      }
    });

    layout.init(treeNode);
  }

  componentDidMount() {
    const { root, width, height, setSelectedNode } = this.props;
    const { svgNode, linkRenderer, renderStyle, layouts } = this;

    const zoom = d3.zoom()
      .scaleExtent([0.1, 100000]);

    const svg = d3.select(svgNode)
      .call(zoom);

    const network = svg.select("#network");

    zoom.on("zoom", () => {
      layouts.forEach(layout =>
        layout.applyTransform(d3.event.transform).updateAttributes());
      network.attr("transform", d3.event.transform);
    });

    svg.select(".background")
      .on("click", () => {
        console.log(root);
        setSelectedNode(root);
        layouts.forEach(l => l.clearSelectedNodes());
      });

    const rootPath = root.path.toString();

    layouts.set(rootPath, new NetworkLayout({
      linkRenderer,
      renderStyle,
      renderTarget: {
        parent: network.append("g").attr("class", "network"),
        labels: svg.select("#labelsContainer").append("g")
          .attr("class", "network labels")
      },
      position: new Point(width / 2, height / 2)
    }));

    this.renderPath(rootPath);
  }

  render() {
    return (
      <svg
        ref={node => this.svgNode = node}
        style={{ width: "100vw", height: "100vh" }}
        xmlns={d3.namespaces.svg}
        xmlnsXlink={d3.namespaces.xlink}
        id="networkNavigatorSvg"
      >
        <rect className='background' width="100%" height="100%" fill='#fff'/>
        <g id='network'/>
        <g id='labelsContainer'/>
      </svg>
    );
  }
}
