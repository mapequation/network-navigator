import React from "react";
import { halfLink } from "../lib/link-renderer";


const quadraticCurve = ({ start, q, stop }) =>
  `M${start.x} ${start.y} Q${q.x} ${q.y} ${stop.x} ${stop.y}`;

const nodes = [
  {
    label: "A",
    x: 100,
    y: 50 + 10,
    size: 25,
    strokeWidth: 5,
    fill: "rgb(188, 228, 182)",
    stroke: "rgb(96, 181, 113)"
  },
  {
    label: "B",
    x: 300,
    y: 50 + 10,
    size: 30,
    strokeWidth: 2.5,
    fill: "rgb(181, 225, 175)",
    stroke: "rgb(102, 185, 117)"
  }
];

const links = [
  { source: nodes[0], target: nodes[1], size: 10, bend: 10, fill: "rgb(6, 69, 117)" },
  { source: nodes[1], target: nodes[0], size: 6, bend: 10, fill: "rgb(30, 91, 139)" }
];

links[0].opposite = links[1];
links[1].opposite = links[0];

const linkRenderer = halfLink()
  .width(link => link.size)
  .oppositeLink(link => link.opposite);

const exitFlow = {
  start: {
    x: 50,
    y: 100 + 10
  },
  q: {
    x: 50,
    y: 80 + 10
  },
  stop: {
    x: 74,
    y: 62 + 10
  },
  label: `Flow exiting ${nodes[0].label}`
};

const flow = {
  start: {
    x: 350,
    y: 100 + 10
  },
  q: {
    x: 350,
    y: 80 + 10
  },
  stop: {
    x: 320,
    y: 60 + 10
  },
  label: `Flow inside ${nodes[1].label}`
};

const link0 = {
  start: {
    x: 200,
    y: 100 + 10
  },
  q: {
    x: 202,
    y: 85 + 10
  },
  stop: {
    x: 200,
    y: 74 + 10
  },
  label: `Flow from ${links[0].source.label} to ${links[0].target.label}`
};

const link1 = {
  start: {
    x: 200,
    y: 10 + 10
  },
  q: {
    x: 202,
    y: 25 + 10
  },
  stop: {
    x: 200,
    y: 46 + 10
  },
  dy: -6,
  label: `Flow from ${links[1].source.label} to ${links[1].target.label}`
};

const arrows = [flow, exitFlow, link0, link1];

export default () => (
  <svg
    viewBox="0 0 400 130"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <marker
        id='head'
        orient="auto"
        markerWidth='2'
        markerHeight='4'
        refX='0.1'
        refY='2'
      >
        <path d='M0,0 V4 L2,2 Z' fill="black"/>
      </marker>
    </defs>
    {links.map((link, i) =>
      <path
        key={i}
        d={linkRenderer(link)}
        style={{
          fill: link.fill
        }}
      />
    )}
    {nodes.map((node, i) =>
      <React.Fragment key={i}>
        <circle
          cx={node.x}
          cy={node.y}
          r={node.size}
          style={{
            fill: node.fill,
            stroke: node.stroke,
            strokeWidth: node.strokeWidth
          }}
        />
        <text
          key={i}
          x={node.x}
          y={node.y}
          dy={5}
          textAnchor="middle"
        >
          {node.label}
        </text>
      </React.Fragment>
    )}
    {arrows.map((arrow, i) =>
      <React.Fragment key={i}>
        <path
          markerEnd='url(#head)'
          strokeWidth='2'
          fill='none'
          stroke='#333'
          d={quadraticCurve(arrow)}
        />
        <text
          x={arrow.start.x}
          y={arrow.start.y}
          dy={arrow.dy || 14}
          textAnchor="middle"
        >
          {arrow.label}
        </text>
      </React.Fragment>
    )}
  </svg>
);
