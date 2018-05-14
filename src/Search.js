import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Search as SearchInput } from 'semantic-ui-react';
import { byFlow } from './lib/filter';

export default class Search extends Component {
    state = {
        isLoading: false,
        results: [],
    }

    static propTypes = {
        searchFunction: PropTypes.func.isRequired,
        maxResults: PropTypes.number,
    };

    static defaultProps = {
        searchFunction: () => [],
        maxResults: 15,
    };

    handleSearchChange = (e, { value }) => {
        this.setState({ isLoading: true });
        const results = this.props.searchFunction(value);
        this.setState({
            results: results.sort(byFlow).slice(0, this.props.maxResults).map(n => ({
                title: n.name,
                price: n.path.toString(),
            })),
            isLoading: false,
        });
    }

    render() {
        const { results, isLoading } = this.state;

        return (
            <SearchInput
                fluid
                input={{ fluid: true }}
                placeholder='Search nodes...'
                onSearchChange={this.handleSearchChange}
                results={results}
                loading={isLoading} />
        );
    }
}
