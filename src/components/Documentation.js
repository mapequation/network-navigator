import React from "react";
import { Container, Grid, Header, Icon, Image } from "semantic-ui-react";
import Legend from "./Legend";
import MapEquationBibTeX from "./MapEquationBibTeX";


const Documentation = () => {
  const citeStyle = {
    backgroundColor: "#fff",
    fontSize: "0.85em",
    whiteSpace: "pre-wrap",
    padding: 5,
    lineHeight: 1.5
  };

  return <Container style={{ padding: "40px 0 100px 0" }}>
    <Grid columns={2}>
      <Grid.Column>
        <Header as="h1">Network Navigator</Header>
        <p>
          This is an interactive zoomable map for networks clustered with <a
          href="//www.mapequation.org/code.html">Infomap</a>. Think of it like Google Maps for
          hierarchical networks. Everything runs locally on your computer; no data is uploaded to any server.
        </p>

        <Header>Legend</Header>
        <p>
          Modules are drawn as circles with area proportional to the contained flow. The module border
          thickness is proportional to exiting flow. Links between nodes are aggregated on module level and
          their thickness are proportional to the flow between modules.
        </p>
        <Image size="large">
          <Legend />
        </Image>

        <Header>Requirements</Header>
        <p>
          Extensive testing has only been done with recent versions of Chrome, Safari and Firefox. This
          application is graphics heavy. Older computers or laptops with integrated GPUs can
          struggle to keep a high frame rate.
        </p>
        <Header>Limitations</Header>
        <p>
          At the moment, only the 20 highest ranked nodes are visible per module. There also is a limit on how
          large files you can use. Typically sizes in the tens of megabytes will work fine.
        </p>

        <Header as="h1">Navigation</Header>
        <Header>Zoom to reveal</Header>
        <p>
          Zoom by scrolling in and out, either with your scroll wheel or two-finger swiping up and down on
          your trackpad. Do not use the pinch-to-zoom gesture if you have a trackpad, this will zoom the
          entire page. Reveal sub-modules by zooming in far enough.
        </p>

        <Header>Click and drag to manipulate</Header>
        <p>
          Pan by clicking and drag anywhere where there is not a module or node. Manipulate the physics
          simulation by dragging modules and nodes around. This only works for one layer at a time, you can
          only move modules that have not revealed its sub-modules.

        </p>

        <Header>Information about modules</Header>
        <p>
          Select a node or module by clicking on it. Information about the currently selected node or module
          is shown in the sidebar menu under <cite>“Selected node"</cite>.
        </p>
      </Grid.Column>
      <Grid.Column>
        <Header as="h1">Feedback</Header>
        <p>
          If you have any questions, suggestions or issues regarding the software, please add them to <a
          href="//github.com/mapequation/network-navigator/issues"><Icon name="github" />GitHub
          issues</a>.
        </p>

        <Header as="h1">How to cite</Header>

        The Network Navigator is described in the thesis<br />
        <a href="//urn.kb.se/resolve?urn=urn:nbn:se:umu:diva-148551">Interactive visualization of community structure in complex networks (2018)</a>.

        <p style={{ marginTop: 10 }}>Please cite</p>

        <code>
          <pre style={citeStyle}>
          {`@mastersthesis{eriksson2018interactive,
    title = {Interactive visualization of community structure in complex networks},
    author = {Eriksson, Anton},
    publisher = {Ume\\aa University},
    school = {Department of Physics, Ume{\\aa} University},
    url = {http://urn.kb.se/resolve?urn=urn\\%3Anbn\\%3Ase\\%3Aumu\\%3Adiva-148551},
    eprint = {1215352},
    eprinttype = {diva2},
    archivePrefix = {DIvA},
    year = {2018},
    note = {\\href{http://urn.kb.se/resolve?urn=urn\\%3Anbn\\%3Ase\\%3Aumu\\%3Adiva-148551}{diva2:1215352}}
}
`}
          </pre>
        </code>

        <p>and</p>

        <code>
          <pre style={citeStyle}>
            <MapEquationBibTeX />
          </pre>
        </code>


        <Header as="h1">Supported formats</Header>
        <p>
          Currently, we support networks clustered by <a
          href="https://www.mapequation.org/code.html">Infomap</a> into the <a
          href="https://www.mapequation.org/code.html#FTree-format">ftree</a> format.
        </p>
        <p>
          Infomap is available as a <a href="https://www.mapequation.org/code.html">stand-alone</a> C++
          application and on the web as <a href="https://www.mapequation.org/infomap">Infomap Online</a>.
        </p>
      </Grid.Column>
    </Grid>
  </Container>;
};

export default Documentation;
