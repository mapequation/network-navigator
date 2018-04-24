import React from 'react'
import { Header, Modal, Icon, Menu } from 'semantic-ui-react'

const Help = () => {
    const menuItem = (
        <Menu.Item>
            <Icon name='help' />
            Help
        </Menu.Item>
    );

    return (
    <Modal trigger={menuItem}>
        <Modal.Header>Help</Modal.Header>
        <Modal.Content>
            <Modal.Description>
                <Header>Default Profile Image</Header>
                <p>We've found the following gravatar image associated with your e-mail address.</p>
                <p>Is it okay to use this photo?</p>
            </Modal.Description>
        </Modal.Content>
    </Modal>
    )
};

export default Help