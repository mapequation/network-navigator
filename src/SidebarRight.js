import React, { Component } from 'react';
import { Sidebar, Menu, Icon, Input, Accordion } from 'semantic-ui-react';
import Help from './Help';
import GraphSlider from './GraphSlider'


export default class SidebarRight extends Component {
    state = {
        flowDistributionVisible: false,
        degreeDistributionVisible: false,
        largestVisible: false,
    }

    render() {
        return (
            <Sidebar
                as={Menu}
                animation='overlay'
                width='wide'
                direction='right'
                visible={this.props.visible}
                vertical
            >
                <Menu.Item onClick={this.props.toggleVisibility}>
                    <Icon name='close' />
                    Close menu
                </Menu.Item>
                <Menu.Item>
                    <Input type='file' name='file' />
                </Menu.Item>
                <Menu.Item>
                    <Input
                        placeholder='Search...'
                        onChange={(event, data) => this.props.searchFunction(data.value) }
                    />
                </Menu.Item>
                {this.props.selectedNode &&
                    <Menu.Item>
                        <Input
                            placeholder='No node selected'
                            value={this.props.selectedNode.name} />
                    </Menu.Item>
                }
                {this.props.degreeDistribution.length > 0 &&
                    <Menu.Item as={Accordion}>
                        <Accordion.Title
                            active={this.state.flowDistributionVisible}
                            onClick={() => this.setState({ flowDistributionVisible: !this.state.flowDistributionVisible })}>
                            <Icon name='dropdown' />Flow distribution
                        </Accordion.Title>
                        <Accordion.Content active={this.state.flowDistributionVisible}>
                            <GraphSlider
                                rangeVisible={true}
                                width={315} height={120}
                                data={this.props.flowDistribution} />
                        </Accordion.Content>
                    </Menu.Item>
                }
                {this.props.degreeDistribution.length > 0 &&
                    <Menu.Item as={Accordion}>
                        <Accordion.Title
                            active={this.state.degreeDistributionVisible}
                            onClick={() => this.setState({ degreeDistributionVisible: !this.state.degreeDistributionVisible })}>
                            <Icon name='dropdown' />Out degree distribution
                        </Accordion.Title>
                        <Accordion.Content active={this.state.degreeDistributionVisible}>
                            <GraphSlider
                                width={315} height={120}
                                data={this.props.degreeDistribution} />
                        </Accordion.Content>
                    </Menu.Item>
                }
                {this.props.largest.length > 0 &&
                    <Menu.Item as={Accordion}>
                        <Accordion.Title
                            active={this.state.largestVisible}
                            onClick={() => this.setState({ largestVisible: !this.state.largestVisible })}>
                            <Icon name='dropdown' />Largest nodes
                        </Accordion.Title>
                        <Accordion.Content active={this.state.largestVisible}>
                            <Menu.Menu>
                                {this.props.largest.map(node => (
                                    <Menu.Item key={node.id}>
                                        {node.name}
                                    </Menu.Item>))
                                }
                            </Menu.Menu>
                        </Accordion.Content>
                    </Menu.Item>
                }
                <Menu.Item>
                    <Icon name='image' />
                    Download SVG
                </Menu.Item>
                <Menu.Item>
                    <Icon name='file outline' />
                    Download data
                </Menu.Item>
                <Help />
                <Menu.Item as={'a'} href='https://github.com/mapequation/map-visualize'>
                    <Icon name='github' />
                    Source code
                </Menu.Item>
            </Sidebar>
        );
    }
}
