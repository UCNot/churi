import { parseURICharge } from '#churi/uri-charge/deserializer';
import { URICharge$List } from '../schema/uri-charge/uri-charge.impl.js';
import { URICharge } from '../schema/uri-charge/uri-charge.js';
import type { ChURIParams } from './churi-params.js';

/**
 * A charge of {@link ChURIParams URI parameters}.
 *
 * Allows to parse parameter values in URI charge format.
 *
 * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
 */
export class ChURIParamsCharge<out TCharge = URICharge> {

  #arg: TCharge | typeof ChURIParamsCharge$NoArgs = ChURIParamsCharge$NoArgs;
  readonly #params: ChURIParams;
  readonly #parser: ChURIParamsCharge.Parser<TCharge>;
  readonly #charges = new Map<string, TCharge>();

  /**
   * Constructs a charge of URI search parameters.
   *
   * @param params - Source search parameters.
   * @param parser - Parser of parameter charges.
   */
  constructor(
    params: ChURIParams,
    ...parser: URICharge extends TCharge
      ? [ChURIParamsCharge.Parser?]
      : [ChURIParamsCharge.Parser<TCharge>]
  );

  constructor(params: ChURIParams, parser = ChURIParamsCharge$parse) {
    this.#params = params;
    this.#parser = parser;
  }

  /**
   * Parser of parameter charges.
   */
  get parser(): ChURIParamsCharge.Parser<TCharge> {
    return this.#parser;
  }

  /**
   * Obtains a charge of positional argument.
   *
   * The very first parameter is treated as positional argument unless it is contains an _equals sign_ (`= (U+003D)`),
   * i.e. the first _named_ parameter name and value.
   */
  get arg(): TCharge {
    if (this.#arg === ChURIParamsCharge$NoArgs) {
      const { arg } = this.#params.raw;

      this.#arg = this.#parser(arg == null ? [] : [arg], null, this.#params);
    }

    return this.#arg as TCharge;
  }

  /**
   * Obtains a charge of the named parameter.
   *
   * @param name - Target parameter name.
   *
   * @returns Parameter charge.
   */
  get(name: string): TCharge {
    if (this.#charges.has(name)) {
      return this.#charges.get(name) as TCharge;
    }

    const rawValues = this.#params.raw.getAll(name);
    const charge = this.parser(rawValues, name, this.#params);

    this.#charges.set(name, charge);

    return charge;
  }

}

const ChURIParamsCharge$NoArgs = {};

export namespace ChURIParamsCharge {
  /**
   * Parser of URI search parameter charge.
   *
   * Builds parameter charge by raw URI parameter values.
   *
   * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
   * @param rawValues - Array of {@link UcRawParams#getAll raw parameter values} as they present in URI (i.e. not
   * URI-decoded). Empty for absent parameter.
   * @param name - Target parameter name, or `null` to parse {@link ChURIRawParams#arg positional argument}.
   * @param params - URI search parameters instance.
   *
   * @returns Parameter charge.
   */
  export type Parser<out TCharge = URICharge> = (
    this: void,
    rawValues: string[],
    name: string | null,
    params: ChURIParams,
  ) => TCharge;
}

function ChURIParamsCharge$parse(
  rawValues: string[],
  _key: string | null,
  _params: ChURIParams,
): any {
  if (rawValues.length < 2) {
    return rawValues.length ? parseURICharge(rawValues[0]) : URICharge.none;
  }

  return new URICharge$List(
    rawValues
      .map(rawValue => parseURICharge(rawValue))
      .filter<URICharge.Some>((charge: URICharge): charge is URICharge.Some => charge.isSome()),
  );
}
