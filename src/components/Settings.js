import React, { useContext } from "react";
import { Checkbox, Form, Radio } from "semantic-ui-react";
import Dispatch from "../context/Dispatch";


export default function Settings(props) {
  const {
    nodeSize,
    nodeScale,
    linkScale,
    labelsVisible,
    simulationEnabled
  } = props;
  const dispatch = useContext(Dispatch);

  return (
    <Form>
      <Form.Group>
        <Form.Field>Module size based on</Form.Field>
        <Form.Field
          control={Radio}
          label='flow'
          value='flow'
          checked={nodeSize === "flow"}
          onChange={(e, { value }) => dispatch({ type: "nodeSize", value })}
        />
        <Form.Field
          control={Radio}
          label='nodes'
          value='nodes'
          checked={nodeSize === "nodes"}
          onChange={(e, { value }) => dispatch({ type: "nodeSize", value })}
        />
      </Form.Group>

      <Form.Group>
        <Form.Field>Module radius scale as</Form.Field>
        <Form.Field
          control={Radio}
          label="root"
          value="root"
          checked={nodeScale === "root"}
          onChange={(e, { value }) => dispatch({ type: "nodeScale", value })}
        />
        <Form.Field
          control={Radio}
          label="linear"
          value="linear"
          checked={nodeScale === "linear"}
          onChange={(e, { value }) => dispatch({ type: "nodeScale", value })}
        />
      </Form.Group>

      <Form.Group>
        <Form.Field>Link width scale as</Form.Field>
        <Form.Field
          control={Radio}
          label='root'
          value='root'
          checked={linkScale === "root"}
          onChange={(e, { value }) => dispatch({ type: "linkScale", value })}
        />
        <Form.Field
          control={Radio}
          label='linear'
          value='linear'
          checked={linkScale === "linear"}
          onChange={(e, { value }) => dispatch({ type: "linkScale", value })}
        />
      </Form.Group>

      <Form.Group>
        <Checkbox
          toggle
          onChange={(e, { checked }) => dispatch({ type: "labelsVisible", value: checked })}
          checked={labelsVisible}
          label="Show labels"
        />
      </Form.Group>
      <Form.Group>
        <Checkbox
          toggle
          onChange={(e, { checked }) => dispatch({ type: "simulationEnabled", value: checked })}
          checked={simulationEnabled}
          label="Enable simulation"
        />
      </Form.Group>
    </Form>
  );
};
