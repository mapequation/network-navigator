import FileSaver from "file-saver";
import React, { useContext } from "react";
import { Header, Menu, Sidebar as SemanticSidebar } from "semantic-ui-react";
import { savePng, saveSvg } from "../io/export";
import ftreeFromNetwork from "../io/ftree-from-network";
import Distributions from "./Distributions";
import MenuHeader from "./MenuHeader";
import Occurrences from "./Occurrences";
import SelectedNode from "./SelectedNode";
import Settings from "./Settings";
import Dispatch from "../context/Dispatch";
import Search from "./Search";


export default function Sidebar(props) {
  const {
    network,
    filename,
    sidebarVisible,
    searchCallback,
    selectedNode
  } = props;

  const { dispatch } = useContext(Dispatch);

  const handleDownloadClick = () => {
    const ftree = ftreeFromNetwork(network);
    const blob = new Blob([ftree], { type: "text/plain;charset=utf-8" });
    FileSaver.saveAs(blob, filename);
  };

  return <SemanticSidebar
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
    <Menu.Item onClick={() => dispatch({ type: "sidebarVisible", value: false })} icon='close' content='Hide sidebar'/>
    <Menu.Item>
      <Search onChange={searchCallback}/>
    </Menu.Item>
    <Menu.Item>
      <Header as="h4">
        {selectedNode.physicalId ? "Selected node" : "Selected module"}
      </Header>
      <SelectedNode
        node={selectedNode}
        directed={network.directed}
      />
      <Distributions
        nodes={selectedNode.nodes || []}
        directed={network.directed}
      />
    </Menu.Item>
    <Menu.Item>
      <Header as="h4">
        Occurrences
      </Header>
      <Occurrences
        onChange={value => dispatch({ type: "occurrences", value })}
        selectedNode={selectedNode}
        filename={filename}
        totalNodes={network.totalChildren}
      />
    </Menu.Item>
    <Menu.Item>
      <Header as="h4">Settings</Header>
      <Settings {...props} />
    </Menu.Item>
    <Menu.Item>
      <Header as="h4">Export</Header>
      <Menu.Menu>
        <Menu.Item
          icon="download"
          content={"Download network"}
          onClick={handleDownloadClick}
        />
      </Menu.Menu>
      <Menu.Menu>
        <Menu.Item
          icon="download"
          onClick={() => saveSvg("networkNavigatorSvg", filename + ".svg")}
          content="Download SVG"
        />
      </Menu.Menu>
      <Menu.Menu>
        <Menu.Item
          icon="image"
          onClick={() => savePng("networkNavigatorSvg", filename + ".png")}
          content="Download PNG"
        />
      </Menu.Menu>
    </Menu.Item>
  </SemanticSidebar>;
}
