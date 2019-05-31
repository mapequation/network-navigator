import FileSaver from "file-saver";
import React, { Component } from "react";
import { Button, Header, Icon, Input, Menu, Rail, Sidebar } from "semantic-ui-react";
import FileDialog from "./FileDialog";
import ftreeFromNetwork from "../lib/file-formats/ftree-from-network";
import MenuItemAccordion from "./MenuItemAccordion";
import NetworkNavigator from "./NetworkNavigator";
import Occurrences from "./Occurrences";
import Search from "./Search";
import Settings from "./Settings";
import SelectedNode from "./SelectedNode";
import Distributions from "./Distributions";
import MenuHeader from "./MenuHeader";
import { savePng, saveSvg } from "../io/export";


export default class App extends Component {
    state = {
        sidebarVisible: true,
        filename: "",
        network: null,
    };

    toggleSidebar = () => this.setState(prevState => ({ sidebarVisible: !prevState.sidebarVisible }));

    onFileLoaded = ({ network, filename }) => {
        this.setState({
            network,
            filename,
            selectedNode: network,
        });
    };

    handleNameChange = name => {
        const { selectedNode } = this.state;
        if (selectedNode) {
            selectedNode.name = name;
            this.forceUpdate();
        }
    };

    handleDownloadClicked = () => {
        const ftree = ftreeFromNetwork(this.state.network);
        const blob = new Blob([ftree], { type: "text/plain;charset=utf-8" });
        FileSaver.saveAs(blob, this.state.filename);
    };

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
        } = this.state;

        const loadingComplete = !!network;

        if (!loadingComplete) {
            return <FileDialog onFileLoaded={this.onFileLoaded}/>;
        }

        const networkNavigator = <NetworkNavigator
            root={network}
            occurrences={occurrences}
            labelsVisible={labelsVisible}
            width={window.innerWidth}
            height={window.innerHeight}
            nodeSizeBasedOn={nodeSize}
            nodeSizeScale={nodeSizeScale}
            linkWidthScale={linkWidthScale}
            simulationEnabled={simulationEnabled}
            setSearchFunction={searchFunction => this.setState({ searchFunction })}
            setSelectedNode={selectedNode => this.setState({ selectedNode })}
        />;

        return <Sidebar.Pushable style={{ height: "100vh" }}>
            <Sidebar
                style={{ overflow: "scroll!important" }}
                as={Menu}
                animation='overlay'
                width='wide'
                direction='right'
                visible={sidebarVisible}
                vertical
            >
                <Menu.Item header href="//www.mapequation.org/navigator">
                    <MenuHeader/>
                </Menu.Item>
                <Menu.Item onClick={this.toggleSidebar} icon='close' content='Hide sidebar'/>
                <Menu.Item>
                    <Input
                        type='text'
                        label='Filename'
                        labelPosition='left'
                        icon={<Icon name='download' link onClick={this.handleDownloadClicked}/>}
                        value={filename}
                        onChange={(e, { value }) => this.setState({ filename: value })}
                    />
                </Menu.Item>
                <Menu.Item>
                    <Search searchFunction={searchFunction}/>
                </Menu.Item>
                <Menu.Item>
                    <Header as="h4">
                        {selectedNode.physicalId ? "Selected node" : "Selected module"}
                    </Header>
                    <SelectedNode
                        directed={network.directed}
                        node={selectedNode}
                        onNameChange={this.handleNameChange}
                    />
                    <Menu.Menu>
                        <Distributions
                            directed={network.directed}
                            nodes={selectedNode.nodes || []}
                            figureWidth={285}
                            figureHeight={150}
                        />
                    </Menu.Menu>
                </Menu.Item>
                <MenuItemAccordion title='Occurrences'>
                    <Occurrences
                        onFilesChange={occurrences => this.setState({ occurrences }, this.forceUpdate)}
                        selectedNode={selectedNode}
                        filename={filename}
                        totalNodes={network.totalChildren}
                    />
                </MenuItemAccordion>
                <Menu.Item>
                    <Header as="h4">Settings</Header>
                    <Settings
                        onNodeSizeChange={nodeSize => this.setState({ nodeSize })}
                        onNodeSizeScaleChange={nodeSizeScale => this.setState({ nodeSizeScale })}
                        onLinkWidthScaleChange={linkWidthScale => this.setState({ linkWidthScale })}
                        onLabelsVisibleChange={labelsVisible => this.setState({ labelsVisible })}
                        onSimulationEnabledChange={simulationEnabled => this.setState({ simulationEnabled })}
                    />
                </Menu.Item>
                <Menu.Item>
                    <Header as="h4">Export</Header>
                    <Button icon size="small" labelPosition="left"
                            onClick={() => saveSvg("networkNavigatorSvg", filename + ".svg")}>
                        <Icon name="download"/>SVG
                    </Button>
                    <Button icon size="small" labelPosition="left"
                            onClick={() => savePng("networkNavigatorSvg", filename + ".png")}>
                        <Icon name="image"/>PNG
                    </Button>
                </Menu.Item>
            </Sidebar>
            <Sidebar.Pusher style={{ overflow: "hidden" }}>
                <Rail
                    internal
                    position="right"
                    style={{ paddingRight: 0, marginRight: 0, height: 0 }}
                >
                    <Menu vertical>
                        <Menu.Item
                            icon="sidebar"
                            content="Show sidebar"
                            onClick={this.toggleSidebar}
                        />
                    </Menu>
                </Rail>
                <React.StrictMode>
                    {networkNavigator}
                </React.StrictMode>
            </Sidebar.Pusher>
        </Sidebar.Pushable>;
    }
}
