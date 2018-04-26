import React from 'react'
import { Header, Modal, Icon, Menu } from 'semantic-ui-react'

const Help = () => {
    const menuItem = (
        <Menu.Item>
            <Icon name='help' />Help
        </Menu.Item>
    );

    return (
        <Modal trigger={menuItem}>
            <Modal.Header>Help</Modal.Header>
            <Modal.Content>
                <Modal.Description>
                    <Header>Work in progress!</Header>
                </Modal.Description>
            </Modal.Content>
        </Modal>
    )
};

export default Help
