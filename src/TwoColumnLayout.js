import React, { Component } from 'react';
import { Sidebar, Segment, Button, Rail, Menu, Icon, Input } from 'semantic-ui-react';
import Help from './Help';
import SelectedNode from './SelectedNode';
import MapVisualizer from './MapVisualizer';

export default class TwoColumnLayout extends Component {
    state = {
        visible: true,
        loading: true,
        flowDistribution: [],
        degreeDistribution: [],
        largest: [],
        selectedNode: null,
        searchFunction: () => null,
    }

    toggleVisibility = () => this.setState({ visible: !this.state.visible });
    loadingComplete = () => this.setState({ loading: false });
    setFlowDistribution = data => this.setState({ flowDistribution: data });
    setDegreeDistribution = data => this.setState({ degreeDistribution: data });
    setLargest = data => this.setState({ largest: data });
    setSelectedNode = node => this.setState({ selectedNode: node })
    setSearchFunction = f => this.setState({ searchFunction: f })

    render() {
        return (
            <Sidebar.Pushable as={Segment}>
                <Sidebar
                    style={{ overflow: 'scroll!important' }}
                    as={Menu}
                    animation='overlay'
                    width='wide'
                    direction='right'
                    visible={this.state.visible}
                    vertical>
                    <Menu.Item onClick={this.toggleVisibility}>
                        <Icon name='close' />Close menu
                    </Menu.Item>
                    <Menu.Item>
                        <Input readonly label='File' labelPosition='right' value='aoeu' />
                    </Menu.Item>
                    <Menu.Item>
                        <Input
                            icon='search'
                            placeholder='Search...'
                            onChange={(event, data) => this.state.searchFunction(data.value)} />
                    </Menu.Item>
                    <SelectedNode
                        node={this.state.selectedNode}
                        flowDistribution={this.state.flowDistribution}
                        degreeDistribution={this.state.degreeDistribution} />
                    <Menu.Item>
                        <Icon name='image' />Download SVG
                    </Menu.Item>
                    <Menu.Item>
                        <Icon name='file outline' />Download data
                    </Menu.Item>
                    <Help />
                    <Menu.Item as={'a'} href='https://github.com/mapequation/map-visualize'>
                        <Icon name='github' />Source code
                    </Menu.Item>
                </Sidebar>
                <Sidebar.Pusher>
                    <Segment basic loading={this.state.loading}>
                        <Rail internal position="right" size="small">
                            <Button
                                onClick={this.toggleVisibility}
                                content="Show menu"
                                icon='sidebar' />
                        </Rail>
                        <MapVisualizer
                            searchFunction={this.setSearchFunction}
                            flowDistribution={this.setFlowDistribution}
                            degreeDistribution={this.setDegreeDistribution}
                            largest={this.setLargest}
                            selectedNode={this.setSelectedNode}
                            width={window.innerWidth}
                            height={window.innerHeight}
                            loadingComplete={this.loadingComplete} />
                    </Segment>
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        );
    }
}
