import React from 'react';
import PropTypes from 'prop-types';
import MyAccordion from './helpers/MyAccordion';
import { Table, Icon, Button } from 'semantic-ui-react';
import { BarChart, XAxis, YAxis, Bar, Cell } from 'recharts';
import * as d3 from 'd3';
import parseFile from './lib/parse-file';
import { traverseDepthFirst } from './lib/network';
import FileSaver from 'file-saver';

export default class Occurrences extends React.Component {
    state = {
        files: [],
    }

    constructor(props) {
        super(props);
        this.colors = d3.schemeCategory10;
    }

    static propTypes = {
        onFilesChange: PropTypes.func,
        selectedNode: PropTypes.object,
    }

    static defaultProps = {
        onFilesChange: () => null,
    }

    fileColor = file => !file.enabled ? 'white' : this.colors[this.state.files.indexOf(file) % this.colors.length];

    loadFile = (file) => {
        return parseFile(file)
            .then((parsed) => {
                this.setState(prevState => ({
                    files: [
                        ...prevState.files,
                        {
                            name: file.name,
                            content: parsed.data.map(item => item[0]), // FIXME
                            errors: parsed.errors,
                            enabled: true,
                        }
                    ]
                }), this.handleChange);
            })
            .catch(err => console.log(err));
    }

    removeFile = (file) => {
        this.setState(prevState =>
            ({ files: prevState.files.filter(item => item !== file) }),
            this.handleChange);
    }

    validFiles = () => this.state.files
        .filter(file => file.errors.length === 0)
        .filter(file => file.enabled);

    handleChange = () => {
        this.props.onFilesChange(
            this.validFiles()
                .map(file => ({
                    name: file.name,
                    content: file.content,
                    color: this.fileColor(file),
                }))
        );
    }

    toggleEnabled = (file) => {
        file.enabled = !file.enabled;
        this.setState(prevState =>
            ({ files: prevState.files }),
            this.handleChange);
    }

    handleDownloadClicked = () => {
        const { selectedNode, filename } = this.props;

        const occurrences = new Map(this.validFiles().map(file => [file.name, []]));

        this.validFiles().forEach((file) => {
            const key = this.fileColor(file);

            for (let node of traverseDepthFirst(selectedNode)) {
                if (node.occurred && node.occurred.has(key)) {
                    occurrences.get(file.name).push(node.physicalId);
                }
            }
        });

        const serializedOccurrences = Array.from(occurrences).map(each =>
            `"${each[0]}",${each[1].toString()}`)
            .join('\n');

        const blob = new Blob([serializedOccurrences], { type: 'text/csv;charset=utf-8' });
        const basename = filename.lastIndexOf('.') !== -1 ? filename.substring(0, filename.lastIndexOf('.')) : filename;
        FileSaver.saveAs(blob, `${basename}-${selectedNode.path}.csv`);
    }

    render() {
        const { selectedNode } = this.props;

        return (
            <MyAccordion title='Occurrences'>
                <Table celled singleLine compact fixed>
                    <Table.Header>
                        <Table.Row>
                            <Table.HeaderCell content='File' width='10' />
                            <Table.HeaderCell content='Nodes' width='4' />
                            <Table.HeaderCell content='Color' width='4' />
                        </Table.Row>
                    </Table.Header>
                    <Table.Body>
                        {!this.state.files.length &&
                            <Table.Row disabled>
                                <Table.Cell content='No files loaded' />
                                <Table.Cell content='' />
                                <Table.Cell content='' />
                            </Table.Row>
                        }
                        {this.state.files.map((file, i) =>
                            <Table.Row key={i}>
                                <Table.Cell error={file.errors.length > 0} title={file.name}>
                                    <Icon name='delete' onClick={() => this.removeFile(file)} />
                                    {file.name}
                                </Table.Cell>
                                <Table.Cell content={file.content.length} title={file.content.length} />
                                <Table.Cell style={{ background: this.fileColor(file) }} onClick={() => this.toggleEnabled(file)} />
                            </Table.Row>
                        )}
                    </Table.Body>
                    <Table.Footer>
                        <Table.Row>
                            <Table.HeaderCell colSpan='3'>
                                <Button as='label'
                                    compact
                                    size='mini'
                                    icon='plus'
                                    content='Add file'
                                    htmlFor='occurrences'
                                />
                                <input style={{ display: 'none' }}
                                    type='file'
                                    multiple
                                    id='occurrences'
                                    onChange={(event) => {
                                        Array.from(this.input.files).forEach(file => this.loadFile(file));
                                        event.target.value = null;
                                    }}
                                    ref={input => this.input = input}
                                />
                            </Table.HeaderCell>
                        </Table.Row>
                    </Table.Footer>
                </Table>
                {selectedNode != null && selectedNode.occurrences && selectedNode.occurrences.size > 0 &&
                    <div style={{ textAlign: 'center' }}>
                        <BarChart
                            width={285} height={150}
                            margin={{ top: 5, right: 0, bottom: 0, left: -10 }}
                            data={Array.from(selectedNode.occurrences).map(o => ({ name: o[0], value: o[1] }))}>
                            <XAxis tick={false} />
                            <YAxis />
                            <Bar dataKey='value'>
                                {
                                    Array.from(selectedNode.occurrences.keys()).map((color, i) =>
                                        <Cell fill={color} key={i} />
                                    )
                                }
                            </Bar>
                        </BarChart>
                        <Button compact size='mini' onClick={this.handleDownloadClicked}>Download CSV</Button>
                    </div>
                }
            </MyAccordion>
        )
    }
}
