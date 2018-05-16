import React from 'react';
import PropTypes from 'prop-types';
import { Segment, Button, Divider, Icon, Progress, Label } from 'semantic-ui-react';
import Help from './Help';
import parseFile from './lib/parse-file';
import parseFTree from './lib/file-formats/ftree';
import networkFromFTree from './lib/file-formats/network-from-ftree';

class FileDialog extends React.Component {
    state = {
        loadingComplete: false,
        progressVisible: false,
        progressLabel: '',
        progressValue: 0,
        progressError: false,
    };

    static propTypes = {
        onFileLoaded: PropTypes.func.isRequired,
    }

    constructor(props) {
        super(props);
        this.inputs = {};
        this.progressTimeout = null;
    }

    errorState = err => ({
        progressError: true,
        progressLabel: err.toString(),
    });

    componentWillUnmount() {
        clearTimeout(this.progressTimeout);
    }

    loadNetwork = (file, name) => {
        if (!name && file.name) {
            name = file.name;
        }

        this.setState({
            loadingComplete: false,
            progressVisible: true,
            progressValue: 1,
            progressLabel: 'Reading file',
            progressError: false,
        });

        this.progressTimeout = setTimeout(() =>
            this.setState({
                progressValue: 2,
                progressLabel: 'Parsing',
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
                    progressLabel: 'Success',
                    loadingComplete: true,
                    network,
                    filename: name,
                });
            })
            .catch((err) => {
                clearTimeout(this.progressTimeout);
                this.setState(this.errorState(err));
                console.log(err);
            });
    }

    loadExampleData = () => {
        const filename = 'citation_data.ftree';

        this.setState({
            loadingComplete: false,
            progressVisible: true,
            progressValue: 1,
            progressLabel: 'Reading file',
            progressError: false,
        });

        fetch(filename)
            .then(res => res.text())
            .then(file => this.loadNetwork(file, filename))
            .then(() => this.props.onFileLoaded({
                network: this.state.network,
                filename: this.state.filename,
            }))
            .catch((err) => {
                this.setState(this.errorState(err));
                console.log(err);
            });
    }

    loadOccurences = (file) => {
        this.setState({
            progressVisible: true,
            progressValue: 1,
            progressLabel: 'Reading file',
            progressError: false,
        });

        this.progressTimeout = setTimeout(() =>
            this.setState({
                progressValue: 2,
                progressLabel: 'Parsing',
            }), 400);

        return parseFile(file)
            .then((parsed) => {
                clearTimeout(this.progressTimeout);

                if (parsed.errors.length) {
                    throw new Error(parsed.errors[0].message);
                }

                const occurrences = parsed.data.map(arr => arr[0]);

                this.setState({
                    progressValue: 3,
                    progressLabel: 'Success',
                    occurrences,
                });
            })
            .catch((err) => {
                clearTimeout(this.progressTimeout);
                this.setState(this.errorState(err));
                console.log(err);
            });
    }

    handleRunButtonClicked = () => {
        const network = {
            network: this.state.network,
            filename: this.state.filename,
        }

        const result = this.state.occurrences
            ? {
                ...network,
                occurrences: this.state.occurrences,
            }
            : network;

        this.props.onFileLoaded(result);
    }

    render() {
        const width = {
            maxWidth: '500px',
            width: '80%',
        };

        return (
            <div>
                <Segment padded='very' style={{ marginTop: '200px', ...width }}>
                    <Help trigger={<Label as='a' corner='right' icon='help' />} />
                    <Button.Group fluid>
                        <label className='ui primary button' htmlFor='networkUpload'>
                            <Icon name='upload' />Load network...
                        </label>
                        <label className='ui button' htmlFor='occurencesUpload'>
                            <Icon name='map pin' />Load occurences...
                        </label>
                    </Button.Group>
                    <input style={{ display: 'none' }}
                        type='file'
                        id='networkUpload'
                        onChange={() => this.loadNetwork(this.inputs.network.files[0])}
                        ref={input => this.inputs.network = input}
                    />
                    <input style={{ display: 'none' }}
                        type='file'
                        id='occurencesUpload'
                        onChange={() => this.loadOccurences(this.inputs.occurences.files[0])}
                        ref={input => this.inputs.occurences = input}
                    />
                    <Divider horizontal>or</Divider>
                    <Button fluid secondary onClick={this.loadExampleData}>Load citation data</Button>
                </Segment>
                <Segment padded='very' style={{ ...width }} basic>
                    {this.state.progressVisible &&
                        <Progress
                            align='left'
                            indicating
                            error={this.state.progressError}
                            label={this.state.progressLabel}
                            total={3}
                            value={this.state.progressValue}
                        />
                    }
                    {this.state.loadingComplete &&
                        <Button
                            positive
                            fluid
                            content='Run'
                            onClick={this.handleRunButtonClicked}
                        />
                    }
                </Segment>
            </div>
        );
    }
}

export default FileDialog;
