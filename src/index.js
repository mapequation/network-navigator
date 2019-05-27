import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import registerServiceWorker from "./registerServiceWorker";
import TwoColumnLayout from "./TwoColumnLayout";


ReactDOM.render(<TwoColumnLayout/>, document.getElementById("root"));
registerServiceWorker();
