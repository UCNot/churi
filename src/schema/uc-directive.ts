import { chargeURI } from '../charge/charge-uri.js';
import { URIChargeable } from '../charge/uri-chargeable.js';
import { UcPrimitive } from './uc-primitive.js';

/**
 * Unrecognized URI charge directive.
 *
 * This representation is used when directive is not recognized by {@link URIChargeParser parser},
 * charge {@link URIChargeRx receiver}, or one of {@link URIChargeExt extensions}.
 *
 * @typeParam TArg - Directive argument type.
 */

export class UcDirective<out TArg = UcPrimitive> implements URIChargeable {

  readonly #rawName: string;
  readonly #arg: TArg;
  readonly #rawArg: boolean;

  /**
   * Constructs unrecognized URI directive.
   *
   * @param rawName - Directive name as is, with leading `!`. _Not_ URI-decoded.
   * @param arg - Directive argument charge.
   * @param rawArg - Whether directive argument is raw. If so, the argument won't be enclosed into parentheses.
   */
  constructor(rawName: string, arg: TArg, rawArg = false) {
    this.#rawName = rawName;
    this.#arg = arg;
    this.#rawArg = rawArg;
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
  get arg(): TArg {
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

    return omitParentheses || this.#rawArg
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
