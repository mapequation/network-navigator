import React from 'react';
import PropTypes from 'prop-types';
import { Menu } from 'semantic-ui-react';
import MenuItemAccordion from './MenuItemAccordion';
import InfoTable from './InfoTable';
import Graph from './Graph'
import DegreeDistribution from './DegreeDistribution';

const SelectedNode = ({ node, directed, onNameChange }) => {
    const children = node ? node.nodes || [] : [];
    const flowDistribution = children.map(n => n.flow).sort((a, b) => b - a);
    const figureWidth = 285;
    const figureHeight = 150;
    const title = !node || (node && node.physicalId) ? 'Selected node' : 'Selected module';

    return (
        <MenuItemAccordion title={title} visible>
            <InfoTable node={node} directed={directed} onNameChange={onNameChange} />
            <Menu.Menu>
                <MenuItemAccordion title='Module flow distribution' popup='Flow of nodes within this module.'>
                    <Graph
                        xDescription='Node' xLabel='n'
                        yDescription='Flow' yLabel='f' logy
                        width={figureWidth} height={figureHeight}
                        data={flowDistribution} />
                </MenuItemAccordion>
                <DegreeDistribution
                    nodes={children}
                    figureWidth={figureWidth} figureHeight={figureHeight}
                    directed={directed} />
            </Menu.Menu>
        </MenuItemAccordion>
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
