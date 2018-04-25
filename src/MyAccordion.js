import React, { Component } from 'react';
import { Menu, Accordion, Icon } from 'semantic-ui-react';

export default class MyAccordion extends Component {
    state = {
        visible: false,
    }

    toggleVisibility = () => this.setState({ visible: !this.state.visible });

    render() {
        return (
            <Menu.Item as={Accordion}>
                <Accordion.Title active={this.state.visible} onClick={this.toggleVisibility}>
                    <Icon name='dropdown' />{this.props.title}
                </Accordion.Title>
                <Accordion.Content active={this.state.visible}>
                    {this.props.children}
                </Accordion.Content>
            </Menu.Item>
        );
    }
}
