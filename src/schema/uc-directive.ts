import { chargeURI } from '../charge/charge-uri.js';
import { URIChargeable } from '../charge/uri-chargeable.js';
import { UcPrimitive } from './uc-primitive.js';

/**
 * Unrecognized URI charge directive.
 *
 * This representation is used when directive is not recognized by {@link URIChargeParser parser},
 * charge {@link URIChargeRx receiver}, or one of {@link URIChargeExt extensions}.
 *
 * @typeParam TCharge - Directive argument charge representation type.
 */

export class UcDirective<out TCharge = UcPrimitive> implements URIChargeable {

  readonly #rawName: string;
  readonly #arg: TCharge;

  /**
   * Constructs unrecognized URI directive.
   *
   * @param rawName - Directive name as is, with leading `!` and _not_ URI-decoded.
   * @param args - Directive argument charge.
   */
  constructor(rawName: string, args: TCharge) {
    this.#rawName = rawName;
    this.#arg = args;
  }

  /**
   * Directive name as is, with leading `!` and _not_ URI-decoded.
   */
  get rawName(): string {
    return this.#rawName;
  }

  /**
   * Directive argument charge.
   */
  get arg(): TCharge {
    return this.#arg;
  }

  get [Symbol.toStringTag](): string {
    return 'UcDirective';
  }

  /**
   * Encodes this directive into URI charge.
   *
   * @param _placement - The ignored placement of encoded directive.
   *
   * @returns The encoded directive.
   */
  chargeURI(_placement: URIChargeable.Placement): string {
    let omitParentheses = false;
    const encodedValue =
      chargeURI(this.#arg, {
        as: 'arg',
        omitParentheses() {
          omitParentheses = true;
        },
      }) ?? '--';

    return omitParentheses
      ? `${this.#rawName}${encodedValue}`
      : `${this.#rawName}(${encodedValue})`;
  }

  /**
   * String representation of the directive.
   *
   * @returns The {@link chargeURI encoded} directive.
   */
  toString(): string {
    return this.chargeURI({});
  }

}
