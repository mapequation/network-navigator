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
    const figureHeight = 120;

    return (
        <MyAccordion title='Selected node' visible>
            <InfoTable node={props.node} />
            <Menu.Menu>
                <MyAccordion title='Flow distribution' popup='Flow of nodes within this module.'>
                    <GraphSlider
                        width={figureWidth} height={figureHeight}
                        data={flowDistribution} />
                </MyAccordion>
                <MyAccordion title='In degree distribution' popup='Number of incoming links to nodes within this module.'>
                    <GraphSlider
                        width={figureWidth} height={figureHeight}
                        data={inDegreeDistribution} />
                </MyAccordion>
                <MyAccordion title='Out degree distribution' popup='Number of outgoing links from nodes within this module.'>
                    <GraphSlider
                        width={figureWidth} height={figureHeight}
                        data={outDegreeDistribution} />
                </MyAccordion>
            </Menu.Menu>
        </MyAccordion>
    );
};

export default SelectedNode;