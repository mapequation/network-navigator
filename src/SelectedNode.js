import React, { Component } from 'react';
import { Menu, Accordion, Icon } from 'semantic-ui-react';
import InfoTable from './InfoTable';
import GraphSlider from './GraphSlider'

export default class SelectedNode extends Component {
    state = {
        selectedNodeVisible: false,
        flowDistributionVisible: false,
        degreeDistributionVisible: false,
        largestVisible: false,
    }

    toggleSelectedNodeVisible = () => this.setState({ selectedNodeVisible: !this.state.selectedNodeVisible });
    toggleFlowDistributionVisible = () => this.setState({ flowDistributionVisible: !this.state.flowDistributionVisible });
    toggleDegreeDistributionVisible = () => this.setState({ degreeDistributionVisible: !this.state.degreeDistributionVisible });

    render() {
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
                                rangeVisible={true}
                                width={315} height={120}
                                data={this.props.flowDistribution} />
                        </Accordion.Content>
                    </Menu.Item>
                    <Menu.Item as={Accordion}>
                        <Accordion.Title
                            active={this.state.degreeDistributionVisible}
                            onClick={this.toggleDegreeDistributionVisible}>
                            <Icon name='dropdown' />Out degree distribution
                        </Accordion.Title>
                        <Accordion.Content active={this.state.degreeDistributionVisible}>
                            <GraphSlider
                                width={315} height={120}
                                data={this.props.degreeDistribution} />
                        </Accordion.Content>
                    </Menu.Item>
                </Accordion.Content>
            </Menu.Item>
        );
    }
}
