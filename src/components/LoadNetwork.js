import React from "react";
import PropTypes from "prop-types";
import localforage from "localforage";
import { Container, Divider, Image, Progress, Segment, Step } from "semantic-ui-react";
import Background from "../images/Background.svg";
import parseFTree from "../lib/file-formats/ftree";
import networkFromFTree from "../lib/file-formats/network-from-ftree";
import parseFile from "../io/parse-file";


const errorState = err => ({
    progressError: true,
    progressLabel: err.toString(),
});


export default class LoadNetwork extends React.Component {
    state = {
        progressVisible: false,
        progressLabel: "",
        progressValue: 0,
        progressError: false,
        ftree: null,
    };

    static propTypes = {
        onFileLoaded: PropTypes.func.isRequired,
    };

    progressTimeout = null;

    componentDidMount() {
        const urlParams = new URLSearchParams(window.location.search);
        const args = urlParams.get('infomap');

        localforage.config({ name: "infomap" });
        localforage.getItem("ftree")
            .then(ftree => {
                this.setState({ ftree });
                if (args) {
                    this.loadNetwork(ftree, args);
                }
            });
    }

    componentWillUnmount() {
        clearTimeout(this.progressTimeout);
    }

    loadNetwork = (file, name) => {
        if (!name && file.name) {
            name = file.name;
        }

        this.setState({
            progressVisible: true,
            progressValue: 1,
            progressLabel: "Reading file",
            progressError: false,
        });

        this.progressTimeout = setTimeout(() =>
            this.setState({
                progressValue: 2,
                progressLabel: "Parsing",
            }), 400);

        return parseFile(file)
            .then((parsed) => {
                clearTimeout(this.progressTimeout);

                if (parsed.errors.length) {
                    throw new Error(parsed.errors[0].message);
                }

                const ftree = parseFTree(parsed.data);

                if (ftree.errors.length) {
                    throw new Error(ftree.errors[0]);
                }

                const network = networkFromFTree(ftree);

                this.setState({
                    progressValue: 3,
                    progressLabel: "Success",
                });

                this.progressTimeout = setTimeout(() => {
                    this.setState({ progressVisible: false });
                    this.props.onFileLoaded({ network, filename: name });
                }, 200);
            })
            .catch((err) => {
                clearTimeout(this.progressTimeout);
                this.setState(errorState(err));
                console.log(err);
            });
    };

    loadExampleData = () => {
        const filename = "citation_data.ftree";

        this.setState({
            progressVisible: true,
            progressValue: 1,
            progressLabel: "Reading file",
            progressError: false,
        });

        fetch(filename)
            .then(res => res.text())
            .then(file => this.loadNetwork(file, filename))
            .catch((err) => {
                this.setState(errorState(err));
                console.log(err);
            });
    };

    render() {
        const { progressError, progressLabel, progressValue, progressVisible, ftree } = this.state;

        const disabled = progressVisible && !progressError;

        const background = {
            padding: "100px 0 100px 0",
            background: `linear-gradient(hsla(0, 0%, 100%, 0.5), hsla(0, 0%, 100%, 0.5)), url(${Background}) no-repeat`,
            backgroundSize: "cover",
            backgroundPosition: "center top",
        };

        return (
            <div style={background}>
                <Segment
                    as={Container}
                    text
                    textAlign="center"
                    style={{ padding: "50px 0px" }}
                    padded='very'
                >

                    <Step.Group>
                        <Step
                            disabled={disabled}
                            icon="book"
                            title="Load example"
                            description="Citation network"
                            link
                            onClick={this.loadExampleData}
                        />
                    </Step.Group>

                    {!!ftree &&
                    <React.Fragment>
                        <Divider hidden/>

                        <Step.Group>
                            <Step
                                disabled={disabled}
                                link
                                onClick={() => this.loadNetwork(ftree, "infomap.ftree")}
                            >
                                <Image
                                    spaced="right"
                                    size="tiny"
                                    disabled={disabled}
                                    verticalAlign="middle"
                                    src="//www.mapequation.org/assets/img/twocolormapicon_whiteboarder.svg"
                                    alt="mapequation-icon"
                                />
                                <Step.Content>
                                    <Step.Title>
                                        Open from <span className="brand brand-infomap">Infomap</span> <span
                                        className="brand brand-nn">Online</span>
                                    </Step.Title>
                                </Step.Content>
                            </Step>
                        </Step.Group>
                    </React.Fragment>
                    }

                    <Divider horizontal style={{ margin: "20px 100px 30px 100px" }} content="Or"/>

                    <Step.Group ordered>
                        <Step
                            disabled={disabled}
                            link
                            as="a"
                            href="//www.mapequation.org/infomap"
                        >
                            <Step.Content>
                                <Step.Title>Cluster network with Infomap</Step.Title>
                                <Step.Description>
                                    Command line version or <span className="brand brand-infomap">Infomap</span> <span
                                    className="brand brand-nn">Online</span>
                                </Step.Description>
                            </Step.Content>
                        </Step>
                        <Step
                            disabled={disabled}
                            as="label"
                            link
                            active={!disabled}
                            title="Load ftree file"
                            htmlFor="upload"
                        />
                    </Step.Group>
                    <input
                        style={{ visibility: "hidden" }}
                        type='file'
                        id='upload'
                        onChange={() => this.loadNetwork(this.input.files[0])}
                        accept=".ftree"
                        ref={input => this.input = input}
                    />

                    {progressVisible &&
                    <div style={{ padding: "50px 100px 0" }}>
                        <Progress
                            align='left'
                            indicating
                            total={3}
                            error={progressError}
                            label={progressLabel}
                            value={progressValue}
                        />
                    </div>
                    }
                </Segment>
            </div>
        );
    }
}
