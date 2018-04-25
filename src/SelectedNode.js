import React, { Component } from 'react';
import { Menu, Accordion, Icon } from 'semantic-ui-react';
import InfoTable from './InfoTable';
import GraphSlider from './GraphSlider'

export default class SelectedNode extends Component {
    state = {
        selectedNodeVisible: false,
        flowDistributionVisible: false,
        inDegreeDistributionVisible: false,
        outDegreeDistributionVisible: false,
        largestVisible: false,
    }

    toggleSelectedNodeVisible = () => this.setState({ selectedNodeVisible: !this.state.selectedNodeVisible });
    toggleFlowDistributionVisible = () => this.setState({ flowDistributionVisible: !this.state.flowDistributionVisible });
    toggleInDegreeDistributionVisible = () => this.setState({ inDegreeDistributionVisible: !this.state.inDegreeDistributionVisible });
    toggleOutDegreeDistributionVisible = () => this.setState({ outDegreeDistributionVisible: !this.state.outDegreeDistributionVisible });

    render() {
        const children = this.props.node ? this.props.node.nodes || [] : [];
        const flowDistribution = children.map(n => n.flow);
        const inDegreeDistribution = children.map(n => n.kin).sort((a, b) => b - a);
        const outDegreeDistribution = children.map(n => n.kout).sort((a, b) => b - a);

        return (
            <Menu.Item as={Accordion}>
                <Accordion.Title
                    active={this.state.selectedNodeVisible}
                    onClick={this.toggleSelectedNodeVisible}>
                    <Icon name='dropdown' />Selected node
                </Accordion.Title>
                <Accordion.Content active={this.state.selectedNodeVisible}>
                    <InfoTable node={this.props.node} />
                    <Menu.Item as={Accordion}>
                        <Accordion.Title
                            active={this.state.flowDistributionVisible}
                            onClick={this.toggleFlowDistributionVisible}>
                            <Icon name='dropdown' />Flow distribution
                        </Accordion.Title>
                        <Accordion.Content active={this.state.flowDistributionVisible}>
                            <GraphSlider
                                rangeVisible
                                width={315} height={120}
                                data={flowDistribution} />
                        </Accordion.Content>
                    </Menu.Item>
                    <Menu.Item as={Accordion}>
                        <Accordion.Title
                            active={this.state.inDegreeDistributionVisible}
                            onClick={this.toggleInDegreeDistributionVisible}>
                            <Icon name='dropdown' />In degree distribution
                        </Accordion.Title>
                        <Accordion.Content active={this.state.inDegreeDistributionVisible}>
                            <GraphSlider
                                width={315} height={120}
                                data={inDegreeDistribution} />
                        </Accordion.Content>
                    </Menu.Item>
                    <Menu.Item as={Accordion}>
                        <Accordion.Title
                            active={this.state.outDegreeDistributionVisible}
                            onClick={this.toggleOutDegreeDistributionVisible}>
                            <Icon name='dropdown' />Out degree distribution
                        </Accordion.Title>
                        <Accordion.Content active={this.state.outDegreeDistributionVisible}>
                            <GraphSlider
                                width={315} height={120}
                                data={outDegreeDistribution} />
                        </Accordion.Content>
                    </Menu.Item>
                </Accordion.Content>
            </Menu.Item>
        );
    }
}
