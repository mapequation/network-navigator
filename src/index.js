import React from "react";
import { render, hydrate } from "react-dom";
import "./index.css";
import { unregister } from "./registerServiceWorker";
import App from "./App";


const rootElement = document.getElementById("root");
if (rootElement.hasChildNodes()) {
    hydrate(<App/>, rootElement);
} else {
    render(<App/>, rootElement);
}

unregister();
