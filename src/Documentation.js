import React from "react";
import { Container, Grid, Header, Icon } from "semantic-ui-react";


const Documentation = () =>
    <Container style={{ padding: "40px 0 100px 0" }}>
        <Grid columns={2}>
            <Grid.Column>
                <Header as="h1">Network Navigator</Header>
                <p>
                    This is an interactive map browser for networks clustered with <a
                    href='http://www.mapequation.org/code.html'>Infomap</a>. Think of it kind of like <a
                    href='http://maps.google.com'>Google Maps</a> for hierarchical networks. No data will be uploaded
                    anywhere, everything runs locally in your browser.
                </p>

                <Header>Requirements</Header>
                <p>
                    Extensive testing has only been done with recent versions of Chrome and Safari, but Firefox should
                    also work. This application is graphics heavy. Older computers, especially laptops with integrated
                    GPUs will struggle to keep a high frame rate.
                </p>
                <Header>Limitations</Header>
                <p>
                    At the moment, only the 20 highest ranked nodes are visible per module. There also is a limit on how
                    large files you can use. Typically sizes in the tens of megabytes will work fine.
                </p>

                <Header as="h1">Navigation</Header>
                <p>
                    Navigate by scrolling in and out, either with your scroll wheel or two finger swiping up and down on
                    your trackpad. Don't use the pinch-to-zoom gesture if you have a trackpad as this will zoom the
                    entire page. When a module is zoomed in far enough, the contained network will be revealed.
                </p>
                <p>
                    Pan by click and drag anywhere where there isn't a module or node. The physics simulation can be
                    manipulated by dragging modules and nodes around. This only works for one layer at a time, only
                    modules which hasn't its contained network revealed can be moved.
                </p>
                <p>
                    Select a node or module by clicking on it. Information about the currently selected node or module
                    is shown in the sidebar menu under <cite>Selected node</cite>.
                </p>
            </Grid.Column>
            <Grid.Column>
                <Header as="h1">Feedback</Header>
                <p>
                    If you have any questions, suggestions or issues regarding the software, please add them to <a
                    href="https://github.com/mapequation/network-navigator/issues"><Icon name="github"/>GitHub
                    issues</a>.
                </p>

                <Header as="h1">References</Header>
                <p>
                    If you are using the software at mapequation.org in one of your research articles or otherwise
                    want to refer to it, please cite <a href="https://www.mapequation.org/publications.html">relevant
                    publication</a> or use the following format:
                </p>
                <p>
                    D. Edler, A. Eriksson and M. Rosvall, The MapEquation software package,
                    available online at <a href="https://www.mapequation.org">mapequation.org</a>.
                </p>

                <Header as="h1">Supported formats</Header>
                <p>
                    Currently, we support networks clustered by <a
                    href="https://www.mapequation.org/code.html">Infomap</a> into the <a
                    href="https://www.mapequation.org/code.html#FTree-format">ftree</a> format.
                </p>
                <p>
                    Infomap is available as a <a href="https://www.mapequation.org/code.html">stand-alone</a> C++
                    application and on the web as <a href="https://infomap.mapequation.org">Infomap Online</a>.
                </p>
            </Grid.Column>
        </Grid>
    </Container>;
;
;

export default Documentation;
