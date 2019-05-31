import React, { useState } from "react";
import Sidebar from "./Sidebar";
import StartPage from "./StartPage";


export default function App() {
    const initialState = {
        network: null,
        filename: "",
    };

    const [state, setState] = useState(initialState);

    if (!state.network) {
        return <StartPage onFileLoaded={setState}/>;
    }

    return <Sidebar {...state}/>;
}
