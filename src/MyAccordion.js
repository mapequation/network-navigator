import React, { Component } from 'react';
import { Menu, Accordion, Icon, Popup } from 'semantic-ui-react';

export default class MyAccordion extends Component {
    state = {
        visible: false,
    }

    componentDidMount() {
        if (this.props.visible) {
            this.setState({ visible: this.props.visible });
        }
    }

    toggleVisibility = () => this.setState({ visible: !this.state.visible });

    render() {
        const accordionTitle = (
            <Accordion.Title active={this.state.visible} onClick={this.toggleVisibility}>
                <Icon name='dropdown' />{this.props.title}
            </Accordion.Title>);

        const title = this.props.popup
            ? <Popup trigger={accordionTitle} content={this.props.popup} size='tiny' />
            : accordionTitle;

        return (
            <Menu.Item as={Accordion}>
                {title}
                <Accordion.Content active={this.state.visible}>
                    {this.props.children}
                </Accordion.Content>
            </Menu.Item>
        );
    }
}
