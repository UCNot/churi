export class Churi {

  readonly #url: URL;
  #schema?: string;
  readonly #hasAuthority: boolean;
  readonly #pathname: string;
  #href?: string;

  constructor(uri: string) {
    const url = new URL(uri);
    const { protocol, href } = url;
    const hostPrefix = protocol + '//';

    if (href.startsWith(hostPrefix)) {
      this.#url = url;
      this.#pathname = url.pathname;
      this.#hasAuthority = true;
    } else {
      this.#hasAuthority = false;

      const rest = href.slice(protocol.length);

      if (!rest) {
        this.#url = new URL(hostPrefix);
        this.#pathname = this.#url.pathname;
      } else if (rest.startsWith('/')) {
        this.#url = new URL(hostPrefix + rest);
        this.#pathname = this.#url.pathname;
      } else {
        this.#url = new URL(hostPrefix + '/' + rest);
        this.#pathname = this.#url.pathname.slice(1); // Remove extra slash if present
      }
    }
  }

  get protocol(): string {
    return this.#url.protocol;
  }

  get schema(): string {
    return (this.#schema ??= this.protocol.slice(0, -1));
  }

  get hasAuthority(): boolean {
    return this.#hasAuthority;
  }

  get username(): string {
    return this.#url.username;
  }

  get password(): string {
    return this.#url.password;
  }

  get host(): string {
    return this.#url.host;
  }

  get hostname(): string {
    return this.#url.hostname;
  }

  get port(): string {
    return this.#url.port;
  }

  get origin(): string {
    return this.#url.origin;
  }

  get pathname(): string {
    return this.#pathname;
  }

  get search(): string {
    return this.#url.search;
  }

  get hash(): string {
    return this.#url.hash;
  }

  get href(): string {
    if (this.#href != null) {
      return this.#href;
    }
    if (this.hasAuthority) {
      return (this.#href = this.#url.href);
    }

    return (this.#href = this.protocol + this.pathname + this.search + this.hash);
  }

  toURL(): URL {
    return new URL(this.#url.href);
  }

  toString(): string {
    return this.href;
  }

}
