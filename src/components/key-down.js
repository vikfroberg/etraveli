import React from "react";

export const ESCAPE_KEY = 27;

export default class KeyDown extends React.Component {
  componentDidMount() {
    document.addEventListener("keydown", this.handleKeyDown, true);
  }
  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown, true);
  }
  handleKeyDown = e => {
    if (this.props.keyCode === e.keyCode) {
      this.props.onKeyDown();
    }
  };
  render() {
    return null;
  }
}
