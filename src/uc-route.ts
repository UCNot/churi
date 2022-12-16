import { lazyValue } from '@proc7ts/primitives';
import { createURIChargeParser } from './charge/parse-uri-charge.js';
import { UcPrimitive } from './charge/uc-value.js';
import { URIChargeParser } from './charge/uri-charge-parser.js';
import { URICharge } from './charge/uri-charge.js';
import { UcMatrixParams } from './uc-matrix-params.js';

/**
 * Route representing parsed URI {@link ChURI#pathname path}.
 *
 * Route consists of fragments separated by `"/" (U+002F)` symbols. Each fragment is represented by its own
 * {@link UcRoute} instance. Other fragments of the path are available by their {@link UcRoute#get indices}.
 *
 * @typeParam TValue - Base value type contained in URI charge.
 * @typeParam TCharge - URI charge representation type.
 */
export class UcRoute<out TValue = UcPrimitive, out TCharge = URICharge<TValue>> {

  #data: UcRoute$Data<TValue, TCharge>;
  #index = 0;
  #fragment?: string;
  #path?: string;
  #parts?: UcRoute$Parts;
  readonly #getCharge: () => TCharge;
  #matrix?: UcMatrixParams<TValue, TCharge>;

  /**
   * Constructs the first fragment of the path.
   *
   * @param path - Full URI path.
   * @param chargeParser - URI charge parser to use to parse route fragment {@link charge} and {@link matrix}
   * parameters.
   */
  constructor(
    path: string,
    ...chargeParser: UcPrimitive extends TValue
      ? URICharge<TValue> extends TCharge
        ? [URIChargeParser<TValue, TCharge>?]
        : [URIChargeParser<TValue, TCharge>]
      : [URIChargeParser<TValue, TCharge>]
  );

  constructor(
    path: string,
    chargeParser: URIChargeParser<TValue, TCharge> = createURIChargeParser() as URIChargeParser<
      TValue,
      TCharge
    >,
  ) {
    this.#data = new UcRoute$Data(path, chargeParser, this);
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
    let nameAndCharge: string;
    let matrix: string | undefined;

    if (matrixStart < 0) {
      nameAndCharge = rawFragment;
    } else {
      nameAndCharge = rawFragment.slice(0, matrixStart);
      matrix = rawFragment.slice(matrixStart + 1);
    }

    const chargeStart = nameAndCharge.indexOf('(');
    let name: string;
    let charge: string | undefined;

    if (chargeStart < 0) {
      name = nameAndCharge;
    } else {
      name = nameAndCharge.slice(0, chargeStart);
      charge = nameAndCharge.slice(chargeStart);
    }

    return {
      name: decodeURIComponent(name),
      charge,
      matrix,
    };
  }

  #parseCharge(): TCharge {
    const { charge } = this.#getParts();

    if (charge == null) {
      return this.chargeParser.chargeRx.none;
    }

    return this.chargeParser.parseArgs(charge).charge;
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
    return (this.#fragment ??= decodeURIComponent(this.#rawFragment));
  }

  /**
   * The URI-decoded fragment name under {@link index} of the {@link fullPath full path} this instance represents.
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
   * Route fragment charge parsed with {@link chargeParser charge parser}.
   */
  get charge(): TCharge {
    return this.#getCharge();
  }

  /**
   * Matrix parameters of the route fragment.
   */
  get matrix(): UcMatrixParams<TValue, TCharge> {
    return (this.#matrix ??= new UcMatrixParams(this.#getParts().matrix ?? '', this.chargeParser));
  }

  /**
   * URI charge parser used to parse route fragment {@link charge} and {@link matrix} parameters.
   */
  get chargeParser(): URIChargeParser<TValue, TCharge> {
    return this.#data.chargeParser;
  }

  /**
   * Obtains the fragment of the path with the given index.
   *
   * @param index - Index of target fragment relative to {@link index current one}.
   *
   * @returns Either the fragment under the given `index`, or `undefined` if there is no such fragment.
   */
  get(index: number): UcRoute<TValue, TCharge> | undefined {
    const { fragments } = this.#data;

    index += this.#index;

    const part = this.#data.findPart(index);

    if (part) {
      return part;
    }
    if (!(index in fragments)) {
      return;
    }

    const newPart = new UcRoute<TValue, TCharge>('', this.chargeParser);

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

interface UcRoute$Parts {
  readonly name: string;
  readonly charge: string | undefined;
  readonly matrix: string | undefined;
}

class UcRoute$Data<out TValue, out TCharge> {

  readonly #path: string;
  readonly #chargeParser: URIChargeParser<TValue, TCharge>;
  #fragments: readonly string[] | undefined;
  readonly #parts: (UcRoute<TValue, TCharge> | undefined)[];

  constructor(
    path: string,
    chargeParser: URIChargeParser<TValue, TCharge>,
    firstPart: UcRoute<TValue, TCharge>,
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

  findPart(index: number): UcRoute<TValue, TCharge> | undefined {
    return this.#parts[index];
  }

  setPart(index: number, route: UcRoute<TValue, TCharge>): void {
    this.#parts[index] = route;
  }

}
