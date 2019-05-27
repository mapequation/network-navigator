import FileSaver from "file-saver";
import React, { Component } from "react";
import { Grid, Icon, Input, Label, Menu, Rail, Sidebar } from "semantic-ui-react";
import FileDialog from "./FileDialog";
import addBeforeUnloadEventListener from "./lib/before-unload";
import ftreeFromNetwork from "./lib/file-formats/ftree-from-network";
import MenuItemAccordion from "./MenuItemAccordion";
import NetworkNavigator from "./NetworkNavigator";
import Occurrences from "./Occurrences";
import Search from "./Search";
import SelectedNode from "./SelectedNode";
import Settings from "./Settings";


export default class App extends Component {
    state = {
        sidebarVisible: false,
        loadingComplete: false,
        filename: "",
    };

    toggleSidebar = () => this.setState({ sidebarVisible: !this.state.sidebarVisible });

    setSelectedNode = selectedNode => this.setState({ selectedNode });

    setSearchFunction = searchFunction => this.setState({ searchFunction });

    onFileLoaded = ({ network, filename }) => {
        addBeforeUnloadEventListener("Are you sure you want to leave this page?");
        this.setState({
            network,
            filename,
            selectedNode: network,
            sidebarVisible: true,
            loadingComplete: true,
        });
    };

    handleNameChange = name => {
        const { selectedNode } = this.state;
        if (selectedNode) {
            selectedNode.name = name;
            this.forceUpdate();
        }
    };

    handleFilenameChange = (e, { value }) => this.setState({ filename: value });

    handleDownloadClicked = () => {
        const ftree = ftreeFromNetwork(this.state.network);
        const blob = new Blob([ftree], { type: "text/plain;charset=utf-8" });
        FileSaver.saveAs(blob, this.state.filename);
    };

    handleOccurrencesChange = occurrences => this.setState({ occurrences }, this.forceUpdate);

    render() {
        const {
            sidebarVisible,
            filename,
            searchFunction,
            network,
            selectedNode,
            occurrences,
            labelsVisible,
            nodeSize,
            nodeSizeScale,
            linkWidthScale,
            simulationEnabled,
            loadingComplete,
        } = this.state;

        const mainContent = <Sidebar.Pushable style={{ height: "100vh" }}>
            <Sidebar
                style={{ overflow: "scroll!important" }}
                as={Menu}
                animation='overlay'
                width='wide'
                direction='right'
                visible={sidebarVisible}
                vertical
            >
                <Menu.Item onClick={this.toggleSidebar} icon='close' content='Close'/>
                <Menu.Item>
                    <Input
                        type='text'
                        label='Filename'
                        labelPosition='left'
                        icon={<Icon name='download' link onClick={this.handleDownloadClicked}/>}
                        value={filename}
                        onChange={this.handleFilenameChange}
                    />
                </Menu.Item>
                <Menu.Item>
                    <Search searchFunction={searchFunction}/>
                </Menu.Item>
                {network &&
                <MenuItemAccordion title='Occurrences'>
                    <Occurrences
                        onFilesChange={this.handleOccurrencesChange}
                        selectedNode={selectedNode}
                        filename={filename}
                        totalNodes={network.totalChildren}
                    />
                </MenuItemAccordion>
                }
                {selectedNode &&
                <SelectedNode
                    node={selectedNode}
                    directed={network ? network.directed : false}
                    onNameChange={this.handleNameChange}
                />
                }
                <MenuItemAccordion title='Settings'>
                    <Settings
                        onNodeSizeChange={nodeSize => this.setState({ nodeSize })}
                        onNodeSizeScaleChange={nodeSizeScale => this.setState({ nodeSizeScale })}
                        onLinkWidthScaleChange={linkWidthScale => this.setState({ linkWidthScale })}
                        onLabelsVisibleChange={labelsVisible => this.setState({ labelsVisible })}
                        onSimulationEnabledChange={simulationEnabled => this.setState({ simulationEnabled })}
                    />
                </MenuItemAccordion>
            </Sidebar>
            <Sidebar.Pusher as={Grid} padded>
                <Grid.Column style={{ paddingTop: 0, paddingLeft: 0 }}>
                    <Rail attached internal position='right'>
                        <Label
                            as='a'
                            attached='top right'
                            icon='sidebar'
                            content='Show sidebar'
                            onClick={this.toggleSidebar}
                        />
                    </Rail>
                    <NetworkNavigator
                        root={network}
                        occurrences={occurrences}
                        labelsVisible={labelsVisible}
                        width={window.innerWidth}
                        height={window.innerHeight}
                        nodeSizeBasedOn={nodeSize}
                        nodeSizeScale={nodeSizeScale}
                        linkWidthScale={linkWidthScale}
                        simulationEnabled={simulationEnabled}
                        setSearchFunction={this.setSearchFunction}
                        setSelectedNode={this.setSelectedNode}
                    />
                </Grid.Column>
            </Sidebar.Pusher>
        </Sidebar.Pushable>;

        return loadingComplete ? mainContent : <FileDialog onFileLoaded={this.onFileLoaded}/>;
    }
}
