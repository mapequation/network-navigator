import React, { useContext } from "react";
import { Checkbox, Input } from "semantic-ui-react";
import Dispatch from "../context/Dispatch";

const MyCheckbox = (props) => (
  <Checkbox
    style={{ display: "block", margin: "0.3em 0 0.3em 0" }}
    {...props}
  />
);

const SliderCheckbox = (props) => <MyCheckbox slider {...props} />;

export default function Settings(props) {
  const {
    nodeSize,
    nodeScale,
    linkScale,
    labelsVisible,
    simulationEnabled,
    lodEnabled,
    nodeLimit,
  } = props;
  const { dispatch } = useContext(Dispatch);

  return (
    <React.Fragment>
      <SliderCheckbox
        label={`Module size based on: ${nodeSize}`}
        checked={nodeSize === "flow"}
        onChange={(e, { checked }) =>
          dispatch({ type: "nodeSize", value: checked ? "flow" : "nodes" })
        }
      />
      <SliderCheckbox
        label={`Module radius scale: ${nodeScale}`}
        checked={nodeScale === "root"}
        onChange={(e, { checked }) =>
          dispatch({ type: "nodeScale", value: checked ? "root" : "linear" })
        }
      />
      <SliderCheckbox
        label={`Link width scale: ${linkScale}`}
        checked={linkScale === "root"}
        onChange={(e, { checked }) =>
          dispatch({ type: "linkScale", value: checked ? "root" : "linear" })
        }
      />
      <MyCheckbox
        label="Show labels"
        checked={labelsVisible}
        onChange={(e, { checked }) =>
          dispatch({ type: "labelsVisible", value: checked })
        }
      />
      <MyCheckbox
        label="Run simulation"
        checked={simulationEnabled}
        onChange={(e, { checked }) =>
          dispatch({ type: "simulationEnabled", value: checked })
        }
      />
      <MyCheckbox
        label="Use level of detail"
        checked={lodEnabled}
        onChange={(e, { checked }) =>
          dispatch({ type: "lodEnabled", value: checked })
        }
      />
      <Input
        label={{ basic: true, content: "Node limit in modules" }}
        type="number"
        size="small"
        value={nodeLimit}
        fluid
        onChange={(e) => {
          dispatch({ type: "nodeLimit", value: parseInt(e.target.value) });
        }}
      />
    </React.Fragment>
  );
}
