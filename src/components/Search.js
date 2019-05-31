import PropTypes from "prop-types";
import React, { Component } from "react";
import { Search as SearchInput } from "semantic-ui-react";
import { byFlow } from "../lib/filter";


export default class Search extends Component {
    state = {
        results: [],
    };

    static propTypes = {
        searchFunction: PropTypes.func,
        maxResults: PropTypes.number,
    };

    static defaultProps = {
        searchFunction: () => [],
        maxResults: 15,
    };

    handleSearchChange = (e, { value }) => {
        const results = this.props.searchFunction(value);
        this.setState({
            results: results.sort(byFlow).slice(0, this.props.maxResults).map((n, i) => ({
                title: n.name,
                price: n.path.toString(),
                key: i,
            })),
        });
    };

    render() {
        const { results } = this.state;

        return <SearchInput
            fluid
            input={{ fluid: true }}
            placeholder='Find nodes...'
            onSearchChange={this.handleSearchChange}
            results={results}
        />;
    }
}
