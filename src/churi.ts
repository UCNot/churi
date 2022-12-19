import { createURIChargeParser } from './charge/parse-uri-charge.js';
import { UcPrimitive } from './charge/uc-value.js';
import { URIChargeParser } from './charge/uri-charge-parser.js';
import { URICharge } from './charge/uri-charge.js';
import { UcRoute } from './uc-route.js';
import { UcSearchParams } from './uc-search-params.js';

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
 * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
 * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
 */
export class ChURI<out TValue = UcPrimitive, out TCharge = URICharge<TValue>> {

  readonly #url: URL;
  readonly #chargeParser: URIChargeParser<TValue, TCharge>;
  #scheme?: string;
  #route?: UcRoute<TValue, TCharge>;
  #searchParams?: UcSearchParams<TValue, TCharge>;

  /**
   * Constructs charged URI.
   *
   * @param uri - Absolute URI string conforming to [RFC3986](https://www.rfc-editor.org/rfc/rfc3986).
   * @param chargeParser - Parser to use to parse charges.
   */
  constructor(
    uri: string,
    ...chargeParser: UcPrimitive extends TValue
      ? URICharge<TValue> extends TCharge
        ? [URIChargeParser<TValue, TCharge>?]
        : [URIChargeParser<TValue, TCharge>]
      : [URIChargeParser<TValue, TCharge>]
  );

  constructor(
    uri: string,
    chargeParser: URIChargeParser<TValue, TCharge> = createURIChargeParser() as URIChargeParser<
      TValue,
      TCharge
    >,
  ) {
    const url = new URL(uri);

    this.#url = url;
    this.#chargeParser = chargeParser;
  }

  /**
   * Parser used to parse charges.
   */
  get chargeParser(): URIChargeParser<TValue, TCharge> {
    return this.#chargeParser;
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
   * The returned {@link UcRoute} instance refers the first fragment of the path.
   */
  get route(): UcRoute<TValue, TCharge> {
    return (this.#route ??= new UcRoute(this.pathname, this.chargeParser));
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
  get searchParams(): UcSearchParams<TValue, TCharge> {
    return (this.#searchParams ??= new UcSearchParams(this.search, this.chargeParser));
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
