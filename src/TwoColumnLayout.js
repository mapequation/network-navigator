import React, { Component } from 'react';
import { Sidebar, Segment, Button, Rail, Menu, Icon, Input } from 'semantic-ui-react';
import Help from './Help';
import SelectedNode from './SelectedNode';
import DownloadMenu from './DownloadMenu';
import SearchNodes from './SearchNodes';
import MapVisualizer from './MapVisualizer';
import SimulationSettings from './SimulationSettings';
import Filter from './Filter';

export default class TwoColumnLayout extends Component {
    state = {
        visible: true,
        loading: true,
        selectedNode: null,
        searchFunction: () => [],
    }

    toggleVisibility = () => this.setState({ visible: !this.state.visible });
    loadingComplete = () => this.setState({ loading: false });
    setSelectedNode = node => this.setState({ selectedNode: node });
    setSearchFunction = f => this.setState({ searchFunction: f });

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
                    <Menu.Item onClick={this.toggleVisibility} icon='close' content='Close menu' />
                    <Menu.Item>
                        <Input readOnly label='Filename' labelPosition='right' value='aoeu' />
                    </Menu.Item>
                    <Menu.Item>
                        <SearchNodes searchFunction={this.state.searchFunction} maxResults={15} />
                    </Menu.Item>
                    <SelectedNode node={this.state.selectedNode} />
                    <Filter />
                    <SimulationSettings />
                    <DownloadMenu />
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
                            width={window.innerWidth}
                            height={window.innerHeight}
                            searchFunction={this.setSearchFunction}
                            selectedNode={this.setSelectedNode}
                            loadingComplete={this.loadingComplete} />
                    </Segment>
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        );
    }
}
