import React from "react";
import Documentation from "./Documentation";
import Header from "./Header";
import LoadNetwork from "./LoadNetwork";


export default function StartPage(props) {
  return <React.Fragment>
    <Header/>
    <LoadNetwork {...props}/>
    <Documentation/>
  </React.Fragment>;
}
