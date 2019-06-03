import PropTypes from "prop-types";
import React from "react";
import Graph from "./Graph";
import MenuItemAccordion from "./MenuItemAccordion";


const Distributions = (props) => {
  const { directed, nodes, figureWidth, figureHeight } = props;

  const flow = nodes.map(n => n.flow).sort((a, b) => b - a);
  const degree = nodes.map(n => n.kin + n.kout).sort((a, b) => b - a);
  const inDegree = nodes.map(n => n.kin).sort((a, b) => b - a);
  const outDegree = nodes.map(n => n.kout).sort((a, b) => b - a);

  const flowDistribution = (
    <MenuItemAccordion title='Module flow distribution' popup='Flow of nodes within this module.'>
      <Graph
        xDescription='Node' xLabel='n'
        yDescription='Flow' yLabel='f' logy
        width={figureWidth} height={figureHeight}
        data={flow}
      />
    </MenuItemAccordion>
  );

  const degreeDistribution = (
    <MenuItemAccordion title='Degree distribution' popup='Number of links to nodes within this module.'>
      {!directed &&
      <Graph
        xDescription='Node' xLabel='n'
        yDescription='Degree' yLabel='k'
        width={figureWidth}
        height={figureHeight}
        data={degree}
      />
      }
      {directed &&
      <React.Fragment>
        <Graph
          xDescription='Node' xLabel='n'
          yDescription='In degree' yLabel='k' ySubscript='in'
          width={figureWidth}
          height={figureHeight}
          data={inDegree}
        />
        <br/>
        <Graph
          xDescription='Node' xLabel='n'
          yDescription='Out degree' yLabel='k' ySubscript='out'
          width={figureWidth}
          height={figureHeight}
          data={outDegree}
        />
      </React.Fragment>
      }
    </MenuItemAccordion>
  );

  return (
    <React.Fragment>
      {flowDistribution}
      {degreeDistribution}
    </React.Fragment>
  );
};

Distributions.propTypes = {
  nodes: PropTypes.array.isRequired,
  figureWidth: PropTypes.number.isRequired,
  figureHeight: PropTypes.number.isRequired,
  directed: PropTypes.bool
};

Distributions.defaultProps = {
  directed: false
};

export default Distributions;
