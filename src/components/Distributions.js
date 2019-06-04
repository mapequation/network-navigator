import PropTypes from "prop-types";
import React from "react";
import { Menu } from "semantic-ui-react";
import Graph from "./Graph";
import MenuItemAccordion from "./MenuItemAccordion";


export default function Distributions(props) {
  const { directed, nodes, ...size } = props;

  const flow = nodes.map(n => n.flow).sort((a, b) => b - a);
  const degree = nodes.map(n => n.kin + n.kout).sort((a, b) => b - a);
  const inDegree = nodes.map(n => n.kin).sort((a, b) => b - a);
  const outDegree = nodes.map(n => n.kout).sort((a, b) => b - a);

  const flowDistribution = (
    <MenuItemAccordion title='Flow distribution' popup='Flow of nodes within this module.'>
      <Graph
        xDescription='Node' xLabel='n'
        yDescription='Flow' yLabel='f' logy
        data={flow}
        {...size}
      />
    </MenuItemAccordion>
  );

  const degreeDistribution = (
    <MenuItemAccordion title='Degree distribution' popup='Number of links to nodes within this module.'>
      {!directed &&
      <Graph
        xDescription='Node' xLabel='n'
        yDescription='Degree' yLabel='k'
        data={degree}
        {...size}
      />
      }
      {directed &&
      <React.Fragment>
        <Graph
          xDescription='Node' xLabel='n'
          yDescription='In degree' yLabel='k' ySubscript='in'
          data={inDegree}
          {...size}
        />
        <br/>
        <Graph
          xDescription='Node' xLabel='n'
          yDescription='Out degree' yLabel='k' ySubscript='out'
          data={outDegree}
          {...size}
        />
      </React.Fragment>
      }
    </MenuItemAccordion>
  );

  return (
    <React.Fragment>
      <Menu.Menu>
        {flowDistribution}
      </Menu.Menu>
      <Menu.Menu>
        {degreeDistribution}
      </Menu.Menu>
    </React.Fragment>
  );
};

Distributions.propTypes = {
  nodes: PropTypes.array.isRequired,
  width: PropTypes.number,
  height: PropTypes.number,
  directed: PropTypes.bool
};

Distributions.defaultProps = {
  width: 285,
  height: 150,
  directed: false
};
