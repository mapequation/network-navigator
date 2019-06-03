import PropTypes from "prop-types";
import React, { useState } from "react";
import { Checkbox, Form, Radio } from "semantic-ui-react";


export default function Settings(props) {
  const [nodeSize, setNodeSize] = useState("flow");
  const [nodeScale, setNodeScale] = useState("root");
  const [linkScale, setLinkScale] = useState("root");
  const [labelsVisible, setLabelsVisible] = useState(true);
  const [simulationEnabled, setSimulationEnabled] = useState(true);

  const handleNodeSizeChange = (e, { value }) => {
    setNodeSize(value);
    props.onNodeSizeChange(value);
  };

  const handleNodeScaleChange = (e, { value }) => {
    setNodeScale(value);
    props.onNodeScaleChange(value);
  };

  const handleLinkScaleChange = (e, { value }) => {
    setLinkScale(value);
    props.onLinkScaleChange(value);
  };

  const handleLabelsVisibleChange = (e, { checked }) => {
    setLabelsVisible(checked);
    props.onLabelsVisibleChange(checked);
  };

  const handleSimulationEnabledChange = (e, { checked }) => {
    setSimulationEnabled(checked);
    props.onSimulationEnabledChange(checked);
  };

  return (
    <React.Fragment>
      <Form>
        <Form.Group>
          <Form.Field>Module size based on</Form.Field>
          <Form.Field
            control={Radio}
            label='flow'
            value='flow'
            checked={nodeSize === "flow"}
            onChange={handleNodeSizeChange}
          />
          <Form.Field
            control={Radio}
            label='nodes'
            value='nodes'
            checked={nodeSize === "nodes"}
            onChange={handleNodeSizeChange}
          />
        </Form.Group>

        <Form.Group>
          <Form.Field>Module radius scale as</Form.Field>
          <Form.Field
            control={Radio}
            label="root"
            value="root"
            checked={nodeScale === "root"}
            onChange={handleNodeScaleChange}
          />
          <Form.Field
            control={Radio}
            label="linear"
            value="linear"
            checked={nodeScale === "linear"}
            onChange={handleNodeScaleChange}
          />
        </Form.Group>

        <Form.Group>
          <Form.Field>Link width scale as</Form.Field>
          <Form.Field
            control={Radio}
            label='root'
            value='root'
            checked={linkScale === "root"}
            onChange={handleLinkScaleChange}
          />
          <Form.Field
            control={Radio}
            label='linear'
            value='linear'
            checked={linkScale === "linear"}
            onChange={handleLinkScaleChange}
          />
        </Form.Group>

        <Form.Group>
          <Checkbox
            toggle
            onChange={handleLabelsVisibleChange}
            checked={labelsVisible}
            label="Show labels"
          />
        </Form.Group>
        <Form.Group>
          <Checkbox
            toggle
            onChange={handleSimulationEnabledChange}
            checked={simulationEnabled}
            label="Enable simulation"
          />
        </Form.Group>
      </Form>
    </React.Fragment>
  );
};

Settings.propTypes = {
  onNodeSizeChange: PropTypes.func,
  onNodeScaleChange: PropTypes.func,
  onLinkScaleChange: PropTypes.func,
  onLabelsVisibleChange: PropTypes.func,
  onSimulationEnabledChange: PropTypes.func
};

