import React from 'react';
import { Table, Popup, Input } from 'semantic-ui-react';


const InfoTable = (props) => (
    <Table celled singleLine striped compact fixed>
        {props.node &&
            <Table.Body>
                <Table.Row>
                    <Popup trigger={<Table.Cell width={5} content='Name' />}
                        size='tiny'
                        content='The node name, or the names of the largest nodes contained within.' />
                    <Table.Cell selectable style={{ padding: '0 0 0 8px' }}>
                        <Input
                            transparent
                            fluid
                            value={props.node.name} />
                    </Table.Cell>
                </Table.Row>
                <Table.Row>
                    <Popup trigger={<Table.Cell content='Tree path' />}
                        size='tiny'
                        content='Colon separated path in the tree from the root to finest-level modules.' />
                    <Table.Cell content={props.node.path.toString()} />
                </Table.Row>
                <Table.Row>
                    <Popup trigger={<Table.Cell content='Flow' />}
                        size='tiny'
                        content='The flow contained in this node.' />
                    <Table.Cell content={props.node.flow} />
                </Table.Row>
                {props.node.exitFlow > 0 &&
                    <Table.Row>
                        <Popup trigger={<Table.Cell content='Exit flow' />}
                            size='tiny'
                            content='The module exit flow.' />
                        <Table.Cell content={props.node.exitFlow} />
                    </Table.Row>
                }
                {props.directed &&
                <Table.Row>
                    <Popup trigger={<Table.Cell content='In degree' />}
                        size='tiny'
                        content='The number of incoming links to this node.' />
                    <Table.Cell content={props.node.kin} />
                </Table.Row>
                }
                {props.directed &&
                    <Table.Row>
                    <Popup trigger={<Table.Cell content='Out degree' />}
                        size='tiny'
                        content='The number of outgoing links from this node.' />
                    <Table.Cell content={props.node.kout} />
                </Table.Row>
                }
                {!props.directed &&
                <Table.Row>
                    <Popup trigger={<Table.Cell content='Degree' />}
                        size='tiny'
                        content='The number of links to this node.' />
                    <Table.Cell content={props.node.kin + props.node.kout} />
                </Table.Row>
                }
                {props.node.nodes &&
                    <Table.Row>
                        <Popup trigger={<Table.Cell content='Nodes' />}
                            size='tiny'
                            content='The number of nodes contained within this module.' />
                        <Table.Cell content={props.node.nodes.length} />
                    </Table.Row>
                }
                {props.node.links &&
                    <Table.Row>
                        <Popup trigger={<Table.Cell content='Links' />}
                            size='tiny'
                            content='The number of links contained within this module.' />
                        <Table.Cell content={props.node.links.length} />
                    </Table.Row>
                }
            </Table.Body>
        }
    </Table>
);

export default InfoTable;
