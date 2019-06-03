import * as d3 from "d3";
import PropTypes from "prop-types";
import React from "react";
import { Button } from "semantic-ui-react";


export default class Graph extends React.Component {
  static propTypes = {
    data: PropTypes.array.isRequired,
    width: PropTypes.number,
    height: PropTypes.number,
    xDescription: PropTypes.string,
    xLabel: PropTypes.string,
    yLabel: PropTypes.string,
    ySubscript: PropTypes.string,
    yDescription: PropTypes.string,
    logy: PropTypes.bool
  };

  static defaultProps = {
    width: 250,
    height: 150,
    xDescription: "",
    xLabel: "x",
    yLabel: "y",
    ySubscript: "",
    yDescription: "",
    logy: false
  };

  constructor(props) {
    super(props);
    this.x = this.props.x || (d => this.props.data.indexOf(d) + 1);
    this.y = this.props.y || (d => d);
    this.state = {
      logScale: this.props.logy
    };
  }

  componentDidMount() {
    this.createChart();
  }

  componentDidUpdate() {
    this.createChart();
  }

  createChart() {
    const {
      data,
      width,
      height,
      xDescription,
      xLabel,
      yLabel,
      ySubscript,
      yDescription
    } = this.props;

    const node = this.node;
    const figureWidth = width - 42;
    const figureHeight = height - 35;

    const x = d3.scaleLinear().domain([1, data.length]).rangeRound([0, figureWidth]);
    const yScale = this.state.logScale ? d3.scaleLog : d3.scaleLinear;
    const yMin = this.state.logScale ? d3.min(data.filter(d => d > 0)) : 0;
    const y = yScale().domain([d3.max(data), yMin]).rangeRound([0, figureHeight]).clamp(true);

    const line = d3.line()
      .x(d => x(this.x(d)))
      .y(d => y(d));

    const area = d3.area()
      .x(d => x(this.x(d)))
      .y(d => y(d))
      .y1(d => y(0));

    const yAxis = d3.axisLeft(y)
      .ticks(5)
      .tickSize(4);

    const xAxis = d3.axisBottom(x)
      .ticks(Math.min(data.length - 1, 10))
      .tickSize(4);

    const [areaColor, lineColor] = d3.schemePaired;
    const fillColor = d3.hsl(areaColor);
    fillColor.s -= 0.1;
    fillColor.l += 0.1;

    d3.select(node).selectAll("*").remove();

    const group = d3.select(node)
      .append("g")
      .attr("transform", "translate(38 10)");

    group.append("path")
      .attr("transform", "translate(1 0)")
      .attr("fill", fillColor)
      .attr("d", area(data));

    group.append("path")
      .attr("transform", "translate(1 0)")
      .attr("fill", "none")
      .attr("stroke", lineColor)
      .attr("stroke-width", 1)
      .attr("d", line(data));

    group.append("g")
      .call(yAxis);

    group.append("g")
      .attr("transform", `translate(0 ${figureHeight})`)
      .call(xAxis);

    group.selectAll("line")
      .attr("stroke", "#666")
      .attr("stroke-width", 0.5);

    group.selectAll("text")
      .attr("font-weight", "lighter")
      .attr("font-size", 7.5);

    // x label
    group.append("text")
      .attr("transform", `translate(${figureWidth / 2} ${figureHeight + 25})`)
      .attr("font-size", 9)
      .attr("font-weight", "lighter")
      .append("tspan")
      .attr("text-anchor", "middle")
      .text(xDescription + "  ")
      .append("tspan")
      .attr("font-style", "italic")
      .text(xLabel);

    // y label
    group.append("text")
      .attr("transform", `translate(${-30} ${figureHeight / 2}) rotate(-90)`)
      .attr("font-size", 9)
      .attr("font-weight", "lighter")
      .append("tspan")
      .attr("text-anchor", "middle")
      .text((this.state.logScale ? "Log " : "") + yDescription + "  ")
      .append("tspan")
      .attr("font-style", "italic")
      .text(yLabel)
      .append("tspan")
      .attr("baseline-shift", "sub")
      .attr("font-size", 8)
      .text(ySubscript);

    if (data.length <= 1) {
      group.append("text")
        .attr("transform", `translate(${figureWidth / 2} ${figureHeight / 2})`)
        .attr("text-anchor", "middle")
        .style("font-size", 20)
        .style("font-weight", "bold")
        .style("fill", "#ccc")
        .text("No data");
    }
  }

  render() {
    const { width, height } = this.props;
    const { logScale } = this.state;

    return (
      <div style={{ width }}>
        <div style={{ textAlign: "center" }}>
          <Button.Group compact size='mini'>
            <Button active={!logScale} onClick={() => this.setState({ logScale: false })}>Linear</Button>
            <Button active={logScale} onClick={() => this.setState({ logScale: true })}>Log</Button>
          </Button.Group>
        </div>
        <svg ref={node => this.node = node} width={width} height={height}/>
      </div>
    );
  }
}
