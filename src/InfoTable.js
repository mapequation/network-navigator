import React from 'react';
import PropTypes from 'prop-types';
import { Table, Popup, Input } from 'semantic-ui-react';

const InfoTable = ({ node, directed }) => (
    <Table celled singleLine striped compact fixed>
        <Table.Body>
            <Table.Row>
                <Popup trigger={<Table.Cell width={5} content='Name' />}
                    size='tiny'
                    content='The node name, or the names of the largest nodes contained within.' />
                <Table.Cell selectable style={{ padding: '0 0 0 8px' }}>
                    <Input
                        transparent
                        fluid
                        value={node.name} />
                </Table.Cell>
            </Table.Row>
            <Table.Row>
                <Popup trigger={<Table.Cell content='Tree path' />}
                    size='tiny'
                    content='Colon separated path in the tree from the root to finest-level modules.' />
                <Table.Cell content={node.path.toString()} />
            </Table.Row>
            <Table.Row>
                <Popup trigger={<Table.Cell content='Flow' />}
                    size='tiny'
                    content='The flow contained in this node.' />
                <Table.Cell content={node.flow} />
            </Table.Row>
            {node.exitFlow > 0 &&
                <Table.Row>
                    <Popup trigger={<Table.Cell content='Exit flow' />}
                        size='tiny'
                        content='The module exit flow.' />
                    <Table.Cell content={node.exitFlow} />
                </Table.Row>
            }
            {directed &&
                <Table.Row>
                    <Popup trigger={<Table.Cell content='In degree' />}
                        size='tiny'
                        content='The number of incoming links to this node.' />
                    <Table.Cell content={node.kin} />
                </Table.Row>
            }
            {directed &&
                <Table.Row>
                    <Popup trigger={<Table.Cell content='Out degree' />}
                        size='tiny'
                        content='The number of outgoing links from this node.' />
                    <Table.Cell content={node.kout} />
                </Table.Row>
            }
            {!directed &&
                <Table.Row>
                    <Popup trigger={<Table.Cell content='Degree' />}
                        size='tiny'
                        content='The number of links to this node.' />
                    <Table.Cell content={node.kin + node.kout} />
                </Table.Row>
            }
            {node.nodes &&
                <Table.Row>
                    <Popup trigger={<Table.Cell content='Nodes' />}
                        size='tiny'
                        content='The number of nodes contained within this module.' />
                    <Table.Cell content={node.nodes.length} />
                </Table.Row>
            }
            {node.links &&
                <Table.Row>
                    <Popup trigger={<Table.Cell content='Links' />}
                        size='tiny'
                        content='The number of links contained within this module.' />
                    <Table.Cell content={node.links.length} />
                </Table.Row>
            }
        </Table.Body>
    </Table>
);

InfoTable.propTypes = {
    node: PropTypes.shape({
        name: PropTypes.string,
        path: PropTypes.object,
        kin: PropTypes.number,
        kout: PropTypes.number,
        flow: PropTypes.number,
        exitFlow: PropTypes.number,
        nodes: PropTypes.array,
        links: PropTypes.array,
    }).isRequired,
    directed: PropTypes.bool,
}

InfoTable.defaultProps = {
    directed: false,
}

export default InfoTable;
