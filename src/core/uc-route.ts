import { lazyValue } from '@proc7ts/primitives';
import { createURIChargeParser } from '../charge/parse-uri-charge.js';
import { URIChargeParser } from '../charge/uri-charge-parser.js';
import { URICharge } from '../charge/uri-charge.js';
import { UcPrimitive } from '../schema/uc-primitive.js';
import { UcMatrixParams } from './uc-matrix-params.js';

/**
 * A route representing parsed URI {@link ChURI#pathname path}.
 *
 * Path consists of fragments separated by `"/" (U+002F)` symbols. An {@link UcRoute} instance refers to one of such
 * fragments. Other fragments of the path may be accessed by their {@link UcRoute#get relative indices}.
 *
 * @typeParam TMatrix - Matrix parameters representation type. {@link UcMatrixParams} by default.
 * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
 * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
 */
export class UcRoute<
  out TMatrix = UcMatrixParams,
  out TValue = UcPrimitive,
  out TCharge = URICharge<TValue>,
> {

  readonly #options: UcRoute.CustomMatrixOptions<TMatrix> &
    UcRoute.CustomParserOption<TValue, TCharge>;

  #data: UcRoute$Data<TMatrix, TValue, TCharge>;
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
    ...options: UcMatrixParams extends TMatrix
      ? UcPrimitive extends TValue
        ? URICharge<TValue> extends TCharge
          ? [UcRoute.Options<TMatrix, TValue, TCharge>?]
          : [UcRoute.Options<TMatrix, TValue, TCharge>]
        : [UcRoute.Options<TMatrix, TValue, TCharge>]
      : [UcRoute.Options<TMatrix, TValue, TCharge>]
  );

  constructor(
    path: string,
    {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      Matrix = UcMatrixParams as new (matrix: string) => TMatrix,
      parser = /*#__PURE__*/ createURIChargeParser() as URIChargeParser<TValue, TCharge>,
    }: Partial<UcRoute.Options<TMatrix, TValue, TCharge>> = {},
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

    return this.chargeParser.parse(charge).charge;
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
  get chargeParser(): URIChargeParser<TValue, TCharge> {
    return this.#data.chargeParser;
  }

  /**
   * Obtains the fragment of the path by relative index.
   *
   * @param index - Index of target fragment relative to {@link index current one}.
   *
   * @returns Either the fragment under the given `index`, or `undefined` if there is no such fragment.
   */
  get(index: number): UcRoute<TMatrix, TValue, TCharge> | undefined {
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
  protected createFragment(_index: number): UcRoute<TMatrix, TValue, TCharge> {
    return new (this.constructor as typeof UcRoute<TMatrix, TValue, TCharge>)('', this.#options);
  }

}

export namespace UcRoute {
  /**
   * Options for charged URI route construction.
   *
   * @typeParam TMatrix - Matrix parameters representation type. {@link UcMatrixParams} by default.
   * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
   * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
   */
  export type Options<
    TMatrix = UcMatrixParams,
    TValue = UcPrimitive,
    TCharge = URICharge<TValue>,
  > = MatrixOptions<TMatrix> & ParserOptions<TValue, TCharge>;

  export type MatrixOptions<TMatrix = UcMatrixParams> = UcMatrixParams extends TMatrix
    ? Partial<CustomMatrixOptions<TMatrix>>
    : CustomMatrixOptions<TMatrix>;

  export interface CustomMatrixOptions<TMatrix> {
    /**
     * Constructor of matrix parameters representation.
     */
    readonly Matrix: new (matrix: string) => TMatrix;
  }

  export type ParserOptions<
    TValue = UcPrimitive,
    TCharge = URICharge<TValue>,
  > = UcPrimitive extends TValue
    ? URICharge<TValue> extends TCharge
      ? Partial<CustomParserOption<TValue, TCharge>>
      : CustomParserOption<TValue, TCharge>
    : CustomParserOption<TValue, TCharge>;

  export interface CustomParserOption<TValue, TCharge> {
    /**
     * Parser to use to parse fragment's {@link UcRoute.charge} charges.
     */
    readonly parser: URIChargeParser<TValue, TCharge>;
  }
}

const CHURI_NAME_DELIMITER_PATTERN = /[,()]/;

interface UcRoute$Parts {
  readonly name: string;
  readonly charge: string;
  readonly matrix: string | undefined;
}

class UcRoute$Data<out TMatrix, out TValue, out TCharge> {

  readonly #path: string;
  readonly #chargeParser: URIChargeParser<TValue, TCharge>;
  #fragments: readonly string[] | undefined;
  readonly #parts: (UcRoute<TMatrix, TValue, TCharge> | undefined)[];

  constructor(
    path: string,
    chargeParser: URIChargeParser<TValue, TCharge>,
    firstPart: UcRoute<TMatrix, TValue, TCharge>,
  ) {
    this.#path = path;
    this.#chargeParser = chargeParser;
    this.#parts = [firstPart];
  }

  get path(): string {
    return this.#path;
  }

  get chargeParser(): URIChargeParser<TValue, TCharge> {
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

  findPart(index: number): UcRoute<TMatrix, TValue, TCharge> | undefined {
    return this.#parts[index];
  }

  setPart(index: number, route: UcRoute<TMatrix, TValue, TCharge>): void {
    this.#parts[index] = route;
  }

}
