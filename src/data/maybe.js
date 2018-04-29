import daggy from "daggy";

const Maybe = daggy.taggedSum("Maybe", {
  Nothing: [],
  Just: ["data"],
});

export default Maybe;
