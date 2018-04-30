import daggy from "daggy";

const Maybe = daggy.taggedSum("Maybe", {
  Just: ["data"],
  Nothing: [],
});

Maybe.from = data => (data != null ? Maybe.Just(data) : Maybe.Nothing);

Maybe.prototype.map = function(f) {
  return this.cata({
    Nothing: () => this,
    Just: x => Maybe.Just(f(x)),
  });
};

Maybe.prototype.withDefault = function(b) {
  return this.cata({
    Nothing: () => b,
    Just: x => x,
  });
};

export default Maybe;
