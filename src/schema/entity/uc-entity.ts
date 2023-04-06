import { Ucrx } from '../../rx/ucrx.js';
import { Uctx } from '../../rx/uctx.js';
import { UcLexer } from '../../syntax/uc-lexer.js';
import { URIChargeable } from '../uri-chargeable.js';

/**
 * Opaque URI charge entity.
 *
 * This representation is used when entity is not recognized by parser.
 */

export class UcEntity implements URIChargeable, Uctx {

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
   * Represents this entity as charge and transfers it to the given charge receiver.
   *
   * @param rx - Charge receiver.
   */
  toUc(rx: Ucrx): void {
    rx.ent(UcLexer.scan(this.raw));
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
