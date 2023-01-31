import { UcPrimitive } from '../schema/uc-primitive.js';
import { unchargeEntities } from '../uncharge/uncharge-entities.js';
import { UcEntityParser } from './impl/uc-entity-parser.js';
import { parseUcValue } from './impl/uc-value-parser.js';
import { URIChargeRx } from './uri-charge-rx.js';
import { URIUncharger } from './uri-uncharger.js';

/**
 * Parser of strings containing URI charge.
 *
 * @typeParam TValue - Base value type contained in URI charge. {@link UcPrimitive} by default.
 * @typeParam TCharge - URI charge representation type.
 */
export class URIChargeParser<out TValue = UcPrimitive, out TCharge = unknown> {

  readonly #rx: URIChargeRx<TValue, TCharge>;
  readonly #uncharger: UcEntityParser<TValue, TCharge>;

  /**
   * Constructs URI charge parser.
   *
   * @param options - Parser options.
   */
  constructor(options: URIChargeParser.Options<TValue, TCharge>);

  constructor({ rx, recognize }: URIChargeParser.Options<TValue, TCharge>) {
    this.#rx = rx;
    this.#uncharger = new UcEntityParser(this, recognize);
  }

  /**
   * URI charge receiver.
   */
  get chargeRx(): URIChargeRx<TValue, TCharge> {
    return this.#rx;
  }

  /**
   * Parses URI charge from the given input.
   *
   * @param input - Input string containing encoded URI charge.
   * @param rx - Optional URI charge value receiver. New one will be {@link URIChargeRx.rxValue created} if omitted.
   *
   * @returns Parse result containing charge representation.
   */
  parse(input: string, rx?: URIChargeRx.ValueRx<TValue, TCharge>): URIChargeParser.Result<TCharge> {
    if (rx) {
      const end = this.#parse(input, rx);

      return { charge: rx.end(), end };
    }

    let end!: number;
    const charge = this.chargeRx.rxValue(rx => {
      end = this.#parse(input, rx);

      return rx.end();
    });

    return { charge, end };
  }

  #parse(input: string, rx: URIChargeRx.ValueRx<TValue, TCharge>): number {
    return parseUcValue(rx, this.#uncharger, input);
  }

}

export namespace URIChargeParser {
  /**
   * Options for {@link URIChargeParser URI charge parser}.
   *
   * @typeParam TValue - Base value type contained in URI charge.
   * @typeParam TCharge - URI charge representation type.
   */
  export interface Options<out TValue, out TCharge> {
    /**
     * URI charge receiver.
     */
    readonly rx: URIChargeRx<TValue, TCharge>;

    /**
     * Specifies additional URI uncharger(s).
     *
     * Only {@link unchargeEntities standard entities} recognized when omitted. Only specified entities recognized
     * the given present. The {@link unchargeEntities} has to be specified explicitly in the latter case if standard
     * entities support is desired.
     */
    readonly recognize?: URIUncharger.Spec<TValue, TCharge> | undefined;
  }

  /**
   * URI charge parse result.
   *
   * @typeParam TCharge - Parsed URI charge representation type.
   */
  export interface Result<out TCharge> {
    /**
     * Parsed charge, potentially {@link URIChargeRx#none none}.
     */
    readonly charge: TCharge;

    /**
     * The offset in the input the parser stopped at.
     *
     * This is one greater than the index of the last interpreted character within the input string. Typically, this is
     * equal to the input string length, but this may also point to closing parentheses not matching any of the opening
     * ones.
     */
    readonly end: number;
  }
}
