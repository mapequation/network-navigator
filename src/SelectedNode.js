import React from 'react';
import { Menu } from 'semantic-ui-react';
import MyAccordion from './helpers/MyAccordion';
import InfoTable from './InfoTable';
import Graph from './Graph'
import DegreeDistribution from './DegreeDistribution';

const SelectedNode = (props) => {
    const children = props.node ? props.node.nodes || [] : [];
    const flowDistribution = children.map(n => n.flow);
    const figureWidth = 285;
    const figureHeight = 150;
    const title = !props.node || (props.node && props.node.physicalId) ? 'Selected node' : 'Selected module';

    return (
        <MyAccordion title={title} visible>
            <InfoTable node={props.node} directed={props.directed} />
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
                    directed={props.directed} />
            </Menu.Menu>
        </MyAccordion>
    );
};

export default SelectedNode;
