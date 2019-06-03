import PropTypes from "prop-types";
import React from "react";
import { Checkbox, Form, Radio } from "semantic-ui-react";


export default class Settings extends React.Component {
  state = {
    nodeSize: "flow",
    nodeSizeScale: "root",
    linkWidthScale: "root",
    labelsVisible: true,
    simulationEnabled: true
  };

  static propTypes = {
    onNodeSizeChange: PropTypes.func,
    onNodeSizeScaleChange: PropTypes.func,
    onLinkWidthScaleChange: PropTypes.func,
    onLabelsVisibleChange: PropTypes.func,
    onSimulationEnabledChange: PropTypes.func
  };

  handleNodeSizeChange = (e, { value }) =>
    this.setState({ nodeSize: value },
      () => this.props.onNodeSizeChange(value));

  handleNodeSizeScaleChange = (e, { value }) =>
    this.setState({ nodeSizeScale: value },
      () => this.props.onNodeSizeScaleChange(value));

  handleLinkWidthScaleChange = (e, { value }) =>
    this.setState({ linkWidthScale: value },
      () => this.props.onLinkWidthScaleChange(value));

  handleLabelsVisibleChange = (e, { checked }) =>
    this.setState({ labelsVisible: checked },
      () => this.props.onLabelsVisibleChange(checked));

  handleSimulationEnabledChange = (e, { checked }) =>
    this.setState({ simulationEnabled: checked },
      () => this.props.onSimulationEnabledChange(checked));

  render() {
    const {
      nodeSize,
      nodeSizeScale,
      linkWidthScale,
      labelsVisible,
      simulationEnabled
    } = this.state;

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
              onChange={this.handleNodeSizeChange}
            />
            <Form.Field
              control={Radio}
              label='nodes'
              value='nodes'
              checked={nodeSize === "nodes"}
              onChange={this.handleNodeSizeChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Field>Module radius scale as</Form.Field>
            <Form.Field
              control={Radio}
              label="root"
              value="root"
              checked={nodeSizeScale === "root"}
              onChange={this.handleNodeSizeScaleChange}
            />
            <Form.Field
              control={Radio}
              label="linear"
              value="linear"
              checked={nodeSizeScale === "linear"}
              onChange={this.handleNodeSizeScaleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Field>Link width scale as</Form.Field>
            <Form.Field
              control={Radio}
              label='root'
              value='root'
              checked={linkWidthScale === "root"}
              onChange={this.handleLinkWidthScaleChange}
            />
            <Form.Field
              control={Radio}
              label='linear'
              value='linear'
              checked={linkWidthScale === "linear"}
              onChange={this.handleLinkWidthScaleChange}
            />
          </Form.Group>

          <Form.Group>
            <Checkbox
              toggle
              onChange={this.handleLabelsVisibleChange}
              checked={labelsVisible}
              label="Show labels"
            />
          </Form.Group>
          <Form.Group>
            <Checkbox
              toggle
              onChange={this.handleSimulationEnabledChange}
              checked={simulationEnabled}
              label="Enable simulation"
            />
          </Form.Group>
        </Form>
      </React.Fragment>
    );
  }
};
