import { URICharge } from '../schema/uri-charge/uri-charge.js';
import { ChURIQuery } from './churi-params.js';
import { ChURIRoute } from './churi-route.js';

/**
 * Charged URI.
 *
 * Represents [URI] conforming to [RFC3986]. Resembles standard [URL class] in its read-only part.
 *
 * Supports [Matrix URI] format by representing {@link ChURI#pathname path} as {@link ChURI#route route}.
 *
 * Allows to parse {@link URICharge URI charge} attached to various parts of the URI.
 *
 * Parses the data on demand, so it does not affect performance when not needed.
 *
 * [Matrix URI]: https://www.w3.org/DesignIssues/MatrixURIs.html
 * [RFC3986]: https://www.rfc-editor.org/rfc/rfc3986
 * [URI]: https://ru.wikipedia.org/wiki/URI
 * [URL class]:https://developer.mozilla.org/en-US/docs/Web/API/URL
 *
 * @typeParam TRoute - Route representation type. {@link ChURIRoute} by default.
 * @typeParam TQuery - URI query representation type. {@link ChURIQuery} by default.
 */
export class ChURI<out TRoute = ChURIRoute, out TQuery = ChURIQuery> {

  readonly #url: URL;
  #scheme?: string;
  readonly #Route: new (path: string) => TRoute;
  readonly #Query: new (query: string) => TQuery;
  #route?: TRoute;
  #query?: TQuery;

  /**
   * Constructs charged URI.
   *
   * @param uri - Absolute URI string conforming to [RFC3986](https://www.rfc-editor.org/rfc/rfc3986).
   * @param options - Charged URI options.
   */
  constructor(
    uri: string,
    ...options: ChURIRoute extends TRoute
      ? ChURIQuery extends TQuery
        ? [ChURI.Options?]
        : [ChURI.Options<TRoute, TQuery>]
      : [ChURI.Options<TRoute, TQuery>]
  );

  constructor(
    uri: string,
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Route = ChURIRoute as new (path: string) => TRoute,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Query: Search = ChURIQuery as new (search: string) => TQuery,
    }: Partial<ChURI.CustomRouteOptions<TRoute> & ChURI.CustomSearchOptions<TQuery>> = {},
  ) {
    const url = new URL(uri);

    this.#url = url;
    this.#Route = Route;
    this.#Query = Search;
  }

  /**
   * String representing the protocol scheme of the URI, including the final `:`.
   */
  get protocol(): string {
    return this.#url.protocol;
  }

  /**
   * String containing URI scheme without trailing `:`.
   *
   * See [RFC3986, Section 3.1](https://www.rfc-editor.org/rfc/rfc3986#section-3.1)
   */
  get scheme(): string {
    return (this.#scheme ??= this.protocol.slice(0, -1));
  }

  /**
   * String containing the username specified before the domain name.
   *
   * See [RFC3986, Section 3.2.1](https://www.rfc-editor.org/rfc/rfc3986#section-3.2.1).
   */
  get username(): string {
    return this.#url.username;
  }

  /**
   * String containing the password specified before the domain name.
   *
   * See [RFC3986, Section 3.2.1](https://www.rfc-editor.org/rfc/rfc3986#section-3.2.1).
   */
  get password(): string {
    return this.#url.password;
  }

  /**
   * String containing the host, that is the hostname, and then, if the port of the URI is nonempty, a ":"",
   * followed by the port of the URL.
   */
  get host(): string {
    return this.#url.host;
  }

  /**
   * String containing the domain name of the URI.
   *
   * See [RFC3986, Section 3.2.2](https://www.rfc-editor.org/rfc/rfc3986#section-3.2.2)
   */
  get hostname(): string {
    return this.#url.hostname;
  }

  /**
   * String containing the port number of the URI.
   *
   * See [RFC3986, Section 3.2.3](https://www.rfc-editor.org/rfc/rfc3986#section-3.2.3)
   */
  get port(): string {
    return this.#url.port;
  }

  /**
   * String containing the Unicode serialization of the origin of the represented URI.
   *
   * Depends on the type of URI.
   *
   * See [URL.origin](https://developer.mozilla.org/en-US/docs/Web/API/URL/origin).
   */
  get origin(): string {
    return this.#url.origin;
  }

  /**
   * String containing the path of the URI.
   *
   * See [RFC3986, Section 3.3](https://www.rfc-editor.org/rfc/rfc3986#section-3.3)
   */
  get pathname(): string {
    return this.#url.pathname;
  }

  /**
   * Parsed path representing route.
   *
   * The returned {@link ChURIRoute} instance refers the first fragment of the path.
   */
  get route(): TRoute {
    return (this.#route ??= new this.#Route(this.pathname));
  }

  /**
   * A search string, also called a query string, that is a string containing a "?"" followed by the parameters of
   * the URI.
   *
   * See [RFC3986, Section 3.4](https://www.rfc-editor.org/rfc/rfc3986#section-3.4).
   */
  get search(): string {
    return this.#url.search;
  }

  /**
   * Decoded search parameters of the URI.
   *
   * Resembles [URL.searchParams] in its readonly part.
   *
   * [URL.searchParams]: https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams
   */
  get searchParams(): TQuery {
    return (this.#query ??= new this.#Query(this.search));
  }

  /**
   * Decoded URI query.
   *
   * An alias of {@link searchParams}.
   */
  get query(): TQuery {
    return this.searchParams;
  }

  /**
   * String containing a "#" followed by the fragment identifier of the URI.
   *
   * The fragment is not percent-decoded. If the URI does not have a fragment identifier, this property contains an
   * empty string — "".
   *
   * See [RFC3986, Section 3.5](https://www.rfc-editor.org/rfc/rfc3986#section-3.5).
   */
  get hash(): string {
    return this.#url.hash;
  }

  /**
   * String containing the whole URI.
   *
   * See [URL.href](https://developer.mozilla.org/en-US/docs/Web/API/URL/href)
   */
  get href(): string {
    return this.#url.href;
  }

  /**
   * Converts this URI to URL.
   *
   * @returns New (writable) URL instance.
   */
  toURL(): URL {
    return new URL(this.#url.href);
  }

  /**
   * Builds a string containing the whole URI.
   *
   * @returns {@link href} property value.
   */
  toString(): string {
    return this.href;
  }

  /**
   * Builds a string containing a serialized version of the URI.
   *
   * @returns {@link toString String representation} of URI.
   */
  toJSON(): string {
    return this.toString();
  }

}

export namespace ChURI {
  /**
   * Charged URI construction options.
   *
   * @typeParam TRoute - Route representation type. {@link ChURIRoute} by default.
   * @typeParam TSearch - Search parameters representation type. {@link ChURIQuery} by default.
   */
  export type Options<TRoute = ChURIRoute, TSearch = ChURIQuery> = RouteOptions<TRoute> &
    SearchOptions<TSearch>;

  /**
   * Charged URI construction options specifying its route representation class.
   *
   * @typeParam TRoute - Custom route representation type.
   */
  export type RouteOptions<TRoute> = ChURIRoute extends TRoute
    ? DefaultRouteOptions
    : CustomRouteOptions<TRoute>;

  export interface DefaultRouteOptions {
    /**
     * Constructor of route representation.
     */
    readonly Route?: (new (path: string) => ChURIRoute) | undefined;
  }

  export interface CustomRouteOptions<out TRoute> {
    /**
     * Constructor of route representation.
     */
    readonly Route: new (path: string) => TRoute;
  }

  /**
   * Charged URI construction options specifying its search parameters representation class.
   *
   * @typeParam TRoute - Custom route representation type.
   */
  export type SearchOptions<TSearchParams> = ChURIQuery extends ChURIQuery
    ? DefaultSearchOptions
    : CustomSearchOptions<TSearchParams>;

  export interface DefaultSearchOptions {
    /**
     * Constructor of URI query. {@link ChURIQuery by default}.
     */
    readonly Query?: (new (query: string) => ChURIQuery) | undefined;
  }
  export interface CustomSearchOptions<TSearch> {
    /**
     * Constructor of URI query.
     */
    readonly Query: new (query: string) => TSearch;
  }
}
