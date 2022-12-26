import { chargeURI } from '../charge/charge-uri.js';
import { URIChargeable } from '../charge/uri-chargeable.js';

/**
 * Unrecognized URI charge directive.
 *
 * This representation is used when directive is not recognized by {@link URIChargeParser parser},
 * charge {@link URIChargeRx receiver}, or one of {@link URIChargeExt extensions}.
 */

export class UcDirective implements URIChargeable {

  readonly #rawName: string;
  readonly #rawArg: string;

  /**
   * Constructs unrecognized URI directive.
   *
   * @param rawName - Directive name as is, with leading `!`. _Not_ URI-decoded.
   * @param rawArg - Directive argument as is, including opening and closing parentheses. _Not_ URI-decoded.
   */
  constructor(rawName: string, rawArg: string) {
    this.#rawName = rawName;
    this.#rawArg = rawArg;
  }

  /**
   * Directive name as is, with leading `!`. _Not_ URI-decoded.
   */
  get rawName(): string {
    return this.#rawName;
  }

  /**
   * Directive argument as is, including opening and closing parentheses. _Not_ URI-decoded.
   */
  get rawArg(): string {
    return this.#rawArg;
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
    return this.#rawName + this.#rawArg;
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
