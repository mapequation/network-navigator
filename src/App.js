import React, { Component } from 'react';
import TwoColumnLayout from './TwoColumnLayout';
import Header from './Header';

export default class App extends Component {
    render() {
        return (
            <div className="App">
                <Header />
                <TwoColumnLayout />
            </div>
        );
    }
}
