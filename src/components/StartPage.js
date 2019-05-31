import React from "react";
import Header from "./Header";
import Documentation from "./Documentation";
import LoadNetwork from "./LoadNetwork";


export default function StartPage(props) {
    return <React.Fragment>
        <Header/>
        <LoadNetwork {...props}/>
        <Documentation/>
    </React.Fragment>;
}
