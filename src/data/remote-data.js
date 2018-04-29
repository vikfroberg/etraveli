import daggy from "daggy";

const RemoteData = daggy.taggedSum("RemoteData", {
  Loading: [],
  Success: ["data"],
  Failure: ["data"],
});

RemoteData.prototype.map = function(fn) {
  return this.cata({
    Loading: () => this,
    Success: data => RemoteData.Success(fn(data)),
    Failure: () => this,
  });
};

export default RemoteData;
