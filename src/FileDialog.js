import React, { Component } from 'react';
import { Segment, Button, Divider, Icon, Progress, Label } from 'semantic-ui-react';
import Help from './Help';
import parseFile from './lib/parse-file';
import parseFTree from './lib/file-formats/ftree';
import networkFromFTree from './lib/file-formats/network-from-ftree';

const initialState = {
    isLoading: false,
    progressLabel: '',
    progressValue: 0,
    progressError: false,
};

class FileDialog extends Component {
    state = initialState;

    constructor(props) {
        super(props);
        this.input = null;
        this.progressTimeout = null;
    }

    componentWillUnmount() {
        clearTimeout(this.progressTimeout);
    }

    loadData = (file, name) => {
        if (!name && file.name) {
            name = file.name;
        }

        this.setState({
            isLoading: true,
            progressValue: 1,
            progressLabel: 'Reading file',
            progressError: false,
        });

        this.progressTimeout = setTimeout(() =>
            this.setState({
                progressValue: 2,
                progressLabel: 'Parsing',
            }), 400);

        parseFile(file)
            .then((parsed) => {
                clearTimeout(this.progressTimeout);

                const ftree = parseFTree(parsed.data);

                if (ftree.errors.length) {
                    throw new Error(ftree.errors[0]);
                }

                const network = networkFromFTree(ftree);

                this.setState({
                    progressValue: 3,
                    progressLabel: 'Success',
                });

                this.progressTimeout = setTimeout(() => {
                    this.setState({ isLoading: false });
                    this.props.onFileLoaded({ network, filename: name })
                }, 200);
            })
            .catch((err) => {
                clearTimeout(this.progressTimeout);
                this.setState({
                    progressError: true,
                    progressLabel: err.toString(),
                });
                console.log(err);
            });
    }

    loadExampleData = () => {
        const filename = 'citation_data.ftree';

        this.setState({
            isLoading: true,
            progressValue: 1,
            progressLabel: 'Reading file',
            progressError: false,
        });

        fetch(filename)
            .then(res => res.text())
            .then(file => this.loadData(file, filename))
            .catch((err) => {
                this.setState({
                    progressError: true,
                    progressLabel: err.toString(),
                });
                console.log(err);
            });
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
                    <label className='ui fluid primary button' htmlFor='fileUpload'>
                        <Icon name='upload' />Load data...
                    </label>
                    <input style={{ display: 'none' }}
                        type='file'
                        id='fileUpload'
                        onChange={() => this.loadData(this.input.files[0])}
                        ref={input => this.input = input} />
                    <Divider horizontal>or</Divider>
                    <Button fluid secondary onClick={this.loadExampleData}>Load citation data</Button>
                </Segment>
                {this.state.isLoading &&
                    <Segment padded='very' style={{ ...width }} basic>
                        <Progress
                            align='left'
                            indicating
                            error={this.state.progressError}
                            label={this.state.progressLabel}
                            total={3}
                            value={this.state.progressValue} />
                    </Segment>
                }
            </div>
        );
    }
}

export default FileDialog;
