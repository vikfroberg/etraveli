import React, { Component } from "react";
import request from "axios";
import daggy from "daggy";
import { styled } from "styletron-react";

// Router server side
// Better loading handling

const Block = styled("div", props => ({
  ...props.css,
  display: "block",
}));

const Flex = styled("div", props => ({
  ...props.css,
  display: "flex",
}));

const InlineBlock = styled("div", props => ({
  ...props.css,
  display: "inline-block",
}));

const Input = styled("input", props => ({
  ...props.css,
}));

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
      <Flex css={{ flexDirection: "column", height: "100%" }}>
        <Flex
          css={{
            padding: "15px",
            backgroundColor: "#f7f8fa",
            borderBottomColor: "#d5dfe6",
            borderBottomWidth: "1px",
            borderBottomStyle: "solid",
            flexDirection: "row",
          }}
        >
          <Block css={{ flexShrink: 0 }}>
            <KeyDown
              keyCode={ESCAPE_KEY}
              onKeyDown={() => this.setState(closeDropdown)}
            />
            <ClickOutside onClickOutside={() => this.setState(closeDropdown)}>
              <Block
                css={{
                  fontSize: "15px",
                  color: "#43596f",
                  borderColor: "#d8dce1",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderRadius: "5px",
                  padding: "10px",
                  marginRight: "15px",
                  cursor: "pointer",
                  backgroundColor: this.state.dropdown ? "#e7edf7" : "#f7f7f8",
                }}
                onClick={() => this.setState(toggleDropdown)}
              >
                Sort by...
              </Block>
              <div style={{ position: "relative" }}>
                <div
                  style={{
                    backgroundColor: "#fff",
                    position: "absolute",
                    left: 0,
                    top: "10px",
                    borderRadius: "5px",
                    boxShadow: "0 0 6px rgba(0, 0, 0, .4)",
                    minWidth: "240px",
                    minHeight: "250px",
                    display: this.state.dropdown ? "block" : "none",
                  }}
                >
                  <Block
                    css={{
                      borderBottomColor: "#e3e7eb",
                      borderBottomWidth: "1px",
                      borderBottomStyle: "solid",
                    }}
                  >
                    <InlineBlock
                      css={{
                        padding: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      Sort by
                    </InlineBlock>
                    <InlineBlock
                      css={{
                        padding: "10px",
                        float: "right",
                        cursor: "pointer",
                      }}
                      onClick={() => this.setState(closeDropdown)}
                    >
                      x
                    </InlineBlock>
                  </Block>
                  <Block>
                    <Block
                      css={{
                        borderBottomColor: "#f1f2f4",
                        borderBottomWidth: "1px",
                        borderBottomStyle: "solid",
                        paddingLeft: "30px",
                        paddingTop: "10px",
                        paddingBottom: "10px",
                        cursor: "pointer",
                        backgroundColor:
                          this.state.sortBy === Sort.None ? "#f8f8f9" : "#fff",
                      }}
                      onClick={() => this.setState(sortByChanged(Sort.None))}
                    >
                      None
                    </Block>
                    <Block
                      css={{
                        borderBottomColor: "#f1f2f4",
                        borderBottomWidth: "1px",
                        borderBottomStyle: "solid",
                        paddingLeft: "30px",
                        paddingTop: "10px",
                        paddingBottom: "10px",
                        cursor: "pointer",
                        backgroundColor:
                          this.state.sortBy === Sort.Episode
                            ? "#f8f8f9"
                            : "#fff",
                      }}
                      onClick={() => this.setState(sortByChanged(Sort.Episode))}
                    >
                      Episode
                    </Block>
                    <Block
                      css={{
                        borderBottomColor: "#f1f2f4",
                        borderBottomWidth: "1px",
                        borderBottomStyle: "solid",
                        paddingLeft: "30px",
                        paddingTop: "10px",
                        paddingBottom: "10px",
                        cursor: "pointer",
                        backgroundColor:
                          this.state.sortBy === Sort.Year ? "#f8f8f9" : "#fff",
                      }}
                      onClick={() => this.setState(sortByChanged(Sort.Year))}
                    >
                      Year
                    </Block>
                  </Block>
                </div>
              </div>
            </ClickOutside>
          </Block>
          <Block css={{ flexGrow: 1 }}>
            <Input
              css={{
                borderColor: "#d8dce1",
                borderWidth: "1px",
                borderStyle: "solid",
                borderRadius: "5px",
                color: "#43596f",
                fontSize: "15px",
                padding: "10px",
                width: "100%",
                display: "block",
              }}
              type="text"
              value={this.state.searchInput}
              onChange={e => this.setState(searchInputChanged(e.target.value))}
              placeholder="Type to search..."
            />
          </Block>
        </Flex>
        <Flex css={{ flex: 1 }}>
          <Block css={{ flex: 1 }}>
            {this.state.remoteFilms.cata({
              NotAsked: () => "Loading",
              Loading: () => "Loading",
              Success: data => {
                const filteredFilms = data
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
                  );
                if (filteredFilms.length > 0) {
                  return filteredFilms.map(film => (
                    <Block
                      css={{
                        ":hover": { backgroundColor: "#f8f8f9" },
                        borderBottomColor: "#ebecf0",
                        borderBottomWidth: "1px",
                        borderBottomStyle: "solid",
                        padding: "20px",
                        cursor: "pointer",
                        backgroundColor: this.state.selectedFilm.cata({
                          Just: selectedFilm =>
                            film.id === selectedFilm.id ? "#f8f8f9" : "#fff",
                          Nothing: () => "#fff",
                        }),
                      }}
                      key={film.id}
                      onClick={() => this.setState(selectFilm(film))}
                    >
                      <InlineBlock
                        css={{
                          marginRight: "25px",
                          textTransform: "uppercase",
                        }}
                      >
                        Episode {film.episode}
                      </InlineBlock>
                      <InlineBlock css={{ fontWeight: "bold" }}>
                        {film.title}
                      </InlineBlock>
                      <InlineBlock css={{ float: "right" }}>
                        {film.releaseDate}
                      </InlineBlock>
                    </Block>
                  ));
                } else {
                  return (
                    <Block css={{ padding: "20px" }}>
                      No movies with that title
                    </Block>
                  );
                }
              },
              Failure: () => "Something went wrong!",
            })}
          </Block>
          <Block
            css={{
              flex: 1,
              borderLeftColor: "#f1f2f4",
              borderLeftWidth: "1px",
              borderLeftStyle: "solid",
            }}
          >
            <Block
              css={{
                padding: "20px",
              }}
            >
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
            </Block>
          </Block>
        </Flex>
      </Flex>
    );
  }
}

export default App;
