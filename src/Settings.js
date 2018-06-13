import React from 'react';
import PropTypes from 'prop-types';
import { Form, Radio, Checkbox } from 'semantic-ui-react';
import MyAccordion from './helpers/MyAccordion';

export default class Settings extends React.Component {
    state = {
        size: 'flow',
        labelsVisible: true,
    };

    static propTypes = {
        onSizeChange: PropTypes.func,
        onLabelsVisibleChange: PropTypes.func,
    };

    static defaultProps = {
        onSizeChange: () => null,
        onLabelsVisibleChange: () => null,
    };

    handleSizeChange = (e, { value }) => {
        this.setState({ size: value },
            () => this.props.onSizeChange(value));
    };

    handleLabelsVisibleChange = (e, { checked }) => {
        this.setState({ labelsVisible: checked },
            () => this.props.onLabelsVisibleChange(checked));
    };

    render() {
        return (
            <MyAccordion title='Settings'>
                <Form>
                    <Form.Group inline>
                        <label>Size based on</label>
                        <Form.Field
                            control={Radio}
                            label='flow'
                            value='flow'
                            checked={this.state.size === 'flow'}
                            onChange={this.handleSizeChange}
                        />
                        <Form.Field
                            control={Radio}
                            label='nodes'
                            value='nodes'
                            checked={this.state.size === 'nodes'}
                            onChange={this.handleSizeChange}
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
