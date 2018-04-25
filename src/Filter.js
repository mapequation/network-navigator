import React, { Component } from 'react';
import { Checkbox, Menu } from 'semantic-ui-react';
import MyAccordion from './MyAccordion';

class Filter extends Component {
    render() {
        return (
            <MyAccordion title='Filter'>
                <Menu.Menu>
                    <Menu.Item>
                        <Checkbox label='Show disconnected nodes' />
                    </Menu.Item>
                </Menu.Menu>
            </MyAccordion>
        );
    }
}

export default Filter;
