import { parseURICharge } from '#churi/uri-charge/deserializer';
import { lazyValue } from '@proc7ts/primitives';
import { URICharge } from '../schema/uri-charge/uri-charge.js';
import { ChURIMatrix } from './churi-params.js';

/**
 * A route representing parsed URI {@link ChURI#pathname path}.
 *
 * Path consists of fragments separated by `"/" (U+002F)` symbols. An {@link ChURIRoute} instance refers to one of such
 * fragments. Other fragments of the path may be accessed by their {@link ChURIRoute#get relative indices}.
 *
 * @typeParam TMatrix - Matrix parameters representation type. {@link ChURIMatrix} by default.
 * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
 */
export class ChURIRoute<out TMatrix = ChURIMatrix, out TCharge = URICharge> {

  readonly #options: UcRoute.CustomMatrixOptions<TMatrix> & UcRoute.CustomParserOption<TCharge>;

  #data: UcRoute$Data<TMatrix, TCharge>;
  #index = 0;
  #fragment?: string;
  #path?: string;
  #parts?: UcRoute$Parts;
  #matrix?: TMatrix;
  readonly #getCharge: () => TCharge;

  /**
   * Constructs a route referring the very first fragment of the `path`.
   *
   * @param path - Full URI path.
   * @param options - Constructor options.
   */
  constructor(
    path: string,
    ...options: ChURIMatrix extends TMatrix
      ? URICharge extends TCharge
        ? [UcRoute.Options<TMatrix, TCharge>?]
        : [UcRoute.Options<TMatrix, TCharge>]
      : [UcRoute.Options<TMatrix, TCharge>]
  );

  constructor(
    path: string,
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Matrix = ChURIMatrix as new (matrix: string) => TMatrix,
      parser = parseURICharge as (input: string) => TCharge,
    }: Partial<UcRoute.CustomMatrixOptions<TMatrix> & UcRoute.CustomParserOption<TCharge>> = {},
  ) {
    this.#options = {
      Matrix,
      parser,
    };
    this.#data = new UcRoute$Data(path, parser, this);
    this.#index = 0;
    this.#getCharge = lazyValue(() => this.#parseCharge());
  }

  #getParts(): UcRoute$Parts {
    return (this.#parts ??= this.#splitParts());
  }

  #splitParts(): UcRoute$Parts {
    let rawFragment = this.#rawFragment;

    if (rawFragment.startsWith('/')) {
      rawFragment = rawFragment.endsWith('/') ? rawFragment.slice(1, -1) : rawFragment.slice(1);
    } else if (rawFragment.endsWith('/')) {
      rawFragment = rawFragment.slice(0, -1);
    }

    const matrixStart = rawFragment.indexOf(';');
    let charge: string;
    let matrix: string | undefined;

    if (matrixStart < 0) {
      charge = rawFragment;
    } else {
      charge = rawFragment.slice(0, matrixStart);
      matrix = rawFragment.slice(matrixStart + 1);
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
      charge,
      matrix,
    };
  }

  #parseCharge(): TCharge {
    const { charge } = this.#getParts();

    return this.chargeParser(charge);
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
   * Unlike {@link fragment}, the name does not contain fragment {@link charge} or {@link matrix} parameters. It also
   * omits slashes.
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
   * Referred fragment's charge parsed with {@link chargeParser charge parser}.
   */
  get charge(): TCharge {
    return this.#getCharge();
  }

  /**
   * Matrix parameters of the path fragment.
   */
  get matrix(): TMatrix {
    return (this.#matrix ??= new this.#options.Matrix(this.#getParts().matrix ?? ''));
  }

  /**
   * Parser used to parse path fragment's {@link charge} and {@link matrix matrix parameters} charge.
   */
  get chargeParser(): (input: string) => TCharge {
    return this.#data.chargeParser;
  }

  /**
   * Obtains the fragment of the path by relative index.
   *
   * @param index - Index of target fragment relative to {@link index current one}.
   *
   * @returns Either the fragment under the given `index`, or `undefined` if there is no such fragment.
   */
  get(index: number): ChURIRoute<TMatrix, TCharge> | undefined {
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
  protected createFragment(_index: number): ChURIRoute<TMatrix, TCharge> {
    return new (this.constructor as typeof ChURIRoute<TMatrix, TCharge>)(
      '',
      this.#options as UcRoute.Options<TMatrix, TCharge>,
    );
  }

}

export namespace UcRoute {
  /**
   * Options for charged URI route construction.
   *
   * @typeParam TMatrix - Matrix parameters representation type. {@link ChURIMatrix} by default.
   * @typeParam TCharge - Route charge representation type. {@link URICharge} by default.
   */
  export type Options<TMatrix = ChURIMatrix, TCharge = URICharge> = MatrixOptions<TMatrix> &
    ParserOptions<TCharge>;

  export type MatrixOptions<TMatrix = ChURIMatrix> = ChURIMatrix extends TMatrix
    ? Partial<CustomMatrixOptions<TMatrix>>
    : CustomMatrixOptions<TMatrix>;

  export interface CustomMatrixOptions<TMatrix> {
    /**
     * Constructor of matrix parameters representation.
     */
    readonly Matrix: new (matrix: string) => TMatrix;
  }

  export type ParserOptions<TCharge = URICharge> = URICharge extends TCharge
    ? DefaultParserOption
    : CustomParserOption<TCharge>;

  export interface DefaultParserOption {
    /**
     * Parser to use to parse fragment's {@link ChURIRoute#charge charge}.
     */
    readonly parser?: ((input: string) => URICharge) | undefined;
  }
  export interface CustomParserOption<TCharge> {
    /**
     * Parser to use to parse fragment's {@link ChURIRoute#charge charge}.
     */
    readonly parser: (input: string) => TCharge;
  }
}

const CHURI_NAME_DELIMITER_PATTERN = /[,()]/;

interface UcRoute$Parts {
  readonly name: string;
  readonly charge: string;
  readonly matrix: string | undefined;
}

class UcRoute$Data<out TMatrix, out TCharge> {

  readonly #path: string;
  readonly #chargeParser: (input: string) => TCharge;
  #fragments: readonly string[] | undefined;
  readonly #parts: (ChURIRoute<TMatrix, TCharge> | undefined)[];

  constructor(
    path: string,
    chargeParser: (input: string) => TCharge,
    firstPart: ChURIRoute<TMatrix, TCharge>,
  ) {
    this.#path = path;
    this.#chargeParser = chargeParser;
    this.#parts = [firstPart];
  }

  get path(): string {
    return this.#path;
  }

  get chargeParser(): (input: string) => TCharge {
    return this.#chargeParser;
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

  findPart(index: number): ChURIRoute<TMatrix, TCharge> | undefined {
    return this.#parts[index];
  }

  setPart(index: number, route: ChURIRoute<TMatrix, TCharge>): void {
    this.#parts[index] = route;
  }

}
