import React, { Component } from 'react';
import { Modal, Menu, Icon } from 'semantic-ui-react';
import * as d3 from 'd3';
import './Tree.css';

function children(node) {
    return node.nodes ? node.nodes.slice(0, 6) : null;
}

class Tree extends Component {
    componentDidMount() {
        this.width = 700;
        this.height = 2000;

        const { network } = this.props;
        this.root = d3.hierarchy(network, children);

        const { width, height } = this;
        const tree = d3.tree()
            .size([height, width - 160]);

        this.tree = tree(this.root);
    }

    createTree() {
        const svg = d3.select(this.svgNode);
        const g = svg.append('g')
            .attr('transform', 'translate(50 0)');

        g.selectAll('.link')
            .data(this.tree.links())
            .enter()
            .append('path')
            .attr('class', 'Tree link')
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));

        const node = g.selectAll(".node")
            .data(this.root.descendants())
            .enter()
            .append("g")
            .attr("class", d => "Tree node" + (d.children ? " node--internal" : " node--leaf"))
            .attr("transform", d => "translate(" + d.y + "," + d.x + ")");

        node.append("circle")
            .attr("r", 2.5);

        const name = (d) => {
            if (d.depth > 3) return '';
            return d.data.physicalId ? d.data.name : d.data.path.toString();
        };

        node.append("text")
            .attr("dy", 3)
            .attr("x", d => d.children ? -8 : 8)
            .style("text-anchor", d => d.children ? "end" : "start")
            .text(name);
    }

    render() {
        const svg = <svg ref={node => this.svgNode = node}
            width={this.width} height={this.height} />

        const menuItem = (
            <Menu.Item>
                <Icon name='tree' />Show tree
            </Menu.Item>
        )

        return (
            <Modal trigger={menuItem} onMount={() => setTimeout(() => this.createTree(), 100)}  dimmer='inverted'>
                <Modal.Header>Tree</Modal.Header>
                <Modal.Content>
                    <Modal.Description>
                        {svg}
                    </Modal.Description>
                </Modal.Content>
            </Modal>
        );
    }
}

export default Tree;
