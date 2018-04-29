import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import MoviesPage from "./pages/movies";
import registerServiceWorker from "./registerServiceWorker";
import { Provider as StyletronProvider } from "styletron-react";
import { Client as Styletron } from "styletron-engine-atomic";

const engine = new Styletron();

ReactDOM.render(
  <StyletronProvider value={engine}>
    <MoviesPage />
  </StyletronProvider>,
  document.getElementById("root"),
);
registerServiceWorker();
