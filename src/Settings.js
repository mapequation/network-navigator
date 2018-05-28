import React from 'react';
import PropTypes from 'prop-types';
import { Form, Radio } from 'semantic-ui-react';
import MyAccordion from './helpers/MyAccordion';

export default class Settings extends React.Component {
    state = {
        size: 'flow',
    };

    static propTypes = {
        onSizeChange: PropTypes.func,
    };

    static defaultProps = {
        onSizeChange: () => null,
    };

    handleSizeChange = (e, { value }) => {
        this.setState({ size: value });
        this.props.onSizeChange(value);
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
                </Form>
            </MyAccordion>
        );
    }
};
