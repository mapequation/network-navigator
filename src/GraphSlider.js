import React, { Component } from 'react';
import './GraphSlider.css';
import * as d3 from 'd3';
import Range from './Range';

class GraphSlider extends Component {
    state = {
        range: 20,
    };

    constructor(props) {
        super(props);
        this.x = this.props.x || (d => this.props.data.indexOf(d));
        this.y = this.props.y || (d => d);
        this.width = this.props.width || 250;
        this.height = this.props.height || 150;
        this.state = { range: this.props.data.length - 1 };
    }

    componentDidMount() {
        this.createChart();
    }

    componentDidUpdate() {
        this.createChart();
    }

    createChart() {
        const node = this.node;
        const data = this.props.data;
        const figureWidth = this.width - 20;
        const figureHeight = this.height - 30;

        const x = d3.scaleLinear().domain([0, data.length - 1]).rangeRound([0, figureWidth]);
        const y = d3.scaleLinear().domain([d3.max(this.y(data)), 0]).rangeRound([0, figureHeight]);

        const line = d3.line()
            .x(d => x(this.x(d)))
            .y(d => y(this.y(d)));

        const area = d3.area()
            .x(d => x(this.x(d)))
            .y(d => y(this.y(d)))
            .y1(d => y(0))

        const yAxis = d3.axisLeft(y)
            .ticks(5)
            .tickSize(4)
        const xAxis = d3.axisBottom(x)
            .ticks(Math.min(data.length - 1, 10))
            .tickSize(4)

        const [fillColor, lineColor] = d3.schemePaired;
        const unselectedFill = d3.hsl(fillColor);
        unselectedFill.s -= 0.1;
        unselectedFill.l += 0.1;

        d3.select(node).selectAll('*').remove();

        const group = d3.select(node)
            .append('g')
            .attr('transform', 'translate(25 10)')

        group.append('g')
            .attr('transform', 'translate(0 0)')
            .call(yAxis)

        group.append('g')
            .attr('transform', `translate(0 ${figureHeight})`)
            .call(xAxis)

        group.selectAll('line')
            .attr('stroke', '#666')
            .attr('stroke-width', 0.5)

        group.selectAll('text')
            .attr('font-weight', 'lighter')
            .attr('font-size', 7.5)

        group.append('path')
            .attr('fill', unselectedFill)
            .attr('d', area(data))

        if (this.props.rangeVisible) {
            group.append('path')
                .attr('fill', fillColor)
                .attr('d', area(data.slice(0, this.state.range + 1)))
        }

        group.append('path')
            .attr('fill', 'none')
            .attr('stroke', lineColor)
            .attr('stroke-width', 1)
            .attr('d', line(data))
    }

    onChange = (value) => {
        this.setState({ range: value });
        if (this.props.onChange) {
            this.props.onChange(value);
        }
    };

    render() {
        return (
            <div className="GraphSlider" style={{ width: this.width }}>
                <svg ref={node => this.node = node} width={this.width} height={this.height}></svg>
                <br />
                {this.props.rangeVisible === true &&
                    <Range min={0}
                        max={this.props.data.length - 1}
                        value={this.state.range}
                        onChange={this.onChange} />
                }
            </div>
        );
    }
}

export default GraphSlider;
