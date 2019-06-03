import React, { useState } from "react";
import Documentation from "./Documentation";
import Header from "./Header";
import LoadNetwork from "./LoadNetwork";
import Sidebar from "./Sidebar";


export default function App() {
  const initialState = {
    network: null,
    filename: ""
  };

  const [state, setState] = useState(initialState);

  if (!state.network) {
    return <React.Fragment>
      <Header/>
      <LoadNetwork onFileLoaded={setState}/>
      <Documentation/>
    </React.Fragment>;
  }

  return <Sidebar {...state}/>;
}
