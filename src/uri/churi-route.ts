import { URICharge } from '../schema/uri-charge/uri-charge.js';
import { ChURIMatrix } from './churi-params.js';

/**
 * A route representing parsed URI {@link ChURI#pathname path}.
 *
 * Path consists of fragments separated by `"/" (U+002F)` symbols. An {@link ChURIRoute} instance refers to one of such
 * fragments. Other fragments of the path may be accessed by their {@link ChURIRoute#get relative indices}.
 *
 * @typeParam TMatrix - Matrix parameters representation type. {@link ChURIMatrix} by default.
 */
export class ChURIRoute<out TMatrix = ChURIMatrix> {

  readonly #options: ChURIRoute.CustomOptions<TMatrix>;

  #data: ChURIRoute$Data<TMatrix>;
  #index = 0;
  #fragment?: string;
  #path?: string;
  #parts?: UcRoute$Parts;
  #matrix?: TMatrix;

  /**
   * Constructs a route referring the very first fragment of the `path`.
   *
   * @param path - Full URI path.
   * @param options - Constructor options.
   */
  constructor(
    path: string,
    ...options: ChURIMatrix extends TMatrix
      ? [ChURIRoute.Options<TMatrix>?]
      : [ChURIRoute.Options<TMatrix>]
  );

  constructor(
    path: string,
    {
      override,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Matrix = ChURIMatrix,
    }: Partial<ChURIRoute.Options<TMatrix>> = {},
  ) {
    this.#options = { Matrix } as ChURIRoute.CustomOptions<TMatrix>;
    this.#data = new ChURIRoute$Data(path, override, this);
    this.#index = 0;
  }

  #getParts(): UcRoute$Parts {
    return (this.#parts ??= this.#splitParts());
  }

  #splitParts(): UcRoute$Parts {
    let raw = this.#rawFragment;

    if (raw.startsWith('/')) {
      raw = raw.endsWith('/') ? raw.slice(1, -1) : raw.slice(1);
    } else if (raw.endsWith('/')) {
      raw = raw.slice(0, -1);
    }

    const matrixStart = raw.indexOf(';');
    let charge: string;

    if (matrixStart < 0) {
      charge = raw;
    } else {
      charge = raw.slice(0, matrixStart);
    }

    const nameEnd = charge.search(CHURI_NAME_DELIMITER_PATTERN);
    let name: string;

    if (nameEnd < 0) {
      name = charge.startsWith('$') || charge.startsWith("'") ? charge.slice(1) : charge;
    } else if (charge.startsWith('$')) {
      name = charge.slice(1, nameEnd);
    } else {
      const nameDelimiter = charge[nameEnd];

      name = charge.slice(nameDelimiter !== '(' && charge.startsWith("'") ? 1 : 0, nameEnd);
    }

    return {
      name: decodeURIComponent(name),
      raw,
    };
  }

  /**
   * Full URI path as it were passed to constructor.
   */
  get fullPath(): string {
    return this.#data.path;
  }

  /**
   * The URI-decoded fragment of the {@link fullPath full path} this instance {@link index refers}.
   *
   * May contain leading slash for the first fragment if the path starts with `/`.
   *
   * May contain trailing slash for the last fragment if the path ends with `/`.
   */
  get fragment(): string {
    return (this.#fragment ??= decodeURIComponent(this.#rawFragment));
  }

  /**
   * The URI-decoded name of the {@link fragment} this instance refers.
   *
   * Unlike {@link fragment}, the name does not contain fragment charge or {@link matrix} parameters. It also omits
   * slashes.
   */
  get name(): string {
    return this.#getParts().name;
  }

  get #rawFragment(): string {
    return this.#data.fragments[this.#index];
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
   * Zero-based index of the path fragment this instance refers.
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
   * Matrix parameters of the path fragment.
   */
  get matrix(): TMatrix {
    return (this.#matrix ??= new this.#options.Matrix(this.#getParts().raw));
  }

  /**
   * Obtains the fragment of the path by relative index.
   *
   * @param index - Index of target fragment relative to {@link index current one}.
   *
   * @returns Either the fragment under the given `index`, or `undefined` if there is no such fragment.
   */
  get(index: number): ChURIRoute<TMatrix> | undefined {
    const { fragments } = this.#data;

    index += this.#index;

    const part = this.#data.findPart(index);

    if (part) {
      return part;
    }
    if (!(index in fragments)) {
      return;
    }

    const newPart = this.createFragment(index);

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

  /**
   * Creates a fragment of the path at the given `index`.
   *
   * Calls class constructor by default.
   *
   * @param _index - Index of the path fragment.
   *
   * @returns New path fragment.
   */
  protected createFragment(_index: number): ChURIRoute<TMatrix> {
    return new (this.constructor as typeof ChURIRoute<TMatrix>)(
      '',
      this.#options as ChURIRoute.Options<TMatrix>,
    );
  }

}

export namespace ChURIRoute {
  /**
   * Options for charged URI route construction.
   *
   * @typeParam TMatrix - Matrix parameters representation type. {@link ChURIMatrix} by default.
   * @typeParam TCharge - Route charge representation type. {@link URICharge} by default.
   */
  export type Options<TMatrix = ChURIMatrix> = ChURIMatrix extends TMatrix
    ? DefaultOptions
    : CustomOptions<TMatrix>;

  export interface DefaultOptions {
    /**
     * Matrix parameters override.
     */
    readonly override?: string | undefined;

    /**
     * Constructor of matrix parameters representation.
     */
    readonly Matrix?: (new (matrix: string) => ChURIMatrix) | undefined;
  }

  export interface CustomOptions<out TMatrix> {
    /**
     * Matrix parameters override.
     */
    readonly override?: string | undefined;

    /**
     * Constructor of matrix parameters representation.
     */
    readonly Matrix: new (matrix: string) => TMatrix;
  }
}

const CHURI_NAME_DELIMITER_PATTERN = /[,()]/;

interface UcRoute$Parts {
  readonly name: string;
  readonly raw: string;
}

class ChURIRoute$Data<out TMatrix> {

  readonly #path: string;
  readonly #override: string | undefined;
  #fragments: readonly string[] | undefined;
  readonly #parts: (ChURIRoute<TMatrix> | undefined)[];

  constructor(path: string, override: string | undefined, firstPart: ChURIRoute<TMatrix>) {
    this.#path = path;
    this.#override = override;
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

    ChURIRoute$normalizeFragments(fragments);

    if (!fragments.length || (fragments.length === 1 && !fragments[0])) {
      return leadingSlash || trailingSlash ? ['/'] : [''];
    }

    if (this.#override) {
      ChURIRoute$overrideFragments(fragments, this.#override);
    }

    if (leadingSlash) {
      fragments[0] = '/' + fragments[0];
    }
    if (trailingSlash) {
      fragments[fragments.length - 1] += '/';
    }

    return fragments;
  }

  findPart(index: number): ChURIRoute<TMatrix> | undefined {
    return this.#parts[index];
  }

  setPart(index: number, route: ChURIRoute<TMatrix>): void {
    this.#parts[index] = route;
  }

}

function ChURIRoute$normalizeFragments(fragments: string[]): void {
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
}

function ChURIRoute$overrideFragments(fragments: string[], pathOverride: string): void {
  if (pathOverride.startsWith('/')) {
    pathOverride = pathOverride.slice(1);
  }

  const overrides = pathOverride.split('/').filter(fragment => fragment !== '.');

  ChURIRoute$normalizeFragments(overrides);

  for (let i = 0; i < fragments.length; ++i) {
    if (i >= overrides.length) {
      break;
    }

    const override = overrides[i];

    if (override.startsWith('*')) {
      fragments[i] += override.slice(1);
    } else {
      fragments[i] = override;
    }
  }
}
