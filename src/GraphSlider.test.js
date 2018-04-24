import React from 'react';
import ReactDOM from 'react-dom';
import GraphSlider from './GraphSlider';

it('renders without crashing', () => {
  const div = document.createElement('div');
  ReactDOM.render(<GraphSlider />, div);
  ReactDOM.unmountComponentAtNode(div);
});
