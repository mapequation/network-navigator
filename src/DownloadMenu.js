import React from 'react';
import { Menu, Icon } from 'semantic-ui-react';
import MyAccordion from './helpers/MyAccordion';

const DownloadMenu = () => (
    <MyAccordion title='Download'>
        <Menu.Menu>
            <Menu.Item as={'a'}>
                <Icon name='image' />Download SVG
            </Menu.Item>
            <Menu.Item as={'a'}>
                <Icon name='file outline' />Download data
            </Menu.Item>
        </Menu.Menu>
    </MyAccordion>
);

export default DownloadMenu;
