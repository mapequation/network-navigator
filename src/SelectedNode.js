import React from 'react';
import { Menu } from 'semantic-ui-react';
import MyAccordion from './MyAccordion';
import InfoTable from './InfoTable';
import GraphSlider from './GraphSlider'

const SelectedNode = (props) => {
    const children = props.node ? props.node.nodes || [] : [];
    const flowDistribution = children.map(n => n.flow);
    const inDegreeDistribution = children.map(n => n.kin).sort((a, b) => b - a);
    const outDegreeDistribution = children.map(n => n.kout).sort((a, b) => b - a);
    const figureWidth = 285;
    const figureHeight = 150;
    const title = !props.node || (props.node && props.node.physicalId) ? 'Selected node' : 'Selected module';

    return (
        <MyAccordion title={title} visible>
            <InfoTable node={props.node} />
            <Menu.Menu>
                <MyAccordion title='Module flow distribution' popup='Flow of nodes within this module.'>
                    <GraphSlider
                        xDescription='Node' xLabel='n'
                        yDescription='Flow' yLabel='f' logy
                        width={figureWidth} height={figureHeight}
                        data={flowDistribution} />
                </MyAccordion>
                <MyAccordion title='In degree distribution' popup='Number of incoming links to nodes within this module.'>
                    <GraphSlider
                        xDescription='Node' xLabel='n'
                        yDescription='Degree' yLabel='k' ySubscript='in'
                        width={figureWidth} height={figureHeight}
                        data={inDegreeDistribution} />
                </MyAccordion>
                <MyAccordion title='Out degree distribution' popup='Number of outgoing links from nodes within this module.'>
                    <GraphSlider
                        xDescription='Node' xLabel='n'
                        yDescription='Degree' yLabel='k' ySubscript='out'
                        width={figureWidth} height={figureHeight}
                        data={outDegreeDistribution} />
                </MyAccordion>
            </Menu.Menu>
        </MyAccordion>
    );
};

export default SelectedNode;
