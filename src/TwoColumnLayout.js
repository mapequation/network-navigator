import React, { Component } from 'react';
import { Sidebar, Rail, Menu, Icon, Input, Grid, Label } from 'semantic-ui-react';
import Help from './Help';
import SelectedNode from './SelectedNode';
import Search from './Search';
import FileDialog from './FileDialog';
import NetworkNavigator from './NetworkNavigator';
import Settings from './Settings';
import Tree from './Tree';
import Occurrences from './Occurrences';
import Background from './Background.svg';
import addBeforeUnloadEventListener from './lib/before-unload';
import FileSaver from 'file-saver';
import ftreeFromNetwork from './lib/file-formats/ftree-from-network';

export default class TwoColumnLayout extends Component {
    state = {
        sidebarVisible: false,
        loadingComplete: false,
        filename: '',
    }

    toggleSidebar = () => this.setState({ sidebarVisible: !this.state.sidebarVisible });
    setSelectedNode = selectedNode => this.setState({ selectedNode });
    setSearchFunction = searchFunction => this.setState({ searchFunction });
    onFileLoaded = ({ network, filename }) => {
        addBeforeUnloadEventListener('Are you sure you want to leave this page?');
        this.setState({
            network,
            filename,
            selectedNode: network,
            sidebarVisible: true,
            loadingComplete: true,
        });
    };

    handleSizeChange = size => this.setState({ size });
    handleNameChange = name => {
        const { selectedNode } = this.state;
        if (selectedNode) {
            selectedNode.name = name;
            this.forceUpdate();
        }
    }

    handleFilenameChange = (e, { value }) => this.setState({ filename: value });

    handleDownloadClicked = () => {
        const ftree = ftreeFromNetwork(this.state.network);
        const blob = new Blob([ftree], { type: 'text/plain;charset=utf-8' });
        FileSaver.saveAs(blob, this.state.filename);
    }

    handleOccurrencesChange = occurrences => this.setState({ occurrences }, this.forceUpdate);

    render() {
        const mainContent = this.state.loadingComplete
            ? <div>
                <Rail attached internal position='right'>
                    <Label as='a'
                        attached='top right'
                        icon='sidebar'
                        content='Show sidebar'
                        onClick={this.toggleSidebar}
                    />
                </Rail>
                <NetworkNavigator
                    root={this.state.network}
                    occurrences={this.state.occurrences}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    sizeBasedOn={this.state.size}
                    setSearchFunction={this.setSearchFunction}
                    setSelectedNode={this.setSelectedNode} />
            </div>
            : <FileDialog onFileLoaded={this.onFileLoaded} />

        const background = this.state.loadingComplete
            ? {
                backgroundColor: '#fff',
            }
            : {
                background: `linear-gradient(hsla(0, 0%, 100%, 0.5), hsla(0, 0%, 100%, 0.5)), url(${Background}) no-repeat`,
                backgroundSize: 'cover',
                backgroundPosition: 'center top',
            };

        return (
            <Sidebar.Pushable style={{height: 'calc(100vh - 80px)'}}>
                <Sidebar
                    style={{ overflow: 'scroll!important' }}
                    as={Menu}
                    animation='overlay'
                    width='wide'
                    direction='right'
                    visible={this.state.sidebarVisible}
                    vertical>
                    <Menu.Item onClick={this.toggleSidebar} icon='close' content='Close' />
                    <Menu.Item>
                        <Input
                            type='text'
                            label='Filename'
                            labelPosition='left'
                            icon={<Icon name='download' link onClick={this.handleDownloadClicked}/>}
                            value={this.state.filename}
                            onChange={this.handleFilenameChange}
                        />
                    </Menu.Item>
                    <Menu.Item>
                        <Search searchFunction={this.state.searchFunction} />
                    </Menu.Item>
                    <Occurrences onFilesChange={this.handleOccurrencesChange} selectedNode={this.state.selectedNode} />
                    {this.state.selectedNode &&
                        <SelectedNode
                            node={this.state.selectedNode}
                            directed={this.state.network ? this.state.network.directed : false}
                            onNameChange={this.handleNameChange}
                        />
                    }
                    <Settings
                        onSizeChange={this.handleSizeChange}
                    />
                    {this.state.network &&
                        <Tree network={this.state.network} />
                    }
                    <Help trigger={<Menu.Item><Icon name='help' />Help</Menu.Item>} />
                    <Menu.Item as={'a'} href='https://github.com/mapequation/map-visualize'>
                        <Icon name='github' />Source code
                    </Menu.Item>
                </Sidebar>
                <Sidebar.Pusher as={Grid} padded>
                    <Grid.Column
                        align='center'
                        style={{ paddingTop: 0, paddingLeft: 0, ...background }}>
                        {mainContent}
                    </Grid.Column>
                </Sidebar.Pusher>
            </Sidebar.Pushable>
        );
    }
}
