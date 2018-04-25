import React from 'react';
import { Table } from 'semantic-ui-react';

const InfoTable = (props) => (
    <Table celled singleLine striped compact fixed>
    {props.node &&
        <Table.Body>
            <Table.Row>
                <Table.Cell width={5}>Name</Table.Cell>
                <Table.Cell content={props.node.name} />
            </Table.Row>
            <Table.Row>
                <Table.Cell>Tree path</Table.Cell>
                <Table.Cell>{props.node.path.toString()}</Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.Cell>Flow</Table.Cell>
                <Table.Cell>{props.node.flow}</Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.Cell>Exit flow</Table.Cell>
                <Table.Cell>{props.node.exitFlow}</Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.Cell>In degree</Table.Cell>
                <Table.Cell>{props.node.kin}</Table.Cell>
            </Table.Row>
            <Table.Row>
                <Table.Cell>Out degree</Table.Cell>
                <Table.Cell>{props.node.kout}</Table.Cell>
            </Table.Row>
            {props.node.nodes &&
            <Table.Row>
                <Table.Cell>Nodes</Table.Cell>
                <Table.Cell>{props.node.nodes.length}</Table.Cell>
            </Table.Row>
            }
            {props.node.links &&
            <Table.Row>
                <Table.Cell>Links</Table.Cell>
                <Table.Cell>{props.node.links.length}</Table.Cell>
            </Table.Row>
            }
        </Table.Body>
    }
    </Table>
);

export default InfoTable;
