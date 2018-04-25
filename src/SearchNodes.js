import React, { Component } from 'react';
import { Search } from 'semantic-ui-react';
import { byFlow } from './lib/filter';

export default class SearchNodes extends Component {
    state = {
        isLoading: false,
        results: [],
    }

    handleSearchChange = (e, { value }) => {
        this.setState({ isLoading: true });
        const results = this.props.searchFunction(value);
        this.setState({
            results: results.sort(byFlow).slice(0, +this.props.maxResults || 10).map(n => ({
                title: n.name,
                price: n.path.toString(),
            })),
            isLoading: false,
        });
    }

    render() {
        const { results, isLoading } = this.state;

        return (
            <Search
                fluid
                input={{ fluid: true }}
                placeholder='Search nodes...'
                onSearchChange={this.handleSearchChange}
                results={results}
                loading={isLoading} />
        );
    }
}
