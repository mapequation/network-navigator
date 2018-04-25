import React from 'react';
import './Range.css';

const clamp = ({ value, min, max }) => Math.max(min, Math.min(max, value));

const Range = (props) => (
    <input
        style={{marginLeft: '20px', width: props.width }}
        type="range"
        min={props.min}
        max={props.max}
        value={clamp(props)}
        onChange={event => props.onChange(+event.target.value)} />
);

export default Range;
