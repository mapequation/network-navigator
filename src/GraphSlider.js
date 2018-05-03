import React, { Component } from 'react';
import * as d3 from 'd3';
import Range from './Range';
import { Button } from 'semantic-ui-react';

class GraphSlider extends Component {
    state = {
        range: 20,
        logScale: false,
    };

    constructor(props) {
        super(props);
        this.x = this.props.x || (d => this.props.data.indexOf(d) + 1);
        this.y = this.props.y || (d => d);
        this.width = this.props.width || 250;
        this.height = this.props.height || 150;
        this.xDescription = this.props.xDescription || '';
        this.xLabel = this.props.xLabel || 'x';
        this.yLabel = this.props.yLabel || 'y';
        this.ySubscript = this.props.ySubscript || '';
        this.yDescription = this.props.yDescription || '';
        this.state = {
            range: this.props.data.length,
            logScale: this.props.logy,
        };
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
        const figureWidth = this.width - 42;
        const figureHeight = this.height - 35;

        const x = d3.scaleLinear().domain([1, data.length]).rangeRound([0, figureWidth]);
        const yScale = this.state.logScale ? d3.scaleLog : d3.scaleLinear;
        const yMin = this.state.logScale ? d3.min(this.y(data).filter(d => d > 0)) : 0;
        const y = yScale().domain([d3.max(this.y(data)), yMin]).rangeRound([0, figureHeight]).clamp(true);

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
            .attr('transform', 'translate(38 10)')

        group.append('g')
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

        const xLabel = group.append('text')
            .attr('transform', `translate(${figureWidth / 2} ${figureHeight + 25})`)
            .attr('font-size', 9)
            .attr('font-weight', 'lighter');

        xLabel.append('tspan')
            .attr('text-anchor', 'middle')
            .text(this.xDescription + '  ')
            .append('tspan')
            .attr('font-style', 'italic')
            .text(this.xLabel);

        const yLabel = group.append('text')
            .attr('transform', `translate(${-30} ${figureHeight / 2}) rotate(-90)`)
            .attr('font-size', 9)
            .attr('font-weight', 'lighter')

        yLabel.append('tspan')
            .attr('text-anchor', 'middle')
            .text((this.state.logScale ? 'Log ' : '') + this.yDescription + '  ')
            .append('tspan')
            .attr('font-style', 'italic')
            .text(this.yLabel)
            .append('tspan')
            .attr('baseline-shift', 'sub')
            .attr('font-size', 8)
            .text(this.ySubscript);

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

        if (data.length <= 1) {
            group.append('text')
                .attr('transform', `translate(${figureWidth / 2} ${figureHeight / 2})`)
                .attr('text-anchor', 'middle')
                .style('font-size', 20)
                .style('font-weight', 'bold')
                .style('fill', '#ccc')
                .text('No data');
        }
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
                <div style={{ textAlign: 'center' }}>
                    <Button.Group compact size='mini'>
                        <Button active={!this.state.logScale} onClick={() => this.setState({ logScale: false })}>Linear</Button>
                        <Button active={this.state.logScale} onClick={() => this.setState({ logScale: true })}>Log</Button>
                    </Button.Group>
                </div>
                <svg ref={node => this.node = node} width={this.width} height={this.height}></svg>
                <br />
                {this.props.rangeVisible === true &&
                    <Range min={0}
                        max={this.props.data.length - 1}
                        value={this.state.range}
                        onChange={this.onChange}
                        width={this.width - 15} />
                }
            </div>
        );
    }
}

export default GraphSlider;
