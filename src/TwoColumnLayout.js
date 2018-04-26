import React, { Component } from 'react';
import { Sidebar, Rail, Menu, Icon, Input, Grid, Label } from 'semantic-ui-react';
import Help from './Help';
import SelectedNode from './SelectedNode';
import DownloadMenu from './DownloadMenu';
import SearchNodes from './SearchNodes';
import MapVisualizer from './MapVisualizer';
import FileDialog from './FileDialog';
import parseFile from './lib/parse-file';
import parseFTree from './lib/file-formats/ftree';
import networkFromFTree from './lib/file-formats/network-from-ftree';

export default class TwoColumnLayout extends Component {
    state = {
        filename: '',
        sidebarVisible: false,
        isLoading: false,
        loadingComplete: false,
        progressLabel: '',
        progressValue: 0,
        network: null,
        selectedNode: null,
        searchFunction: () => [],
    }

    toggleSidebar = () => this.setState({ sidebarVisible: !this.state.sidebarVisible });
    setSelectedNode = node => this.setState({ selectedNode: node });
    setSearchFunction = f => this.setState({ searchFunction: f });

    loadData = (file) => {
        if (file.name) {
            this.setState({ filename: file.name })
        }

        this.setState({
            isLoading: true,
            progressValue: 1,
            progressLabel: 'Reading file',
        });

        const progressTimeout = setTimeout(() =>
            this.setState({
                progressValue: 2,
                progressLabel: 'Parsing',
            }), 400);

        parseFile(file)
            .then((parsed) => {
                clearTimeout(progressTimeout);

                const ftree = parseFTree(parsed.data);
                const network = networkFromFTree(ftree);

                this.setState({
                    progressValue: 3,
                    progressLabel: 'Success',
                });

                setTimeout(() =>
                    this.setState({
                        isLoading: false,
                        loadingComplete: true,
                        network,
                    }), 200);
            })
            .catch((err) => {
                this.setState({ isLoading: false });
                console.log(err)
            });
    }

    loadExampleData = () => {
        const filename = 'citation_data.ftree';
        this.setState({ filename })

        fetch(filename)
            .then(res => res.text())
            .then(this.loadData)
            .catch((err) => {
                this.setState({ isLoading: false });
                console.log(err)
            });
    }

    render() {
        const mainContent = this.state.loadingComplete
            ? (
            <MapVisualizer
                network={this.state.network}
                width={window.innerWidth}
                height={window.innerHeight}
                searchFunction={this.setSearchFunction}
                selectedNode={this.setSelectedNode} />
            ) : (
            <FileDialog
                progressVisible={this.state.isLoading}
                progressValue={this.state.progressValue}
                progressLabel={this.state.progressLabel}
                onLoadData={this.loadData}
                onExampleClick={this.loadExampleData} />
            );

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
