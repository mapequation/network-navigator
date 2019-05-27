import React from 'react';
import PropTypes from 'prop-types';
import { Form, Radio, Checkbox } from 'semantic-ui-react';
import MenuItemAccordion from './MenuItemAccordion';

export default class Settings extends React.Component {
    state = {
        nodeSize: 'flow',
        nodeSizeScale: 'root',
        linkWidthScale: 'root',
        labelsVisible: true,
        simulationEnabled: true,
    };

    static propTypes = {
        onNodeSizeChange: PropTypes.func,
        onNodeSizeScaleChange: PropTypes.func,
        onLinkWidthScaleChange: PropTypes.func,
        onLabelsVisibleChange: PropTypes.func,
        onSimulationEnabledChange: PropTypes.func,
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
        return (
            <MenuItemAccordion title='Settings'>
                <Form>
                    <Form.Group inline>
                        <label>Node size based on</label>
                        <Form.Field
                            control={Radio}
                            label='flow'
                            value='flow'
                            checked={this.state.nodeSize === 'flow'}
                            onChange={this.handleNodeSizeChange}
                        />
                        <Form.Field
                            control={Radio}
                            label='nodes'
                            value='nodes'
                            checked={this.state.nodeSize === 'nodes'}
                            onChange={this.handleNodeSizeChange}
                        />
                    </Form.Group>

                    <Form.Group inline>
                        <label>Node radius scale</label>
                        <Form.Field
                            control={Radio}
                            label='root'
                            value='root'
                            checked={this.state.nodeSizeScale === 'root'}
                            onChange={this.handleNodeSizeScaleChange}
                        />
                        <Form.Field
                            control={Radio}
                            label='linear'
                            value='linear'
                            checked={this.state.nodeSizeScale === 'linear'}
                            onChange={this.handleNodeSizeScaleChange}
                        />
                    </Form.Group>

                    <Form.Group inline>
                        <label>Link width scale</label>
                        <Form.Field
                            control={Radio}
                            label='root'
                            value='root'
                            checked={this.state.linkWidthScale === 'root'}
                            onChange={this.handleLinkWidthScaleChange}
                        />
                        <Form.Field
                            control={Radio}
                            label='linear'
                            value='linear'
                            checked={this.state.linkWidthScale === 'linear'}
                            onChange={this.handleLinkWidthScaleChange}
                        />
                    </Form.Group>

                    <Form.Group inline>
                        <label>Show labels</label>
                        <Checkbox toggle checked={this.state.labelsVisible} onChange={this.handleLabelsVisibleChange} />
                    </Form.Group>

                    <Form.Group inline>
                        <label>Run simulation</label>
                        <Checkbox toggle checked={this.state.simulationEnabled} onChange={this.handleSimulationEnabledChange} />
                    </Form.Group>

                </Form>
            </MenuItemAccordion>
        );
    }
};
