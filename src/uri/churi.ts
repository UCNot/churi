import { URICharge } from '../schema/uri-charge/uri-charge.js';
import { ChURIAnchor, ChURIAuth, ChURIQuery } from './churi-params.js';
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
 * @typeParam TAnchor - URI anchor representation type. {@link ChURIAnchor} by default.
 * @typeParam TAuth - Authentication info representation type. {@link ChURIAuth} by default.
 */
export class ChURI<
  out TRoute = ChURIRoute,
  out TQuery = ChURIQuery,
  out TAnchor = ChURIAnchor,
  out TAuth = ChURIAuth,
> {

  readonly #prefix: string;
  readonly #protocol: string;
  readonly #scheme: string;
  readonly #url: URL;

  readonly #rawUser: string;
  readonly #Auth: new (query: string) => TAuth;
  #auth?: TAuth;

  readonly #Route: ChURI.CustomRouteOptions<TRoute>['Route'];
  #route?: TRoute;

  readonly #Query: new (query: string) => TQuery;
  #query?: TQuery;

  readonly #Anchor: new (query: string) => TAnchor;
  #anchor?: TAnchor;

  #override?: ChURI$Override;

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
        ? ChURIAnchor extends TAnchor
          ? ChURIAuth extends TAuth
            ? [ChURI.Options?]
            : [ChURI.Options<TRoute, TQuery, TAnchor>]
          : [ChURI.Options<TRoute, TQuery, TAnchor>]
        : [ChURI.Options<TRoute, TQuery, TAnchor>]
      : [ChURI.Options<TRoute, TQuery, TAnchor>]
  );

  /**
   * Constructs charged URI.
   *
   * @param uri - Absolute URI string conforming to [RFC3986](https://www.rfc-editor.org/rfc/rfc3986).
   * @param options - Charged URI options.
   */
  constructor(uri: string, options: ChURI.Options<TRoute, TQuery, TAnchor>);

  constructor(
    uri: string,
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Route = ChURIRoute,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Query = ChURIQuery,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Anchor = ChURIAnchor,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Auth = ChURIAuth,
    }: Partial<ChURI.Options<TRoute>> = {},
  ) {
    const result = URI_PREFIX_PATTERN.exec(uri);

    if (!result) {
      throw new SyntaxError('Invalid URI');
    }

    const hProto = result[1]; // Hierarchical protocol
    const lastColon = hProto.lastIndexOf(':', hProto.length - 2);

    if (lastColon < 0) {
      // Use the last sub-scheme for the URL.
      this.#url = new URL(uri);
      this.#prefix = '';
      this.#protocol = this.#url.protocol;
    } else {
      this.#url = new URL(uri.slice(lastColon + 1));
      this.#prefix = uri.slice(0, lastColon + 1).toLowerCase();
      this.#protocol = hProto.toLowerCase();
    }

    this.#scheme = this.#protocol.slice(0, -1); // Without trailing colon.
    this.#rawUser = result[2] ?? '';

    this.#Route = Route as new (path: string) => TRoute;
    this.#Query = Query as new (search: string) => TQuery;
    this.#Anchor = Anchor as new (search: string) => TAnchor;
    this.#Auth = Auth as new (search: string) => TAuth;
  }

  /**
   * String representing _hierarchical_ protocol scheme of the URI, including the final `:`.
   *
   * In contrast to [URL.protocol], hierarchical protocol includes all protocols preceding host or path.
   * I.e. for URIs like`blob:http://example.com` it returns `blob:http:` rather just `blob:`.
   *
   * [URL.protocol]: https://developer.mozilla.org/en-US/docs/Web/API/URL/protocol
   */
  get protocol(): string {
    return this.#protocol;
  }

  /**
   * String containing _hierarchical_ URI scheme without trailing `:`.
   *
   * hierarchical scheme includes all schemae preceding host or path.
   * I.e. for URIs like`blob:http://example.com` it returns `blob:http` rather just `blob`.
   *
   * See [RFC3986, Section 3.1](https://www.rfc-editor.org/rfc/rfc3986#section-3.1)
   */
  get scheme(): string {
    return this.#scheme;
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
   * Authentication info contained within {@link username}.
   */
  get auth(): TAuth {
    return (this.#auth ??= new this.#Auth(this.#rawUser));
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
    return (this.#route ??= new this.#Route(this.pathname, {
      override: this.#getOverride().pathname,
    }));
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
   * This is an alias of {@link query} property.
   *
   * [URL.searchParams]: https://developer.mozilla.org/en-US/docs/Web/API/URL/searchParams
   */
  get searchParams(): TQuery {
    return this.query;
  }

  /**
   * Decoded URI query. The same as {@link searchParams}.
   */
  get query(): TQuery {
    return (this.#query ??= new this.#Query(this.#getOverride().search));
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
   * URI anchor
   */
  get anchor(): TAnchor {
    return (this.#anchor ??= new this.#Anchor(this.hash));
  }

  /**
   * String containing the whole URI.
   *
   * See [URL.href](https://developer.mozilla.org/en-US/docs/Web/API/URL/href)
   */
  get href(): string {
    return this.#prefix + this.#url.href;
  }

  /**
   * Converts this URI to URL.
   *
   * @returns New (writable) URL instance.
   */
  toURL(): URL {
    return new URL(this.href);
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

  #getOverride(): ChURI$Override {
    if (this.#override) {
      return this.#override;
    }

    const { search } = this;

    if (!search.startsWith('?/')) {
      // No override
      return (this.#override = { search });
    }

    // Extract
    const queryStart = search.indexOf('?', 2);

    if (queryStart < 0) {
      return (this.#override = {
        search: '',
        pathname: search,
      });
    }

    return (this.#override = {
      search: search.slice(queryStart + 1),
      pathname: search.slice(1, queryStart),
    });
  }

}

export namespace ChURI {
  /**
   * Charged URI construction options.
   *
   * @typeParam TRoute - Route representation type. {@link ChURIRoute} by default.
   * @typeParam TQuery - URI query representation type. {@link ChURIQuery} by default.
   * @typeParam TAnchor - URI anchor representation type. {@link ChURIAnchor} by default.
   * @typeParam TAuth - Authentication info representation type. {@link ChURIAuth} by default.
   */
  export type Options<
    TRoute = ChURIRoute,
    TQuery = ChURIQuery,
    TAnchor = ChURIAnchor,
    TAuth = ChURIAuth,
  > = RouteOptions<TRoute> & QueryOptions<TQuery> & AnchorOptions<TAnchor> & AuthOptions<TAuth>;

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
    readonly Route?:
      | (new (path: string, options?: { readonly override?: string | undefined }) => ChURIRoute)
      | undefined;
  }

  export interface CustomRouteOptions<out TRoute> {
    /**
     * Constructor of route representation.
     */
    readonly Route: new (
      path: string,
      options?: { readonly override?: string | undefined },
    ) => TRoute;
  }

  /**
   * Charged URI construction options specifying its query representation class.
   *
   * @typeParam TRoute - Custom query representation type.
   */
  export type QueryOptions<TQuery> = ChURIQuery extends ChURIQuery
    ? DefaultQueryOptions
    : CustomQueryOptions<TQuery>;

  export interface DefaultQueryOptions {
    /**
     * Constructor of URI query. {@link ChURIQuery by default}.
     */
    readonly Query?: (new (query: string) => ChURIQuery) | undefined;
  }

  export interface CustomQueryOptions<TQuery> {
    /**
     * Constructor of URI query.
     */
    readonly Query: new (query: string) => TQuery;
  }

  /**
   * Charged URI construction options specifying its anchor representation class.
   *
   * @typeParam TAnchor - Custom anchor representation type.
   */
  export type AnchorOptions<TAnchor> = ChURIQuery extends ChURIAnchor
    ? DefaultAnchorOptions
    : CustomAnchorOptions<TAnchor>;

  export interface DefaultAnchorOptions {
    /**
     * Constructor of URI anchor. {@link ChURIAnchor by default}.
     */
    readonly Anchor?: (new (query: string) => ChURIAnchor) | undefined;
  }

  export interface CustomAnchorOptions<TAnchor> {
    /**
     * Constructor of URI anchor.
     */
    readonly Anchor: new (query: string) => TAnchor;
  }

  /**
   * Charged URI construction options specifying its anchor representation class.
   *
   * @typeParam TAuth - Custom authentication info representation type.
   */
  export type AuthOptions<TAuth> = ChURIQuery extends ChURIAuth
    ? DefaultAuthOptions
    : CustomAuthOptions<TAuth>;

  export interface DefaultAuthOptions {
    /**
     * Constructor of authentication info. {@link ChURIAuth by default}.
     */
    readonly Auth?: (new (query: string) => ChURIAuth) | undefined;
  }

  export interface CustomAuthOptions<out TAuth> {
    /**
     * Constructor of authentication info.
     */
    readonly Auth: new (query: string) => TAuth;
  }
}

const URI_PREFIX_PATTERN = /^((?:[a-zA-Z][\w+-.]*:)+)(?:\/\/(?:([^@#?:]*):?[^@?#]*@)([^?#]*))?/;

interface ChURI$Override {
  readonly search: string;
  readonly pathname?: string | undefined;
}
