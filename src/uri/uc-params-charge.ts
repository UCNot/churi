import { parseURICharge } from '#churi/uri-charge/deserializer';
import { URICharge } from '../charge/uri-charge.js';
import { URICharge$List } from '../deserializer/impl/uri-charge.some.js';
import type { UcSearchParams } from './uc-search-params.js';

/**
 * The charge of {@link UcSearchParams URI search parameters}.
 *
 * Allows to parse search parameter values in URI charge format.
 *
 * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
 */
export class UcParamsCharge<out TCharge = URICharge> {

  readonly #params: UcSearchParams;
  readonly #parser: UcParamsCharge.Parser<TCharge>;
  readonly #charges = new Map<string, TCharge>();

  /**
   * Constructs the charge of URI search parameters.
   *
   * @param params - Source search parameters.
   * @param parser - Parser of parameter charges.
   */
  constructor(
    params: UcSearchParams,
    ...parser: URICharge extends TCharge
      ? [UcParamsCharge.Parser?]
      : [UcParamsCharge.Parser<TCharge>]
  );

  constructor(params: UcSearchParams, parser = UcParamsCharge$parse) {
    this.#params = params;
    this.#parser = parser;
  }

  /**
   * Parser of parameter charges.
   */
  get parser(): UcParamsCharge.Parser<TCharge> {
    return this.#parser;
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

export namespace UcParamsCharge {
  /**
   * Parser of URI search parameter charge.
   *
   * Builds parameter charge by raw URI parameter values.
   *
   * @typeParam TCharge - URI charge representation type. {@link URICharge} by default.
   * @param rawValues - Array of {@link UcRawParams#getAll raw parameter values} as they present in URI (i.e. not
   * URI-decoded). Empty for absent parameter.
   * @param name - Target parameter name.
   * @param params - URI search parameters instance.
   *
   * @returns Parameter charge.
   */
  export type Parser<out TCharge = URICharge> = (
    this: void,
    rawValues: string[],
    name: string,
    params: UcSearchParams,
  ) => TCharge;
}

function UcParamsCharge$parse(rawValues: string[], _key: string, _params: UcSearchParams): any {
  if (rawValues.length < 2) {
    return rawValues.length ? parseURICharge(rawValues[0]) : URICharge.none;
  }

  return new URICharge$List(
    rawValues
      .map(rawValue => parseURICharge(rawValue))
      .filter<URICharge.Some>((charge: URICharge): charge is URICharge.Some => charge.isSome()),
  );
}
