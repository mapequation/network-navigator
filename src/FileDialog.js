import React, { Component } from 'react';
import { Segment, Button, Divider, Icon, Progress, Label } from 'semantic-ui-react';
import Help from './Help';
import parseFile from './lib/parse-file';
import parseFTree from './lib/file-formats/ftree';
import networkFromFTree from './lib/file-formats/network-from-ftree';

class FileDialog extends Component {
    state = {
        isLoading: false,
        progressLabel: '',
        progressValue: 0,
    }

    constructor(props) {
        super(props);
        this.input = null;
    }

    loadData = (file, name) => {
        if (!name && file.name) {
            name = file.name;
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

                setTimeout(() => {
                    this.setState({ isLoading: false });
                    this.props.onFileLoaded({ network, filename: name })
                }, 200);
            })
            .catch((err) => {
                this.setState({ isLoading: false });
                console.log(err)
            });
    }

    loadExampleData = () => {
        const filename = 'citation_data.ftree';

        this.setState({
            isLoading: true,
            progressValue: 1,
            progressLabel: 'Reading file',
        });

        fetch(filename)
            .then(res => res.text())
            .then(file => this.loadData(file, filename))
            .catch((err) => {
                this.setState({ isLoading: false });
                console.log(err)
            });
    }

    render() {
        return (
            <div>
                <Segment padded='very' style={{ marginTop: '200px', width: '500px' }}>
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
                    <Segment padded='very' style={{ width: '500px' }} basic>
                        <Progress
                            align='left'
                            indicating
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
