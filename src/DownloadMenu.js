import React, { Component } from 'react';
import { Accordion, Menu, Icon } from 'semantic-ui-react';

export default class DownloadMenu extends Component {
    state = {
        visible: false,
    }

    toggleVisibility = () => this.setState({ visible: !this.state.visible });

    render() {
        return (
            <Menu.Item as={Accordion}>
                <Accordion.Title active={this.state.visible} onClick={this.toggleVisibility} icon='dropdown' content='Download' />
                <Accordion.Content active={this.state.visible}>
                    <Menu.Menu>
                        <Menu.Item as={'a'}>
                            <Icon name='image' />Download SVG
                        </Menu.Item>
                        <Menu.Item as={'a'}>
                            <Icon name='file outline' />Download data
                        </Menu.Item>
                    </Menu.Menu>
                </Accordion.Content>
            </Menu.Item>
        );
    }
}
