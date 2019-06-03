import PropTypes from "prop-types";
import React, { useState } from "react";
import { Search as SearchInput } from "semantic-ui-react";
import { byFlow } from "../lib/filter";


export default function Search(props) {
  const [results, setResults] = useState([]);

  const handleSearchChange = (e, { value }) => {
    const results = props.onSearchChange(value);
    setResults(results
      .sort(byFlow)
      .slice(0, props.maxResults)
      .map((node, i) => ({
        title: node.name,
        price: node.path.toString(),
        key: i
      })));
  };

  return <SearchInput
    fluid
    input={{ fluid: true }}
    placeholder='Find nodes...'
    onSearchChange={handleSearchChange}
    results={results}
  />;
}

Search.propTypes = {
  onSearchChange: PropTypes.func,
  maxResults: PropTypes.number
};

Search.defaultProps = {
  onSearchChange: () => [],
  maxResults: 15
};
