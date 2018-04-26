import React from 'react';
import { Segment, Button, Divider, Icon, Progress } from 'semantic-ui-react';

const FileDialog = (props) => {
    let fileInput = null;

    return (
        <div>
            <Segment padded='very' style={{ marginTop: '200px', width: '500px' }}>
                <label className='ui fluid primary button' htmlFor='fileUpload'>
                    <Icon name='upload' />Load data...
                </label>
                <input style={{ display: 'none' }}
                    type='file'
                    id='fileUpload'
                    onChange={() => props.onLoadData(fileInput.files[0])}
                    ref={input => fileInput = input} />
                <Divider horizontal>or</Divider>
                <Button fluid secondary onClick={props.onExampleClick}>Load citation data</Button>
            </Segment>
            {props.progressVisible &&
                <Segment padded='very' style={{ width: '500px' }} basic>
                    <Progress
                        align='left'
                        indicating
                        label={props.progressLabel}
                        total={3}
                        value={props.progressValue} />
                </Segment>
            }
        </div>
    );
}

export default FileDialog;
