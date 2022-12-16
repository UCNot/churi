/**
 * Route representing parsed URI {@link ChURI#pathname path}.
 *
 * Route consists of fragments separated by `"/" (U+002F)` symbols. Each fragment is represented by its own
 * {@link UcRoute} instance. Other fragments of the path are available by their {@link UcRoute#get indices}.
 */
export class UcRoute {

  #data: UcRoute$Data;
  #index = 0;
  #fragment?: string;
  #path?: string;

  /**
   * Constructs the first fragment of the path.
   *
   * @param path - Full URI path.
   */
  constructor(path: string) {
    this.#data = new UcRoute$Data(path, this);
    this.#index = 0;
  }

  /**
   * Full URI path as it were passed to constructor.
   */
  get fullPath(): string {
    return this.#data.path;
  }

  /**
   * The URI-decoded fragment under {@link index} of the {@link fullPath full path} this instance represents.
   *
   * May contain leading slash for the first fragment if the path starts with `/`.
   *
   * May contain trailing slash for the last fragment if the path ends with `/`.
   */
  get fragment(): string {
    return (this.#fragment ??= decodeURIComponent(this.#data.fragments[this.#index]));
  }

  /**
   * The path starting from this fragment.
   *
   * The path is never URI-decoded.
   */
  get path(): string {
    return (this.#path ??= this.#data.fragments.slice(this.index).join('/'));
  }

  /**
   * Zero-based index of the path fragment this instance represents.
   */
  get index(): number {
    return this.#index;
  }

  /**
   * The length of the route contains the number of fragments.
   */
  get length(): number {
    return this.#data.fragments.length;
  }

  /**
   * Obtains the fragment of the path with the given index.
   *
   * @param index - Index of target fragment relative to {@link index current one}.
   *
   * @returns Either the fragment under the given `index`, or `undefined` if there is no such fragment.
   */
  get(index: number): UcRoute | undefined {
    const { fragments } = this.#data;

    index += this.#index;

    const part = this.#data.findPart(index);

    if (part) {
      return part;
    }
    if (!(index in fragments)) {
      return;
    }

    const newPart = new UcRoute('');

    newPart.#data = this.#data;
    newPart.#index = index;

    this.#data.setPart(index, newPart);

    return newPart;
  }

  /**
   * Builds a string containing a {@link path} starting from this fragment.
   *
   * @returns The {@link path} property value.
   */
  toString(): string {
    return this.path;
  }

  /**
   * Builds a string containing a serialized version of the path.
   *
   * @returns {@link toString String representation} of the path.
   */
  toJSON(): string {
    return this.toString();
  }

}

class UcRoute$Data {

  readonly #path: string;
  #fragments: readonly string[] | undefined;
  readonly #parts: (UcRoute | undefined)[];

  constructor(path: string, firstPart: UcRoute) {
    this.#path = path;
    this.#parts = [firstPart];
  }

  get path(): string {
    return this.#path;
  }

  get fragments(): readonly string[] {
    return (this.#fragments ??= this.#parseFragments());
  }

  #parseFragments(): readonly string[] {
    let path = this.#path;
    let leadingSlash = false;
    let trailingSlash = false;

    if (path.startsWith('/')) {
      path = path.slice(1);
      leadingSlash = true;
    }
    if (path.endsWith('/')) {
      path = path.slice(0, -1);
      trailingSlash = true;
    }
    if (!path) {
      return [this.#path];
    }

    const fragments = path.split('/').filter((fragment, index, fragments) => {
      if (fragment === '.') {
        if (index + 1 === fragments.length && fragments.length > 1) {
          trailingSlash = true;
        }

        return false;
      }

      return true;
    });
    let i = 0;

    while (i < fragments.length) {
      const fragment = fragments[i];

      if (fragment === '..') {
        if (i) {
          fragments.splice(i - 1, 2);
          --i;
        } else {
          fragments.splice(i, 1);
        }

        continue;
      }

      ++i;
    }

    if (!fragments.length || (fragments.length === 1 && !fragments[0])) {
      return leadingSlash || trailingSlash ? ['/'] : [''];
    }

    if (leadingSlash) {
      fragments[0] = '/' + fragments[0];
    }
    if (trailingSlash) {
      fragments[fragments.length - 1] += '/';
    }

    return fragments;
  }

  findPart(index: number): UcRoute | undefined {
    return this.#parts[index];
  }

  setPart(index: number, route: UcRoute): void {
    this.#parts[index] = route;
  }

}
