import { styled } from "styletron-react";

export const Block = styled("div", props => ({
  ...props.$css,
  display: "block",
}));

export const FlexColumn = styled("div", props => ({
  ...props.$css,
  display: "flex",
  flexDirection: "column",
}));

export const FlexRow = styled("div", props => ({
  ...props.$css,
  display: "flex",
  flexDirection: "row",
}));

export const InlineBlock = styled("div", props => ({
  ...props.$css,
  display: "inline-block",
}));

export const Input = styled("input", props => ({
  ...props.$css,
}));
