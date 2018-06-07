import React from 'react';
import PropTypes from 'prop-types';
import { Menu } from 'semantic-ui-react';
import MyAccordion from './helpers/MyAccordion';
import InfoTable from './InfoTable';
import Graph from './Graph'
import DegreeDistribution from './DegreeDistribution';
import { BarChart, XAxis, YAxis, Bar, Cell } from 'recharts';

const SelectedNode = ({ node, directed, onNameChange }) => {
    const children = node ? node.nodes || [] : [];
    const flowDistribution = children.map(n => n.flow);
    const figureWidth = 285;
    const figureHeight = 150;
    const title = !node || (node && node.physicalId) ? 'Selected node' : 'Selected module';

    return (
        <MyAccordion title={title} visible>
            <InfoTable node={node} directed={directed} onNameChange={onNameChange} />
            <Menu.Menu>
                <MyAccordion title='Module flow distribution' popup='Flow of nodes within this module.'>
                    <Graph
                        xDescription='Node' xLabel='n'
                        yDescription='Flow' yLabel='f' logy
                        width={figureWidth} height={figureHeight}
                        data={flowDistribution} />
                </MyAccordion>
                <DegreeDistribution
                    nodes={children}
                    figureWidth={figureWidth} figureHeight={figureHeight}
                    directed={directed} />
                { node.occurrences.size > 0 &&
                <MyAccordion title='Occurrences histogram'>
                    <BarChart
                        width={figureWidth} height={figureHeight}
                        margin={{top: 5, right: 0, bottom: 0, left: -10}}
                        data={Array.from(node.occurrences).map(o => ({ name: o[0], value: o[1] }))}>
                        <XAxis tick={false} />
                        <YAxis />
                        <Bar dataKey='value'>
                        {
                            Array.from(node.occurrences.keys()).map((color, i) =>
                                <Cell fill={color} key={i} />
                            )
                        }
                        </Bar>
                    </BarChart>
                </MyAccordion>
                }
            </Menu.Menu>
        </MyAccordion>
    );
};

SelectedNode.propTypes = {
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
    onNameChange: PropTypes.func,
    directed: PropTypes.bool,
};

SelectedNode.defaultProps = {
    onNameChange: () => null,
    directed: false,
};

export default SelectedNode;
