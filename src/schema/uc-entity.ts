import { URIChargeable } from '../charge/uri-chargeable.js';

/**
 * Unrecognized URI charge entity.
 *
 * This representation is used when entity is not recognized by {@link URIChargeParser parser},
 * charge {@link URIChargeRx receiver}, or one of {@link URIChargeExt extensions}.
 */

export class UcEntity implements URIChargeable {

  readonly #raw: string;

  /**
   * Constructs unrecognized entity.
   *
   * @param raw - The entity as is, with leading `!` and _not_ URI-decoded.
   */
  constructor(raw: string) {
    this.#raw = raw;
  }

  /**
   * The entity as is, with leading `!` and _not_ URI-decoded.
   */
  get raw(): string {
    return this.#raw;
  }

  get [Symbol.toStringTag](): string {
    return 'UcEntity';
  }

  [Symbol.toPrimitive](): string {
    return this.#raw;
  }

  valueOf(): string {
    return this.#raw;
  }

  /**
   * Encodes this entity into URI charge.
   *
   * @param _placement - The ignored placement of encoded entity.
   *
   * @returns The entity {@link raw as is}.
   */
  chargeURI(_placement: URIChargeable.Placement): string {
    return this.#raw;
  }

  /**
   * String representation of the entity.
   *
   * @returns The {@link chargeURI encoded} entity.
   */
  toString(): string {
    return this.chargeURI({});
  }

}
