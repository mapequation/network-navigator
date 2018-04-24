import React from 'react';
import './Range.css';

export default function Range(props) {
    return (
        <input
            style={{marginLeft: '20px', width: '295px'}}
            type="range"
            min={props.min}
            max={props.max}
            value={Math.max(props.min, Math.min(props.max, props.value))}
            onChange={event => props.onChange(+event.target.value)} />
    );
}
