import * as Sentry from "@sentry/browser";
import React from "react";
import { hydrate, render } from "react-dom";
import App from "./components/App";
import "./index.css";
import { unregister } from "./registerServiceWorker";


Sentry.init({
  dsn: "https://a095cdb615de4acfaa7fce76eb9c60da@sentry.io/1763309",
  beforeSend(event) {
    // Check if it is an exception, and if so, show the report dialog
    if (event.exception) {
      Sentry.showReportDialog({ eventId: event.event_id });
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

unregister();
