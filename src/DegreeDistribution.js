import React from 'react';
import PropTypes from 'prop-types';
import MyAccordion from './helpers/MyAccordion';
import Graph from './Graph'

const DegreeDistribution = ({ nodes, figureWidth, figureHeight, directed }) => {
    if (!directed) {
        const degreeDistribution = nodes.map(n => n.kin + n.kout).sort((a, b) => b - a);
        return (
            <MyAccordion title='Degree distribution' popup='Number of links to nodes within this module.'>
                <Graph
                    xDescription='Node' xLabel='n'
                    yDescription='Degree' yLabel='k'
                    width={figureWidth} height={figureHeight}
                    data={degreeDistribution} />
            </MyAccordion>
        );
    } else {
        const inDegreeDistribution = nodes.map(n => n.kin).sort((a, b) => b - a);
        const outDegreeDistribution = nodes.map(n => n.kout).sort((a, b) => b - a);
        return (
            <div>
                <MyAccordion title='In degree distribution' popup='Number of incoming links to nodes within this module.'>
                    <Graph
                        xDescription='Node' xLabel='n'
                        yDescription='Degree' yLabel='k' ySubscript='in'
                        width={figureWidth} height={figureHeight}
                        data={inDegreeDistribution} />
                </MyAccordion>
                <MyAccordion title='Out degree distribution' popup='Number of outgoing links from nodes within this module.'>
                    <Graph
                        xDescription='Node' xLabel='n'
                        yDescription='Degree' yLabel='k' ySubscript='out'
                        width={figureWidth} height={figureHeight}
                        data={outDegreeDistribution} />
                </MyAccordion>
            </div>
        );
    }
};

DegreeDistribution.propTypes = {
    nodes: PropTypes.array.isRequired,
    figureWidth: PropTypes.number.isRequired,
    figureHeight: PropTypes.number.isRequired,
    directed: PropTypes.bool,
}

DegreeDistribution.defaultProps = {
    directed: false,
}

export default DegreeDistribution;
