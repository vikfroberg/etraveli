import React, { Fragment, Component } from "react";
import request from "axios";
import Maybe from "../data/maybe";
import RemoteData from "../data/remote-data";
import daggy from "daggy";
import * as R from "ramda";
import KeyDown, { ESCAPE_KEY } from "../components/key-down";
import ClickOutside from "../components/click-outside";
import {
  FlexColumn,
  FlexRow,
  Block,
  InlineBlock,
  Input,
} from "../components/ui";

// TODO
// - router server side
// - release date use new date

// DATA

const Sort = daggy.taggedSum("Sort", {
  None: [],
  Episode: [],
  Year: [],
});

Sort.prototype.compare = function(a, b) {
  return this.cata({
    None: () => 0,
    Episode: () => a.episode - b.episode,
    Year: () => {
      const aDate = new Date(a.releaseDate);
      const bDate = new Date(b.releaseDate);
      return bDate > aDate ? -1 : bDate < aDate ? 1 : 0;
    },
  });
};

// UPDATERS

const getMoviesSuccess = res => state => ({
  ...state,
  remoteMovies: RemoteData.Success(decodeMovies(res.data)),
});

const getMoviesFailure = err => state => ({
  ...state,
  remoteMovies: RemoteData.Failure(err),
});

const selectMovie = movie => state => ({
  ...state,
  selectedMovie: Maybe.Just(movie),
});

const searchInputChanged = searchInput => state => ({
  ...state,
  selectedMovie: Maybe.Nothing,
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
  ...state,
  sortBy,
});

// COMPONENT

class MoviesPage extends Component {
  state = {
    remoteMovies: RemoteData.Loading,
    selectedMovie: Maybe.Nothing,
    searchInput: "",
    dropdown: false,
    sortBy: Sort.None,
  };
  componentDidMount() {
    request
      .get("https://star-wars-api.herokuapp.com/films")
      .then(res => this.setState(getMoviesSuccess(res)))
      .catch(err => this.setState(getMoviesFailure(err)));
  }
  render() {
    return (
      <FlexColumn $css={{ height: "100%" }}>
        <Header>
          <Dropdown
            open={this.state.dropdown}
            sortBy={this.state.sortBy}
            onToggle={() => this.setState(toggleDropdown)}
            onDissmiss={() => this.setState(closeDropdown)}
            onSortByChanged={sort => this.setState(sortByChanged(sort))}
          />
          <SearchInput
            value={this.state.searchInput}
            onChange={e => this.setState(searchInputChanged(e.target.value))}
          />
        </Header>
        <Content
          left={
            <MovieListView
              remoteMovies={this.state.remoteMovies}
              sortBy={this.state.sortBy}
              searchInput={this.state.searchInput}
              selectedMovie={this.state.selectedMovie}
              onClickMovie={movie => this.setState(selectMovie(movie))}
            />
          }
          right={<MovieDetailView selectedMovie={this.state.selectedMovie} />}
        />
      </FlexColumn>
    );
  }
}

// LIST VIEW

function MovieListView({
  selectedMovie,
  remoteMovies,
  sortBy,
  searchInput,
  onClickMovie,
}) {
  const sortMovies = R.sort((a, b) => sortBy.compare(a, b));
  const filterMoviesBySearch = R.filter(searchTitle(searchInput));

  const remoteFilteredMovies = remoteMovies
    .map(sortMovies)
    .map(filterMoviesBySearch);

  return (
    <Block>
      {remoteFilteredMovies.cata({
        Loading: () => <MovieListLoading />,
        Success: movies => {
          if (movies.length > 0) {
            return movies.map(movie => (
              <MovieListItem
                key={movie.id}
                movie={movie}
                selectedMovie={selectedMovie}
                onClickMovie={onClickMovie}
              />
            ));
          } else {
            return <MovieListEmpty />;
          }
        },
        Failure: () => <MovieListFailure />,
      })}
    </Block>
  );
}

function MovieListEmpty() {
  return <Block $css={{ padding: "20px" }}>No movies with that title</Block>;
}

function MovieListLoading() {
  return <Block $css={{ padding: "20px" }}>Loading...</Block>;
}

function MovieListFailure() {
  return <Block $css={{ padding: "20px" }}>Failed to load movies</Block>;
}

function MovieListItem({ selectedMovie, onClickMovie, movie }) {
  return (
    <Block
      $css={{
        ":hover": { backgroundColor: "#f8f8f9" },
        borderBottomColor: "#ebecf0",
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        padding: "20px",
        cursor: "pointer",
        backgroundColor: selectedMovie.cata({
          Just: ({ id }) => (movie.id === id ? "#f8f8f9" : "#fff"),
          Nothing: () => "#fff",
        }),
      }}
      key={movie.id}
      onClick={() => onClickMovie(movie)}
    >
      <InlineBlock
        $css={{
          marginRight: "25px",
          textTransform: "uppercase",
        }}
      >
        Episode {movie.episode}
      </InlineBlock>
      <InlineBlock $css={{ fontWeight: "bold" }}>{movie.title}</InlineBlock>
      <InlineBlock $css={{ float: "right" }}>{movie.releaseDate}</InlineBlock>
    </Block>
  );
}

// DETAIL VIEW

function MovieDetailView({ selectedMovie }) {
  return (
    <Block>
      {selectedMovie.cata({
        Nothing: () => (
          <Block
            $css={{
              padding: "20px",
              fontWeight: "bold",
            }}
          >
            No movie selected
          </Block>
        ),
        Just: movie => (
          <Block
            $css={{
              padding: "20px",
            }}
          >
            <h1>{movie.title}</h1>
            <p>{movie.openingCrawl}</p>
            <p>Directed by: {movie.director}</p>
          </Block>
        ),
      })}
    </Block>
  );
}

// CONTENT

function Content({ left, right }) {
  return (
    <FlexRow $css={{ flex: 1 }}>
      <Block $css={{ flex: 1 }}>{left}</Block>
      <Block
        $css={{
          flex: 1,
          borderLeftColor: "#f1f2f4",
          borderLeftWidth: "1px",
          borderLeftStyle: "solid",
        }}
      >
        {right}
      </Block>
    </FlexRow>
  );
}

// HEADER

function Header({ children }) {
  return (
    <FlexRow
      $css={{
        padding: "15px",
        backgroundColor: "#f7f8fa",
        borderBottomColor: "#d5dfe6",
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
      }}
    >
      {children}
    </FlexRow>
  );
}

// DROPDOWN

function Dropdown({ onDissmiss, onToggle, open, onSortByChanged, sortBy }) {
  return (
    <Fragment>
      <KeyDown keyCode={ESCAPE_KEY} onKeyDown={onDissmiss} />
      <ClickOutside onClickOutside={onDissmiss}>
        <DropdownButton open={open} onClick={onToggle}>
          Sort by...
        </DropdownButton>
        <DropdownContent open={open}>
          <DropdownContentHeader onDissmiss={onDissmiss}>
            Sort by
          </DropdownContentHeader>
          <Block>
            <DropdownContentItem
              active={sortBy === Sort.None}
              onClick={() => onSortByChanged(Sort.None)}
            >
              None
            </DropdownContentItem>
            <DropdownContentItem
              active={sortBy === Sort.Episode}
              onClick={() => onSortByChanged(Sort.Episode)}
            >
              Episode
            </DropdownContentItem>
            <DropdownContentItem
              active={sortBy === Sort.Year}
              onClick={() => onSortByChanged(Sort.Year)}
            >
              Year
            </DropdownContentItem>
          </Block>
        </DropdownContent>
      </ClickOutside>
    </Fragment>
  );
}

function DropdownButton({ onClick, open, children }) {
  return (
    <Block
      $css={{
        fontSize: "15px",
        color: "#43596f",
        borderColor: "#d8dce1",
        borderWidth: "1px",
        borderStyle: "solid",
        borderRadius: "5px",
        padding: "10px",
        marginRight: "15px",
        cursor: "pointer",
        backgroundColor: open ? "#e7edf7" : "#f7f7f8",
      }}
      onClick={onClick}
    >
      {children}
    </Block>
  );
}

function DropdownContent({ open, children }) {
  return open ? (
    <Block $css={{ position: "relative" }}>
      <Block
        $css={{
          backgroundColor: "#fff",
          position: "absolute",
          top: "10px",
          left: 0,
          borderRadius: "5px",
          boxShadow: "0 0 6px rgba(0, 0, 0, .4)",
          minWidth: "240px",
          minHeight: "250px",
        }}
      >
        {children}
      </Block>
    </Block>
  ) : null;
}

function DropdownContentHeader({ children, onDissmiss }) {
  return (
    <Block
      $css={{
        borderBottomColor: "#e3e7eb",
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
      }}
    >
      <InlineBlock
        $css={{
          padding: "10px",
          fontWeight: "bold",
        }}
      >
        {children}
      </InlineBlock>
      <InlineBlock
        onClick={onDissmiss}
        $css={{
          padding: "10px",
          float: "right",
          cursor: "pointer",
        }}
      >
        x
      </InlineBlock>
    </Block>
  );
}

function DropdownContentItem({ active, children, onClick }) {
  return (
    <Block
      $css={{
        borderBottomColor: "#f1f2f4",
        borderBottomWidth: "1px",
        borderBottomStyle: "solid",
        paddingLeft: "30px",
        paddingTop: "10px",
        paddingBottom: "10px",
        cursor: "pointer",
        backgroundColor: active ? "#f8f8f9" : "#fff",
      }}
      onClick={onClick}
    >
      {children}
    </Block>
  );
}

// SEARCH

function SearchInput({ onChange, value }) {
  return (
    <Block $css={{ flexGrow: 1 }}>
      <Input
        $css={{
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
        value={value}
        onChange={onChange}
        placeholder="Type to search..."
      />
    </Block>
  );
}

// HELPERS

const searchTitle = input => movie =>
  movie.title.toLowerCase().indexOf(input.toLowerCase()) !== -1;

function decodeMovies(data) {
  return data.map(movie => ({
    id: movie.id,
    title: movie.fields.title,
    episode: movie.fields.episode_id,
    releaseDate: movie.fields.release_date,
    openingCrawl: movie.fields.opening_crawl,
    director: movie.fields.director,
  }));
}
export default MoviesPage;
