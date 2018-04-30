import React, { Fragment, Component } from "react";
import request from "axios";
import Maybe from "../data/maybe";
import RemoteData from "../data/remote-data";
import daggy from "daggy";
import qs from "query-string";
import * as R from "ramda";
import KeyDown, { ESCAPE_KEY } from "../components/key-down";
import ClickOutside from "../components/click-outside";
import { withRouter, Link } from "react-router-dom";
import {
  FlexColumn,
  FlexRow,
  Block,
  InlineBlock,
  Input,
} from "../components/ui";

// DATA

const Sort = daggy.taggedSum("Sort", {
  None: [],
  Episode: [],
  Year: [],
});

Sort.fromString = function(string) {
  switch (string) {
    case "none":
      return Sort.None;
    case "episode":
      return Sort.Episode;
    case "year":
      return Sort.Year;
    default:
      return Sort.None;
  }
};

Sort.prototype.toString = function() {
  return this.cata({
    None: () => "none",
    Episode: () => "episode",
    Year: () => "year",
  });
};

Sort.prototype.compare = function(a, b) {
  return this.cata({
    None: () => 0,
    Episode: () => a.episode - b.episode,
    Year: () => {
      if (b.releaseDate > a.releaseDate) {
        return -1;
      } else if (b.releaseDate < a.releaseDate) {
        return 1;
      } else {
        return 0;
      }
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

const searchInputChanged = searchInput => state => ({
  ...state,
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
    searchInput: "",
    dropdown: false,
  };

  componentDidMount() {
    request
      .get("https://star-wars-api.herokuapp.com/films")
      .then(res => this.setState(getMoviesSuccess(res)))
      .catch(err => this.setState(getMoviesFailure(err)));
  }

  render() {
    const maybeSelectedId = Maybe.from(this.props.match.params.id).map(id =>
      parseInt(id, 10),
    );

    const query = qs.parse(this.props.location.search);
    const sortBy = Maybe.from(query.sort)
      .map(Sort.fromString)
      .withDefault(Sort.None);

    return (
      <FlexColumn $css={{ height: "100%" }}>
        <Header>
          <Dropdown
            open={this.state.dropdown}
            sortBy={sortBy}
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
              sortBy={sortBy}
              searchInput={this.state.searchInput}
              maybeSelectedId={maybeSelectedId}
            />
          }
          right={
            <MovieDetailView
              remoteMovies={this.state.remoteMovies}
              maybeSelectedId={maybeSelectedId}
            />
          }
        />
      </FlexColumn>
    );
  }
}

// LIST VIEW

function MovieListView({ maybeSelectedId, remoteMovies, sortBy, searchInput }) {
  const sortMovies = R.sort((a, b) => sortBy.compare(a, b));
  const filterMoviesBySearch = R.filter(matchTitleLike(searchInput));

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
                maybeSelectedId={maybeSelectedId}
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

function MovieListItem({ maybeSelectedId, movie }) {
  return (
    <WithRouter>
      {({ location }) => (
        <Link to={{ pathname: `/${movie.id}`, search: location.search }}>
          <Block
            key={movie.id}
            $css={{
              backgroundColor: maybeSelectedId.cata({
                Just: id => (movie.id === id ? "#f8f8f9" : "#fff"),
                Nothing: () => "#fff",
              }),
              borderBottomColor: "#ebecf0",
              borderBottomWidth: "1px",
              borderBottomStyle: "solid",
              padding: "20px",
              cursor: "pointer",
              ":hover": { backgroundColor: "#f8f8f9" },
            }}
          >
            <InlineBlock
              $css={{
                marginRight: "25px",
                textTransform: "uppercase",
              }}
            >
              Episode {movie.episode}
            </InlineBlock>
            <InlineBlock $css={{ fontWeight: "bold" }}>
              {movie.title}
            </InlineBlock>
            <InlineBlock $css={{ float: "right" }}>
              {dateToString(movie.releaseDate)}
            </InlineBlock>
          </Block>
        </Link>
      )}
    </WithRouter>
  );
}

// DETAIL VIEW

function MovieDetailView({ remoteMovies, maybeSelectedId }) {
  return (
    <Block>
      {remoteMovies.cata({
        Loading: () => <MovieDetailLoading />,
        Success: movies =>
          maybeSelectedId.cata({
            Just: id => (
              <MovieDetailSuccess
                maybeMovie={maybeFind(m => m.id === id, movies)}
              />
            ),
            Nothing: () => <MovieDetailNotSelected />,
          }),
        Failure: () => <MovieDetailFailure />,
      })}
    </Block>
  );
}

function MovieDetailSuccess({ maybeMovie }) {
  return maybeMovie.cata({
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
    Nothing: () => (
      <Block $css={{ padding: "20px" }}>
        Could not find a movie with that id
      </Block>
    ),
  });
}

function MovieDetailNotSelected() {
  return <Block $css={{ padding: "20px" }}>No movie selected</Block>;
}

function MovieDetailFailure() {
  return <Block $css={{ padding: "20px" }}>Failed to load movie</Block>;
}

function MovieDetailLoading() {
  return <Block $css={{ padding: "20px" }}>Loading...</Block>;
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
              param={Sort.None.toString()}
            >
              None
            </DropdownContentItem>
            <DropdownContentItem
              active={sortBy === Sort.Episode}
              param={Sort.Episode.toString()}
            >
              Episode
            </DropdownContentItem>
            <DropdownContentItem
              active={sortBy === Sort.Year}
              param={Sort.Year.toString()}
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

function DropdownContentItem({ active, children, param }) {
  return (
    <Link to={{ search: qs.stringify({ sort: param }) }}>
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
          ":hover": {
            backgroundColor: "#f8f8f9",
          },
        }}
      >
        {children}
      </Block>
    </Link>
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

const WithRouter = withRouter(({ children, location, match, history }) => {
  return children({ location, match, history });
});

const maybeFind = R.curry((cb, xs) => {
  return Maybe.from(xs.find(cb));
});

function dateToString(dateObj) {
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, "0");
  const date = dateObj.getDate();
  return `${year}-${month}-${date}`;
}

const matchTitleLike = input => movie =>
  movie.title.toLowerCase().indexOf(input.toLowerCase()) !== -1;

function decodeMovies(data) {
  return data.map(movie => ({
    id: movie.id,
    title: movie.fields.title,
    episode: movie.fields.episode_id,
    releaseDate: new Date(movie.fields.release_date),
    openingCrawl: movie.fields.opening_crawl,
    director: movie.fields.director,
  }));
}
export default MoviesPage;
