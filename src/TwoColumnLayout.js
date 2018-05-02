import React, { Component } from 'react';
import { Sidebar, Rail, Menu, Icon, Input, Grid, Label } from 'semantic-ui-react';
import Help from './Help';
import SelectedNode from './SelectedNode';
import DownloadMenu from './DownloadMenu';
import SearchNodes from './SearchNodes';
import FileDialog from './FileDialog';
import MapVisualizer from './MapVisualizer';
import Tree from './Tree';


export default class TwoColumnLayout extends Component {
    state = {
        sidebarVisible: false,
        loadingComplete: false,
        filename: '',
        network: null,
        selectedNode: null,
        searchFunction: () => [],
    }

    toggleSidebar = () => this.setState({ sidebarVisible: !this.state.sidebarVisible });
    setSelectedNode = node => this.setState({ selectedNode: node });
    setSearchFunction = f => this.setState({ searchFunction: f });
    onFileLoaded = ({ network, filename }) => this.setState({
        network,
        filename,
        loadingComplete: true,
    });

    render() {
        const mainContent = this.state.loadingComplete
            ? <MapVisualizer
                network={this.state.network}
                width={window.innerWidth}
                height={window.innerHeight}
                searchFunction={this.setSearchFunction}
                selectedNode={this.setSelectedNode} />
            : <FileDialog onFileLoaded={this.onFileLoaded} />

        return (
            <Sidebar.Pushable>
                <Sidebar
                    style={{ overflow: 'scroll!important' }}
                    as={Menu}
                    animation='overlay'
                    width='wide'
                    direction='right'
                    visible={this.state.sidebarVisible}
                    vertical>
                    <Menu.Item onClick={this.toggleSidebar} icon='close' content='Close menu' />
                    <Menu.Item>
                        <Input readOnly label='Filename' value={this.state.filename} />
                    </Menu.Item>
                    <Menu.Item>
                        <SearchNodes searchFunction={this.state.searchFunction} maxResults={15} />
                    </Menu.Item>
                    <SelectedNode node={this.state.selectedNode} />
                    {this.state.network != null &&
                        <Tree network={this.state.network} />
                    }
                    {/*<DownloadMenu />*/}
                    <Help />
                    <Menu.Item as={'a'} href='https://github.com/mapequation/map-visualize'>
                        <Icon name='github' />Source code
                    </Menu.Item>
                </Sidebar>
                <Sidebar.Pusher as={Grid} padded>
                    <Grid.Column align='center' style={{height: '100%'}}>
                        <Rail attached internal position='right'>
                            <Label
                                attached='top right'
                                icon='sidebar'
                                content='Show menu'
                                onClick={this.toggleSidebar} />
                        </Rail>
                        {mainContent}
                    </Grid.Column>
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        );
    }
}
