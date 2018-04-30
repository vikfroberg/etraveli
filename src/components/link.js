import React from "react";
import qs from "query-string";
import { Link as RouterLink } from "react-router-dom";

const Context = React.createContext({});

export function Provider({ children }) {
  return (
    <Context.Provider value={qs.parseUrl(window.location.hash.substring(1))}>
      {children}
    </Context.Provider>
  );
}

export function Link({ to, children }) {
  return (
    <Context.Consumer>
      {location => {
        return (
          <RouterLink
            to={{
              search: qs.stringify({ ...location.query, ...to.query }),
              pathname: to.pathname,
            }}
          >
            {children}
          </RouterLink>
        );
      }}
    </Context.Consumer>
  );
}
