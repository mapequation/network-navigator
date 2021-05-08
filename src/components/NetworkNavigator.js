import * as d3 from "d3";
import PropTypes from "prop-types";
import React from "react";
import { connectedLinks, takeLargest as largestNodes } from "../lib/filter";
import { halfLink, undirectedLink } from "../lib/link-renderer";
import NetworkLayout from "../lib/network-layout";
import Point from "../lib/point";
import makeRenderStyle from "../lib/render-style";
import Dispatch from "../context/Dispatch";

function takeLargest(network, amount) {
  let { nodes, links } = network;

  nodes.forEach((node) => (node.shouldRender = false));
  links.forEach((link) => (link.shouldRender = false));

  nodes = largestNodes(nodes, amount);
  links = links.filter((link) => link.flow > 0);
  links = connectedLinks({ nodes, links });

  nodes.forEach((node) => (node.shouldRender = true));
  links.forEach((link) => (link.shouldRender = true));
}

export default class NetworkNavigator extends React.Component {
  static propTypes = {
    network: PropTypes.any.isRequired,
    nodeSize: PropTypes.string,
    nodeScale: PropTypes.string,
    linkScale: PropTypes.string,
    labelsVisible: PropTypes.bool,
    simulationEnabled: PropTypes.bool,
    lodEnabled: PropTypes.bool,
  };

  static contextType = Dispatch;

  constructor(props) {
    super(props);
    const { network } = props;
    this.layouts = new Map();

    this.renderStyle = makeRenderStyle(
      network.maxNodeFlow,
      network.maxNodeExitFlow,
      network.maxLinkFlow,
    );

    if (network.directed) {
      this.linkRenderer = halfLink()
        .nodeRadius((node) => this.renderStyle.nodeRadius(node))
        .width((link) => this.renderStyle.linkWidth(link))
        .oppositeLink((link) => link.oppositeLink)
        .bend((link, distance) => this.renderStyle.linkBend(distance));
    } else {
      this.linkRenderer = undirectedLink()
        .nodeRadius((node) => this.renderStyle.nodeRadius(node))
        .width((link) => this.renderStyle.linkWidth(link))
        .bend((link, distance) => this.renderStyle.linkBend(distance));
    }
  }

  componentDidUpdate(prevProps) {
    const {
      network,
      occurrences,
      nodeSize,
      nodeScale,
      linkScale,
      labelsVisible,
      simulationEnabled,
      lodEnabled,
      nodeLimit,
    } = this.props;

    if (nodeSize !== prevProps.nodeSize || nodeScale !== prevProps.nodeScale) {
      const scale = nodeScale === "linear" ? d3.scaleLinear : d3.scaleSqrt;

      if (nodeSize === "flow") {
        const nodeRadius = scale()
          .domain([0, network.maxNodeFlow])
          .range([10, 70]);
        const nodeFillColor = scale()
          .domain([0, network.maxNodeFlow])
          .range(this.renderStyle.nodeFill);
        this.renderStyle.nodeRadius = (node) => nodeRadius(node.flow);
        this.renderStyle.nodeFillColor = (node) => nodeFillColor(node.flow);
      } else if (nodeSize === "nodes") {
        const nodeRadius = scale()
          .domain([0, network.totalChildren])
          .range([10, 70]);
        const nodeFillColor = scale()
          .domain([0, network.totalChildren])
          .range(this.renderStyle.nodeFill);
        this.renderStyle.nodeRadius = (node) =>
          node.totalChildren ? nodeRadius(node.totalChildren) : nodeRadius(1);
        this.renderStyle.nodeFillColor = (node) =>
          node.totalChildren
            ? nodeFillColor(node.totalChildren)
            : nodeFillColor(1);
      }
    }

    if (linkScale !== prevProps.linkScale) {
      const scale = linkScale === "linear" ? d3.scaleLinear : d3.scaleSqrt;
      const linkWidth = scale()
        .domain([0, network.maxLinkFlow])
        .range([2, 15]);
      const linkFillColor = scale()
        .domain([0, network.maxLinkFlow])
        .range(this.renderStyle.linkFill);
      this.renderStyle.linkWidth = (link) => linkWidth(link.flow);
      this.renderStyle.linkFillColor = (link) => linkFillColor(link.flow);
    }

    if (occurrences) {
      network.clearOccurrences();
      occurrences.forEach((o) => network.markOccurrences(o));
    }

    this.layouts.forEach((layout) => {
      layout.renderStyle = this.renderStyle;
      layout.labelsVisible = labelsVisible;
      layout.simulationEnabled = simulationEnabled;
      layout.lodEnabled = lodEnabled;
      layout.nodeLimit = nodeLimit;
      layout.updateAttributes();
    });
  }

  renderPath(currentPath) {
    const { network, nodeLimit } = this.props;
    const { dispatch } = this.context;

    const treeNode = network.getNodeByPath(currentPath);

    takeLargest(treeNode, nodeLimit);

    const layout = this.layouts.get(currentPath);

    layout.on("click", (node) => {
      console.log(node);
      dispatch({ type: "selectedNode", value: node });
      this.layouts.forEach((l) => l.clearSelectedNodes());
    });

    layout.on("render", ({ path, layout }) => {
      this.layouts.set(path, layout);
      this.renderPath(path);
    });

    layout.on("destroy", (path) => {
      const layoutToDelete = this.layouts.get(path);
      if (layoutToDelete) {
        layoutToDelete.destroy();
        this.layouts.delete(path);
      }
    });

    layout.init(treeNode);
  }

  componentDidMount() {
    const { network, nodeLimit } = this.props;
    const { dispatch } = this.context;
    const { innerWidth, innerHeight } = window;

    dispatch({
      type: "searchCallback",
      value: (name) => {
        const hits = network.search(name);
        this.layouts.forEach((l) => l.updateAttributes());
        return hits;
      },
    });

    const zoom = d3.zoom().scaleExtent([0.1, 100000]);

    const svg = d3.select(this.svgNode).call(zoom);

    const networkEl = svg.select("#network");

    zoom.on("zoom", () => {
      this.layouts.forEach((layout) =>
        layout.applyTransform(d3.event.transform).updateAttributes(),
      );
      networkEl.attr("transform", d3.event.transform);
    });

    svg.select(".background").on("click", () => {
      console.log(network);
      dispatch({ type: "selectedNode", value: network });
      this.layouts.forEach((l) => l.clearSelectedNodes());
    });

    const rootPath = network.path.toString();

    this.layouts.set(
      rootPath,
      new NetworkLayout({
        linkRenderer: this.linkRenderer,
        renderStyle: this.renderStyle,
        renderTarget: {
          parent: networkEl.append("g").attr("class", "network"),
          labels: svg
            .select("#labelsContainer")
            .append("g")
            .attr("class", "network labels"),
        },
        position: new Point(innerWidth / 2 - 150, innerHeight / 2),
        nodeLimit,
      }),
    );

    this.renderPath(rootPath);
  }

  render() {
    return (
      <svg
        ref={(node) => (this.svgNode = node)}
        style={{ width: "100vw", height: "100vh" }}
        xmlns={d3.namespaces.svg}
        xmlnsXlink={d3.namespaces.xlink}
        id="networkNavigatorSvg"
      >
        <rect className="background" width="100%" height="100%" fill="#fff" />
        <g id="network" />
        <g id="labelsContainer" />
      </svg>
    );
  }
}
