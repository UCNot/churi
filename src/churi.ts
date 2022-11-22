export class Churi {

  readonly #url: URL;
  #schema?: string;

  constructor(uri: string) {
    const url = new URL(uri);

    this.#url = url;
  }

  get protocol(): string {
    return this.#url.protocol;
  }

  get schema(): string {
    return (this.#schema ??= this.protocol.slice(0, -1));
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
    return this.#url.pathname;
  }

  get search(): string {
    return this.#url.search;
  }

  get hash(): string {
    return this.#url.hash;
  }

  get href(): string {
    return this.#url.href;
  }

  toURL(): URL {
    return new URL(this.#url.href);
  }

  toString(): string {
    return this.href;
  }

}
