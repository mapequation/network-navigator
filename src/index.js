import "core-js";
import * as Sentry from "@sentry/browser";
import React from "react";
import { hydrate, render } from "react-dom";
import App from "./components/App";
import "./index.css";


const dsn = process.env.NODE_ENV === "production" ? "https://a095cdb615de4acfaa7fce76eb9c60da@sentry.io/1763309" : "";

Sentry.init({
  dsn,
  beforeSend(event) {
    // Check if it is an exception, and if so, show the report dialog
    if (event.exception) {
      Sentry.showReportDialog({
        eventId: event.event_id,
        subtitle2: "If you'd like to help, tell us what happened below. Your network data stay on your computer."
      });
    }
    return event;
  }
});

const rootElement = document.getElementById("root");
if (rootElement.hasChildNodes()) {
  hydrate(<App/>, rootElement);
} else {
  render(<App/>, rootElement);
}
