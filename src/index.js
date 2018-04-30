import React from "react";
import ReactDOM from "react-dom";
import { Provider as StyletronProvider } from "styletron-react";
import { Client as Styletron } from "styletron-engine-atomic";
import { HashRouter, Route } from "react-router-dom";
import registerServiceWorker from "./registerServiceWorker";
import MoviesPage from "./pages/movies";
import { Provider as LinkProvider } from "./components/link";
import "./index.css";

const engine = new Styletron();

ReactDOM.render(
  <StyletronProvider value={engine}>
    <HashRouter>
      <LinkProvider>
        <Route path="/:id?" component={MoviesPage} />
      </LinkProvider>
    </HashRouter>
  </StyletronProvider>,
  document.getElementById("root"),
);
registerServiceWorker();
