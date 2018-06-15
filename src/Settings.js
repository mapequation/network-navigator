import React from 'react';
import PropTypes from 'prop-types';
import { Form, Radio, Checkbox } from 'semantic-ui-react';
import MyAccordion from './helpers/MyAccordion';

export default class Settings extends React.Component {
    state = {
        nodeSize: 'flow',
        nodeSizeScale: 'root',
        labelsVisible: true,
    };

    static propTypes = {
        onNodeSizeChange: PropTypes.func,
        onNodeSizeScaleChange: PropTypes.func,
        onLabelsVisibleChange: PropTypes.func,
    };

    static defaultProps = {
        onNodeSizeChange: () => null,
        onNodeSizeScaleChange: () => null,
        onLabelsVisibleChange: () => null,
    };

    handleNodeSizeChange = (e, { value }) => {
        this.setState({ nodeSize: value },
            () => this.props.onNodeSizeChange(value));
    };


    handleNodeSizeScaleChange = (e, { value }) => {
        this.setState({ nodeSizeScale: value },
            () => this.props.onNodeSizeScaleChange(value));
    }

    handleLabelsVisibleChange = (e, { checked }) => {
        this.setState({ labelsVisible: checked },
            () => this.props.onLabelsVisibleChange(checked));
    };

    render() {
        return (
            <MyAccordion title='Settings'>
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
                        <label>Node size scale</label>
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
                        <label>Show labels</label>
                        <Checkbox toggle checked={this.state.labelsVisible} onChange={this.handleLabelsVisibleChange} />
                    </Form.Group>
                </Form>
            </MyAccordion>
        );
    }
};
