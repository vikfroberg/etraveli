import "./index.css";
import React from "react";
import ReactDOM from "react-dom";
import registerServiceWorker from "./registerServiceWorker";
import MoviesPage from "./pages/movies";
import { Provider as StyletronProvider } from "styletron-react";
import { Client as Styletron } from "styletron-engine-atomic";
import { HashRouter, Route } from "react-router-dom";

const engine = new Styletron();

ReactDOM.render(
  <StyletronProvider value={engine}>
    <HashRouter>
      <Route path="/:id?" component={MoviesPage} />
    </HashRouter>
  </StyletronProvider>,
  document.getElementById("root"),
);
registerServiceWorker();
