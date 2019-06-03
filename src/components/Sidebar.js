import FileSaver from "file-saver";
import React from "react";
import { Button, Header, Icon, Input, Menu, Sidebar as SemanticSidebar } from "semantic-ui-react";
import { savePng, saveSvg } from "../io/export";
import ftreeFromNetwork from "../io/ftree-from-network";
import Distributions from "./Distributions";
import MenuHeader from "./MenuHeader";
import MenuItemAccordion from "./MenuItemAccordion";
import NetworkNavigator from "./NetworkNavigator";
import Occurrences from "./Occurrences";
import Search from "./Search";
import SelectedNode from "./SelectedNode";
import Settings from "./Settings";
import ShowSidebarButton from "./ShowSidebarButton";


export default class Sidebar extends React.Component {
  state = {
    sidebarVisible: true,
    selectedNode: null
  };

  toggleSidebar = () => this.setState(state => ({ sidebarVisible: !state.sidebarVisible }));

  handleNameChange = name => {
    const { selectedNode } = this.state;
    if (selectedNode) {
      selectedNode.name = name;
      this.forceUpdate();
    }
  };

  handleDownloadClicked = () => {
    const { network, filename } = this.props;
    const ftree = ftreeFromNetwork(network);
    const blob = new Blob([ftree], { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(blob, filename);
  };

  render() {
    const { network, filename } = this.props;
    const {
      sidebarVisible,
      searchFunction,
      occurrences,
      labelsVisible,
      nodeSize,
      nodeSizeScale,
      linkWidthScale,
      simulationEnabled
    } = this.state;

    const selectedNode = this.state.selectedNode || network;

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

    return <SemanticSidebar.Pushable style={{ height: "100vh" }}>
      <SemanticSidebar
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
          <Search onSearchChange={searchFunction}/>
        </Menu.Item>
        <Menu.Item>
          <Header as="h4">
            {selectedNode.physicalId ? "Selected node" : "Selected module"}
          </Header>
          <SelectedNode
            node={selectedNode}
            directed={network.directed}
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
      </SemanticSidebar>
      <SemanticSidebar.Pusher style={{ overflow: "hidden" }}>
        <ShowSidebarButton onClick={this.toggleSidebar}/>
        <React.StrictMode>
          {networkNavigator}
        </React.StrictMode>
      </SemanticSidebar.Pusher>
    </SemanticSidebar.Pushable>;
  }
}
