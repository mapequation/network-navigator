import PropTypes from "prop-types";
import React, { useState } from "react";
import { Search as SearchInput } from "semantic-ui-react";
import { byFlow } from "../lib/filter";


export default function Search(props) {
  const [results, setResults] = useState([]);

  const handleChange = (e, { value }) => {
    const results = props.onChange(value);
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
    onSearchChange={handleChange}
    results={results}
  />;
}

Search.propTypes = {
  onChange: PropTypes.func,
  maxResults: PropTypes.number
};

Search.defaultProps = {
  onChange: () => [],
  maxResults: 15
};
