import React from 'react';
import PropTypes from 'prop-types';
import { Menu, Icon } from 'semantic-ui-react';
import FileSaver from 'file-saver';
import ftreeFromNetwork from './lib/file-formats/ftree-from-network';

export default class Export extends React.Component {
    static propTypes = {
        filename: PropTypes.string.isRequired,
        network: PropTypes.object.isRequired,
    };

    exportFtree = () => {
        const ftree = ftreeFromNetwork(this.props.network);
        const blob = new Blob([ftree], { type: 'text/plain;charset=utf-8' });
        FileSaver.saveAs(blob, this.props.filename);
    }

    render() {
        return (
            <Menu.Item as={'a'} onClick={this.exportFtree}>
                <Icon name='file outline' />Export network
            </Menu.Item>
        )
    }
}
