import React, { Component } from "react";
import request from "axios";
import daggy from "daggy";

Array.prototype.sortBy = function(...args) {
  return [...this].sort(...args);
};

class KeyDown extends React.Component {
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

class ClickOutside extends Component {
  isTouch = false;
  componentDidMount() {
    document.addEventListener("touchend", this.handle, true);
    document.addEventListener("click", this.handle, true);
  }
  componentWillUnmount() {
    document.removeEventListener("touchend", this.handle, true);
    document.removeEventListener("click", this.handle, true);
  }
  getContainer = ref => {
    this.container = ref;
  };
  handle = e => {
    if (e.type === "touchend") this.isTouch = true;
    if (e.type === "click" && this.isTouch) return;
    const { onClickOutside } = this.props;
    const el = this.container;
    if (!el.contains(e.target)) onClickOutside(e);
  };
  render() {
    const { children, onClickOutside, ...props } = this.props;
    return (
      <div {...props} ref={this.getContainer}>
        {children}
      </div>
    );
  }
}

const trace = x => {
  console.log(x);
  return x;
};

const traceTable = x => {
  console.table(x);
  return x;
};

const decodeFilms = data =>
  traceTable(
    trace(data).map(film => ({
      id: film.id,
      title: film.fields.title,
      episode: film.fields.episode_id,
      // This should be Date so that we can sort
      releaseDate: film.fields.release_date,
      // I'm assuming that it shouldn't care about the line breaks.
      openingCrawl: film.fields.opening_crawl,
      director: film.fields.director,
    })),
  );

const RemoteData = daggy.taggedSum("RemoteData", {
  NotAsked: [],
  Loading: [],
  Success: ["data"],
  Failure: ["data"],
});

const Maybe = daggy.taggedSum("Maybe", {
  Nothing: [],
  Just: ["data"],
});

const Sort = daggy.taggedSum("Sort", {
  None: [],
  Episode: [],
  Year: [],
});

const getFilmsLoading = state => ({
  ...state,
  remoteFilms: RemoteData.Loading,
});

const getFilmsSuccess = res => state => ({
  ...state,
  remoteFilms: RemoteData.Success(decodeFilms(res.data)),
});

const getFilmsFailure = err => state => ({
  ...state,
  remoteFilms: RemoteData.Failure(err),
});

const selectFilm = film => state => ({
  ...state,
  selectedFilm: Maybe.Just(film),
});

const searchInputChanged = searchInput => state => ({
  ...state,
  selectedFilm: Maybe.Nothing,
  searchInput,
});

const toggleDropdown = state => ({
  ...state,
  dropdown: !state.dropdown,
});

const closeDropdown = state => ({
  ...state,
  dropdown: false,
});

const sortByChanged = sortBy => state => ({
  sortBy,
});

const Block = props => <div {...props} style={{ display: "block" }} />;

const InlineBlock = props => (
  <div {...props} style={{ display: "inline-block" }} />
);

class App extends Component {
  state = {
    remoteFilms: RemoteData.NotAsked,
    selectedFilm: Maybe.Nothing,
    searchInput: "",
    dropdown: false,
    sortBy: Sort.None,
  };
  componentDidMount() {
    this.setState(getFilmsLoading);
    request
      .get("https://star-wars-api.herokuapp.com/films")
      .then(res => this.setState(getFilmsSuccess(res)))
      .catch(err => this.setState(getFilmsFailure(err)));
  }
  render() {
    const ESCAPE_KEY = 27;
    return (
      <Block>
        <Block>
          <InlineBlock>
            <KeyDown
              keyCode={ESCAPE_KEY}
              onKeyDown={() => this.setState(closeDropdown)}
            />
            <ClickOutside onClickOutside={() => this.setState(closeDropdown)}>
              <button onClick={() => this.setState(toggleDropdown)}>
                Sort by
              </button>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    background: "#fff",
                    padding: 10,
                    position: "absolute",
                    left: 0,
                    top: 0,
                    minWidth: 200,
                    display: this.state.dropdown ? "block" : "none",
                  }}
                >
                  <Block>
                    <InlineBlock>Sort by</InlineBlock>
                    <InlineBlock onClick={() => this.setState(closeDropdown)}>
                      x
                    </InlineBlock>
                  </Block>
                  <Block>
                    <Block
                      onClick={() => this.setState(sortByChanged(Sort.Episode))}
                    >
                      Episode
                    </Block>
                    <Block
                      onClick={() => this.setState(sortByChanged(Sort.Year))}
                    >
                      Year
                    </Block>
                  </Block>
                </div>
              </div>
            </ClickOutside>
          </InlineBlock>
          <InlineBlock>
            <input
              type="text"
              value={this.state.searchInput}
              onChange={e => this.setState(searchInputChanged(e.target.value))}
              placeholder="Type to search..."
            />
          </InlineBlock>
        </Block>
        <InlineBlock>
          {this.state.remoteFilms.cata({
            NotAsked: () => "Loading",
            Loading: () => "Loading",
            Success: data =>
              data
                .sortBy((a, b) =>
                  this.state.sortBy.cata({
                    None: () => 0,
                    Episode: () => a.episode - b.episode,
                    Year: () => {
                      const aDate = new Date(a.releaseDate);
                      const bDate = new Date(b.releaseDate);
                      return bDate > aDate ? -1 : bDate < aDate ? 1 : 0;
                    },
                  }),
                )
                .filter(
                  film =>
                    film.title
                      .toLowerCase()
                      .indexOf(this.state.searchInput.toLowerCase()) !== -1,
                )
                .map(film => (
                  <Block
                    key={film.id}
                    onClick={() => this.setState(selectFilm(film))}
                  >
                    <InlineBlock>Episode {film.episode}</InlineBlock>
                    <InlineBlock>{film.title}</InlineBlock>
                    <InlineBlock>{film.releaseDate}</InlineBlock>
                  </Block>
                )),
            Failure: () => "Something went wrong!",
          })}
        </InlineBlock>
        <InlineBlock>
          {this.state.selectedFilm.cata({
            Nothing: () => "No movie selected",
            Just: film => (
              <Block>
                <h1>{film.title}</h1>
                <p>{film.openingCrawl}</p>
                <p>Directed by: {film.director}</p>
              </Block>
            ),
          })}
        </InlineBlock>
      </Block>
    );
  }
}

export default App;
